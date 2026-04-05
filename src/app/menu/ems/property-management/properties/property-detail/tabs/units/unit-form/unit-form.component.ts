import { Component, inject, signal, OnInit, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipInputEvent, MatChipsModule, MatChipSelectionChange } from '@angular/material/chips';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { rxResource } from '@angular/core/rxjs-interop';
import { EstateUnitService } from '../../../../../../../../shared/services/estate-unit.service';
import { EstatePropertyService } from '../../../../../../../../shared/services/estate-property.service';
import {
  UnitType,
  UnitStatus,
  FurnishingStatus,
  SizeUnit,
  NON_LIVABLE_UNIT_TYPES,
} from '../../../../../../../../shared/models/estate.model';
import { StoreStore } from '../../../../../../../../shared/stores/store.store';
import { PageHeaderComponent } from '../../../../../../../../shared/components/page-header/page-header.component';

interface FilePreview {
  file: File;
  preview: string;
}

@Component({
  selector: 'app-unit-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatRadioModule,
    MatTooltipModule,
    PageHeaderComponent,
  ],
  templateUrl: './unit-form.component.html',
})
export class UnitFormComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private unitService = inject(EstateUnitService);
  private propertyService = inject(EstatePropertyService);
  private storeStore = inject(StoreStore);

  isEditMode = signal<boolean>(false);
  unitId = signal<string>('');
  isSaving = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  hasPropertyContext = signal<boolean>(false);
  private parentPropertyId = signal<string>('');
  unitName = signal<string>('');
  propertyName = signal<string>('');

  readonly pageTitle = computed(() => {
    if (this.isEditMode()) {
      const name = this.unitName();
      return name ? `Edit ${name}` : 'Edit Unit';
    }
    return 'New Unit';
  });

  readonly pageSubtitle = computed(() => {
    const prop = this.propertyName();
    if (this.isEditMode()) {
      return prop ? `Update unit details for ${prop}` : 'Update unit details';
    }
    return prop ? `Create a new unit for ${prop}` : 'Create a new unit';
  });

  readonly separatorKeyCodes = [ENTER, COMMA] as const;
  amenities = signal<string[]>([]);
  features = signal<string[]>([]);

  // Image uploads
  coverPhotoFile = signal<FilePreview | null>(null);
  coverPhotoUrl = signal<string>('');
  galleryFiles = signal<FilePreview[]>([]);
  existingGallery = signal<string[]>([]);

  // Attachments
  attachmentFiles = signal<File[]>([]);
  existingAttachments = signal<string[]>([]);

  private storeId = computed(() => this.storeStore.selectedStore()?._id || '');

  propertiesResource = rxResource({
    params: () => ({ storeId: this.storeId() }),
    stream: ({ params }) =>
      this.propertyService.getProperties(params.storeId, {
        limit: 100,
        status: 'ACTIVE',
      }),
  });

  properties = computed(
    () => this.propertiesResource.value()?.data?.items ?? [],
  );

  unitTypes = Object.values(UnitType).map((t) => ({
    value: t,
    label: t.replace(/_/g, ' '),
  }));

  statusOptions = Object.values(UnitStatus).map((s) => ({
    value: s,
    label: s.replace(/_/g, ' '),
  }));

  furnishingOptions = Object.values(FurnishingStatus).map((f) => ({
    value: f,
    label: f.replace(/_/g, ' '),
  }));

  sizeUnits = [
    { value: SizeUnit.SQM, label: 'Square Meters' },
    { value: SizeUnit.SQFT, label: 'Square Feet' },
  ];

  form: FormGroup = this.fb.group({
    property: ['', Validators.required],
    name: ['', Validators.required],
    code: [''],
    type: [UnitType.APARTMENT, Validators.required],
    description: [''],
    floor: [''],
    bedrooms: [null],
    bathrooms: [null],
    sizeValue: [null],
    sizeUnit: [SizeUnit.SQM],
    rentAmount: [0, [Validators.required, Validators.min(0)]],
    currency: ['NGN'],
    status: [UnitStatus.VACANT, Validators.required],
    furnishingStatus: [FurnishingStatus.UNFURNISHED],
    isAffordableHousing: [false],
  });

  // === Features ===
  readonly presetFeatures: string[] = [
    'Alarm', 'Furnished', 'Renovated', 'Hardwood floors', 'Fireplace',
    'Fresh paint', 'Dishwasher', 'Walk-in closets', 'Balcony, Deck, Patio',
    'Internet', 'Fenced yard', 'Tile', 'Carpet', 'Storage', 'Unfurnished',
  ];

  readonly customFeatures = computed(() =>
    this.features().filter((f) => !this.presetFeatures.includes(f)),
  );

  customFeatureInput = signal<string>('');

  // === Amenities presets ===
  readonly presetAmenities: string[] = [
    'Basketball court', 'BBQ', 'Business center', 'Clubhouse', 'Dog park',
    'Elevator', 'Fire pits', 'Fitness center', 'Game room', 'Hot tub',
    'Near park', 'On-site laundry', 'Pet washing station', 'Playground',
    'Pool', 'Tennis court', 'Theater room', 'Volleyball court',
  ];

  readonly customAmenities = computed(() =>
    this.amenities().filter((a) => !this.presetAmenities.includes(a)),
  );

  customAmenityInput = signal<string>('');

  ngOnInit(): void {
    // Resolve property ID from ancestor route (properties/:id)
    let r: ActivatedRoute | null = this.route;
    while (r) {
      const pid = r.snapshot.paramMap.get('id');
      if (pid && r !== this.route) {
        this.parentPropertyId.set(pid);
        this.hasPropertyContext.set(true);
        this.form.patchValue({ property: pid });
        break;
      }
      r = r.parent;
    }

    // Load property name for the subtitle
    if (this.hasPropertyContext() && this.parentPropertyId()) {
      this.propertyService.getPropertyById(this.parentPropertyId()).subscribe({
        next: (res) => this.propertyName.set(res.data?.name || ''),
      });
    }

    const id = this.route.snapshot.paramMap.get('id');
    const propertyId = this.route.snapshot.queryParamMap.get('propertyId');

    if (id) {
      this.isEditMode.set(true);
      this.unitId.set(id);
      this.loadUnit(id);
    } else if (propertyId && !this.hasPropertyContext()) {
      this.form.patchValue({ property: propertyId });
    }
  }

  private loadUnit(id: string): void {
    this.isLoading.set(true);
    this.unitService.getUnitById(id).subscribe({
      next: (res) => {
        const u = res.data;
        const propertyId =
          typeof u.property === 'string' ? u.property : u.property?._id;
        const resolvedPropertyId =
          propertyId || this.parentPropertyId() || this.form.get('property')?.value;
        this.form.patchValue({
          property: resolvedPropertyId,
          name: u.name,
          code: u.code,
          type: u.type,
          description: u.description,
          floor: u.floor,
          bedrooms: u.bedrooms,
          bathrooms: u.bathrooms,
          sizeValue: u.sizeValue,
          sizeUnit: u.sizeUnit,
          rentAmount: u.rentAmount,
          currency: u.currency,
          status: u.status,
          furnishingStatus: u.furnishingStatus,
          isAffordableHousing: u.isAffordableHousing ?? false,
        });
        this.unitName.set(u.name || '');
        // Resolve property name for subtitle
        const propObj = typeof u.property === 'object' ? u.property : null;
        if (propObj && (propObj as any).name) {
          this.propertyName.set((propObj as any).name);
        }
        this.amenities.set(u.amenities || []);
        this.features.set(u.features || []);
        if (u.coverPhoto) this.coverPhotoUrl.set(u.coverPhoto);
        this.existingGallery.set(u.gallery || []);
        this.existingAttachments.set(u.attachments || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load unit', 'Close', { duration: 5000 });
        this.isLoading.set(false);
      },
    });
  }

  // === Non-livable check ===
  isNonLivable(unitType: UnitType): boolean {
    return NON_LIVABLE_UNIT_TYPES.includes(unitType);
  }

  // === Amenities ===
  toggleAmenity(amenity: string, event?: MatChipSelectionChange): void {
    if (event && !event.isUserInput) return;
    if (this.amenities().includes(amenity)) {
      this.amenities.update((list) => list.filter((a) => a !== amenity));
    } else {
      this.amenities.update((list) => [...list, amenity]);
    }
  }

  hasAmenity(amenity: string): boolean {
    return this.amenities().includes(amenity);
  }

  removeAmenity(amenity: string): void {
    this.amenities.update((list) => list.filter((a) => a !== amenity));
  }

  addCustomAmenity(): void {
    const value = this.customAmenityInput().trim();
    if (value && !this.amenities().includes(value)) {
      this.amenities.update((list) => [...list, value]);
      this.customAmenityInput.set('');
    }
  }

  // === Features ===
  toggleFeature(feature: string, event?: MatChipSelectionChange): void {
    if (event && !event.isUserInput) return;
    if (this.features().includes(feature)) {
      this.features.update((list) => list.filter((f) => f !== feature));
    } else {
      this.features.update((list) => [...list, feature]);
    }
  }

  hasFeature(feature: string): boolean {
    return this.features().includes(feature);
  }

  removeFeature(feature: string): void {
    this.features.update((list) => list.filter((f) => f !== feature));
  }

  addCustomFeature(): void {
    const value = this.customFeatureInput().trim();
    if (value && !this.features().includes(value)) {
      this.features.update((list) => [...list, value]);
      this.customFeatureInput.set('');
    }
  }

  // === Photo Uploads ===
  onCoverPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.coverPhotoFile.set({ file, preview: e.target?.result as string });
    };
    reader.readAsDataURL(file);
  }

  removeCoverPhoto(): void {
    this.coverPhotoFile.set(null);
    this.coverPhotoUrl.set('');
  }

  onGalleryPhotosSelected(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files || []);
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.galleryFiles.update((list) => [
          ...list,
          { file, preview: e.target?.result as string },
        ]);
      };
      reader.readAsDataURL(file);
    });
  }

  removeGalleryFile(index: number): void {
    this.galleryFiles.update((list) => list.filter((_, i) => i !== index));
  }

  removeExistingGalleryPhoto(index: number): void {
    this.existingGallery.update((list) => list.filter((_, i) => i !== index));
  }

  // === Attachments ===
  onAttachmentsSelected(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files || []);
    this.attachmentFiles.update((list) => [...list, ...files]);
    (event.target as HTMLInputElement).value = '';
  }

  removeAttachment(index: number): void {
    this.attachmentFiles.update((list) => list.filter((_, i) => i !== index));
  }

  removeExistingAttachment(index: number): void {
    this.existingAttachments.update((list) => list.filter((_, i) => i !== index));
  }

  // === Submission ===
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    // Ensure property ID is always bound (fallback to parent context)
    const propertyId = formValue.property || this.parentPropertyId();

    // Base payload — unit-specific fields only
    const payload: Record<string, any> = {
      name: formValue.name,
      code: formValue.code || undefined,
      type: formValue.type,
      description: formValue.description || undefined,
      floor: formValue.floor || undefined,
      bedrooms: formValue.bedrooms ?? undefined,
      bathrooms: formValue.bathrooms ?? undefined,
      sizeValue: formValue.sizeValue ?? undefined,
      sizeUnit: formValue.sizeUnit,
      rentAmount: formValue.rentAmount,
      currency: formValue.currency,
      status: formValue.status,
      furnishingStatus: formValue.furnishingStatus,
      isAffordableHousing: formValue.isAffordableHousing ?? false,
      amenities: this.amenities(),
      features: this.features(),
      gallery: this.existingGallery(),
      attachments: this.existingAttachments(),
    };

    // Only include property & store on create (they must not change on update)
    if (!this.isEditMode()) {
      payload['property'] = propertyId;
      payload['store'] = this.storeStore.selectedStore()?._id;
    }

    this.isSaving.set(true);

    const request$ = this.isEditMode()
      ? this.unitService.updateUnit(this.unitId(), payload)
      : this.unitService.createUnit(payload);

    request$.subscribe({
      next: (res) => {
        const unitId = res.data?._id || this.unitId();
        this.uploadPhotosAfterSave(unitId);
      },
      error: (err) => {
        const msg =
          err?.error?.message ||
          `Failed to ${this.isEditMode() ? 'update' : 'create'} unit`;
        this.snackBar.open(msg, 'Close', { duration: 5000 });
        this.isSaving.set(false);
      },
    });
  }

  private uploadPhotosAfterSave(unitId: string): void {
    const coverFile = this.coverPhotoFile()?.file;
    const newGalleryFiles = this.galleryFiles().map((f) => f.file);
    const newAttachmentFiles = this.attachmentFiles();
    let pending = 0;

    if (coverFile) pending++;
    if (newGalleryFiles.length > 0) pending++;
    if (newAttachmentFiles.length > 0) pending++;

    if (pending === 0) {
      this.onSaveComplete();
      return;
    }

    let completed = 0;
    const checkDone = () => {
      completed++;
      if (completed >= pending) this.onSaveComplete();
    };

    if (coverFile) {
      this.unitService.uploadCoverPhoto(unitId, coverFile).subscribe({
        next: () => checkDone(),
        error: () => {
          this.snackBar.open('Cover photo upload failed', 'Close', { duration: 3000 });
          checkDone();
        },
      });
    }

    if (newGalleryFiles.length > 0) {
      this.unitService.uploadGalleryPhotos(unitId, newGalleryFiles).subscribe({
        next: () => checkDone(),
        error: () => {
          this.snackBar.open('Gallery upload failed', 'Close', { duration: 3000 });
          checkDone();
        },
      });
    }

    if (newAttachmentFiles.length > 0) {
      this.unitService.uploadAttachments(unitId, newAttachmentFiles).subscribe({
        next: () => checkDone(),
        error: () => {
          this.snackBar.open('Attachments upload failed', 'Close', { duration: 3000 });
          checkDone();
        },
      });
    }
  }

  private onSaveComplete(): void {
    this.snackBar.open(
      `Unit ${this.isEditMode() ? 'updated' : 'created'} successfully`,
      'Close',
      { duration: 3000 },
    );
    this.isSaving.set(false);
    this.navigateBack();
  }

  cancel(): void {
    this.navigateBack();
  }

  private navigateBack(): void {
    if (this.hasPropertyContext()) {
      // From create: ../lists  |  From :id/edit: ../../lists
      const segments = this.isEditMode() ? ['../../lists'] : ['../lists'];
      this.router.navigate(segments, { relativeTo: this.route });
    } else {
      this.router.navigate(['../../units'], { relativeTo: this.route });
    }
  }
}
