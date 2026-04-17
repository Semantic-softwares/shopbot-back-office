import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  NgZone,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  effect,
} from '@angular/core';
import { MatChipSelectionChange } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormArray,
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
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule } from '@angular/material/dialog';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { EstatePropertyService } from '../../../../../shared/services/estate-property.service';
import { EstateUnitService } from '../../../../../shared/services/estate-unit.service';
import {
  PropertyType,
  PropertyCategory,
  PropertyStatus,
  UnitType,
  SizeUnit,
  NON_LIVABLE_UNIT_TYPES,
} from '../../../../../shared/models/estate.model';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { CountrySelectComponent } from '../../../../../shared/components/country-select/country-select.component';
import { PropertyManagerSelectorComponent } from '../../../../../shared/components/property-manager-selector/property-manager-selector.component';
import { PropertyOwnerSelectorComponent } from '../../../../../shared/components/property-owner-selector/property-owner-selector.component';
import { Employee } from '../../../../../shared/models/employee.model';

declare const google: any;

interface FilePreview {
  file: File;
  preview: string;
}

@Component({
  selector: 'app-property-form',
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
    MatDividerModule,
    MatDialogModule,
    PageHeaderComponent,
    CountrySelectComponent,
    PropertyManagerSelectorComponent,
    PropertyOwnerSelectorComponent,
  ],
  templateUrl: './property-form.component.html',
  styleUrl: './property-form.component.scss',
})
export class PropertyFormComponent implements OnInit, AfterViewInit {
  @ViewChild('addressInput') addressInput!: ElementRef<HTMLInputElement>;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private propertyService = inject(EstatePropertyService);
  private unitService = inject(EstateUnitService);
  readonly storeStore = inject(StoreStore);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  isEditMode = signal<boolean>(false);
  propertyId = signal<string>('');
  isSaving = signal<boolean>(false);
  isLoading = signal<boolean>(false);

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

  // Preloaded manager for edit mode (passed to PropertyManagerSelectorComponent)
  readonly preloadedManagerForSelector = signal<Employee | null>(null);

  readonly PropertyCategory = PropertyCategory;
  readonly NON_LIVABLE_UNIT_TYPES = NON_LIVABLE_UNIT_TYPES;

  propertyTypes = Object.values(PropertyType).map((t) => ({
    value: t,
    label: t.replace(/_/g, ' '),
  }));

  unitTypes = Object.values(UnitType).map((t) => ({
    value: t,
    label: t.replace(/_/g, ' '),
  }));

  sizeUnits = [
    { value: SizeUnit.SQFT, label: 'sq ft' },
    { value: SizeUnit.SQM, label: 'sq m' },
  ];

  selectedCategory = signal<PropertyCategory>(PropertyCategory.MULTI_UNIT);

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    yearBuilt: [null],
    code: [''],
    category: [PropertyCategory.MULTI_UNIT, Validators.required],
    type: [PropertyType.ESTATE, Validators.required],
    description: [''],
    status: [PropertyStatus.ACTIVE, Validators.required],
    // Address fields
    street: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    postalCode: [''],
    country: ['', Validators.required],
    formattedAddress: [''],
    // Hidden geo
    latitude: [null],
    longitude: [null],
    // Single-unit rental fields
    bedrooms: [null],
    bathrooms: [null],
    sizeValue: [null],
    sizeUnit: [SizeUnit.SQFT],
    marketRent: [null],
    deposit: [null],
    currency: ['NGN'],
    // Property manager
    propertyManager: [''],
    // Multi-unit: FormArray of inline units
    units: this.fb.array([]),
    // Property owners
    owners: this.fb.array([]),
  });

  get unitsArray(): FormArray {
    return this.form.get('units') as FormArray;
  }

  get ownersArray(): FormArray {
    return this.form.get('owners') as FormArray;
  }

  get ownershipExceeds100(): boolean {
    let total = 0;
    for (let i = 0; i < this.ownersArray.length; i++) {
      total += Number(this.ownersArray.at(i).get('ownershipPercentage')?.value) || 0;
    }
    return total > 100;
  }

  isSingleUnit = computed(() => this.selectedCategory() === PropertyCategory.SINGLE_UNIT);
  isMultiUnit = computed(() => this.selectedCategory() === PropertyCategory.MULTI_UNIT);

  private autocompleteInitialized = false;

  constructor() {
    // Re-init Google Places after loading completes and view re-renders
    effect(() => {
      if (!this.isLoading() && !this.autocompleteInitialized) {
        // Defer to next microtask so the DOM is rendered
        setTimeout(() => this.initGooglePlacesAutocomplete());
      }
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.propertyId.set(id);
      this.loadProperty(id);
    }

    // Listen for category changes
    this.form.get('category')?.valueChanges.subscribe((category: PropertyCategory) => {
      this.selectedCategory.set(category);
    });

  }

  ngAfterViewInit(): void {
    this.initGooglePlacesAutocomplete();
  }

  private initGooglePlacesAutocomplete(): void {
    if (typeof google === 'undefined' || !google.maps?.places) return;
    if (!this.addressInput) return;
    if (this.autocompleteInitialized) return;
    this.autocompleteInitialized = true;

    const autocomplete = new google.maps.places.Autocomplete(
      this.addressInput.nativeElement,
      { types: ['address'] },
    );

    autocomplete.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const place = autocomplete.getPlace();
        if (!place.geometry) return;

        // Extract address components
        const components = place.address_components || [];
        let street = '';
        let city = '';
        let state = '';
        let country = '';
        let postalCode = '';

        for (const comp of components) {
          const types = comp.types;
          if (types.includes('street_number')) {
            street = comp.long_name + ' ';
          }
          if (types.includes('route')) {
            street += comp.long_name;
          }
          if (types.includes('locality') || types.includes('sublocality_level_1')) {
            city = comp.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            state = comp.long_name;
          }
          if (types.includes('country')) {
            country = comp.long_name;
          }
          if (types.includes('postal_code')) {
            postalCode = comp.long_name;
          }
        }

        this.form.patchValue({
          street: street.trim(),
          city,
          state,
          country,
          postalCode,
          formattedAddress: place.formatted_address || '',
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
        });
      });
    });
  }

  private loadProperty(id: string): void {
    this.isLoading.set(true);
    this.propertyService.getPropertyById(id).subscribe({
      next: (res) => {
        const p = res.data;
        this.selectedCategory.set(p.category || PropertyCategory.MULTI_UNIT);
        this.form.patchValue({
          name: p.name,
          code: p.code,
          category: p.category || PropertyCategory.MULTI_UNIT,
          type: p.type,
          description: p.description,
          status: p.status,
          street: p.address?.street,
          city: p.address?.city,
          state: p.address?.state,
          country: p.address?.country,
          postalCode: p.address?.postalCode,
          formattedAddress: p.address?.formattedAddress,
          latitude: p.location?.coordinates?.[1] ?? null,
          longitude: p.location?.coordinates?.[0] ?? null,
          yearBuilt: p.yearBuilt,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          sizeValue: p.sizeValue,
          sizeUnit: p.sizeUnit || SizeUnit.SQFT,
          marketRent: p.marketRent,
          deposit: p.deposit,
          currency: p.currency || 'NGN',
        });
        this.amenities.set(p.amenities || []);
        this.features.set(p.features || []);
        if (p.coverPhoto) this.coverPhotoUrl.set(p.coverPhoto);
        this.existingGallery.set(p.gallery || []);
        this.existingAttachments.set(p.attachments || []);
        // Set property manager
        if (p.propertyManager) {
          const mgr = typeof p.propertyManager === 'object' ? p.propertyManager : null;
          const mgrId = typeof p.propertyManager === 'string'
            ? p.propertyManager
            : p.propertyManager?._id;
          if (mgr) {
            this.preloadedManagerForSelector.set(mgr as Employee);
          }
          this.form.patchValue({ propertyManager: mgrId });
        }
        // Load existing units for MULTI_UNIT properties
        if (p.category === PropertyCategory.MULTI_UNIT) {
          this.loadPropertyUnits(id);
        }
        // Load existing owners
        if (p.owners && p.owners.length > 0) {
          this.ownersArray.clear();
          for (const po of p.owners) {
            const ownerData = typeof po.owner === 'object' ? po.owner : null;
            const ownerId = typeof po.owner === 'string' ? po.owner : po.owner?._id;
            const ownerGroup = this.fb.group({
              ownerId: [ownerId],
              ownerName: [ownerData ? (ownerData.isCompany && ownerData.companyName ? ownerData.companyName : `${ownerData.firstName} ${ownerData.lastName}`) : ownerId],
              ownerEmail: [ownerData?.email || ''],
              isCompany: [ownerData?.isCompany ?? false],
              ownershipPercentage: [po.ownershipPercentage, [Validators.required, Validators.min(0), Validators.max(100)]],
            });
            this.ownersArray.push(ownerGroup);
          }
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load property', 'Close', { duration: 5000 });
        this.isLoading.set(false);
      },
    });
  }

  // === Category Selection ===
  selectCategory(category: PropertyCategory): void {
    this.form.get('category')?.setValue(category);
    this.selectedCategory.set(category);

    // Auto-manage units FormArray on category toggle (create mode only)
    if (!this.isEditMode()) {
      if (category === PropertyCategory.MULTI_UNIT && this.unitsArray.length === 0) {
        this.addUnit();
      } else if (category === PropertyCategory.SINGLE_UNIT) {
        this.unitsArray.clear();
      }
    }
  }

  // === Unit FormArray Management ===
  private loadPropertyUnits(propertyId: string): void {
    this.unitService.getUnitsByProperty(propertyId, 1, 200).subscribe({
      next: (res) => {
        const units = res.data?.items || [];
        this.unitsArray.clear();
        units.forEach((u) => {
          const unitGroup = this.fb.group({
            _id: [u._id],
            name: [u.name, Validators.required],
            type: [u.type, Validators.required],
            bedrooms: [u.bedrooms],
            bathrooms: [u.bathrooms],
            sizeValue: [u.sizeValue],
            sizeUnit: [u.sizeUnit || SizeUnit.SQFT],
            rentAmount: [u.rentAmount, [Validators.required, Validators.min(0)]],
            deposit: [u.deposit || 0],
            isAffordableHousing: [u.isAffordableHousing ?? false],
          });
          this.unitsArray.push(unitGroup);
        });
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load property units:', err);
        this.snackBar.open('Failed to load units', 'Close', { duration: 5000 });
      },
    });
  }

  addUnit(): void {
    const unitGroup = this.fb.group({
      name: ['', Validators.required],
      type: [UnitType.APARTMENT, Validators.required],
      bedrooms: [null],
      bathrooms: [null],
      sizeValue: [null],
      sizeUnit: [SizeUnit.SQFT],
      rentAmount: [0, [Validators.required, Validators.min(0)]],
      deposit: [0],
      isAffordableHousing: [false],
    });
    this.unitsArray.push(unitGroup);
  }

  removeUnit(index: number): void {
    this.unitsArray.removeAt(index);
  }

  duplicateUnit(index: number): void {
    const source = this.unitsArray.at(index).value;
    const unitGroup = this.fb.group({
      name: ['', Validators.required],
      type: [source.type, Validators.required],
      bedrooms: [source.bedrooms],
      bathrooms: [source.bathrooms],
      sizeValue: [source.sizeValue],
      sizeUnit: [source.sizeUnit],
      rentAmount: [source.rentAmount, [Validators.required, Validators.min(0)]],
      deposit: [source.deposit],
      isAffordableHousing: [source.isAffordableHousing],
    });
    this.unitsArray.push(unitGroup);
  }

  isNonLivable(unitType: UnitType): boolean {
    return NON_LIVABLE_UNIT_TYPES.includes(unitType);
  }

  // === Amenities ===
  addAmenity(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.amenities.update((list) => [...list, value]);
    }
    event.chipInput!.clear();
  }

  removeAmenity(amenity: string): void {
    this.amenities.update((list) => list.filter((a) => a !== amenity));
  }

  toggleAmenity(amenity: string, event?: MatChipSelectionChange): void {
    if (event && !event.isUserInput) return;
    if (this.amenities().includes(amenity)) {
      this.removeAmenity(amenity);
    } else {
      this.amenities.update((list) => [...list, amenity]);
    }
  }

  hasAmenity(amenity: string): boolean {
    return this.amenities().includes(amenity);
  }

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

  addCustomAmenity(): void {
    const value = this.customAmenityInput().trim();
    if (value && !this.amenities().includes(value)) {
      this.amenities.update((list) => [...list, value]);
      this.customAmenityInput.set('');
    }
  }

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

    if (this.ownershipExceeds100) {
      this.snackBar.open('Total ownership percentage cannot exceed 100%', 'Close', { duration: 5000 });
      return;
    }

    const f = this.form.value;
    const lat = f.latitude;
    const lng = f.longitude;

    const payload: any = {
      name: f.name,
      code: f.code || undefined,
      category: f.category,
      type: f.type,
      description: f.description || undefined,
      status: f.status,
      yearBuilt: f.yearBuilt || undefined,
      address: {
        street: f.street || undefined,
        city: f.city,
        state: f.state,
        country: f.country,
        postalCode: f.postalCode || undefined,
        formattedAddress: f.formattedAddress || undefined,
      },
      amenities: this.amenities(),
      features: this.features(),
      propertyManager: f.propertyManager || undefined,
    };

    // Only include store on create (must not change on update)
    if (!this.isEditMode()) {
      payload.store = this.storeStore.selectedStore()?._id;
    }

    if (lat != null && lng != null) {
      payload.location = {
        type: 'Point',
        coordinates: [lng, lat],
      };
    }

    // Single-unit fields
    if (f.category === PropertyCategory.SINGLE_UNIT) {
      payload.bedrooms = f.bedrooms;
      payload.bathrooms = f.bathrooms;
      payload.sizeValue = f.sizeValue;
      payload.sizeUnit = f.sizeUnit;
      payload.marketRent = f.marketRent;
      payload.deposit = f.deposit;
      payload.currency = f.currency;
    }

    // Multi-unit inline units
    if (f.category === PropertyCategory.MULTI_UNIT && this.unitsArray.length > 0) {
      payload.units = this.unitsArray.value;
    }

    // Property owners
    if (this.ownersArray.length > 0) {
      payload.owners = this.ownersArray.controls.map((c) => ({
        owner: c.get('ownerId')?.value,
        ownershipPercentage: Number(c.get('ownershipPercentage')?.value) || 0,
      }));
    } else {
      payload.owners = [];
    }

    this.isSaving.set(true);

    const request$ = this.isEditMode()
      ? this.propertyService.updateProperty(this.propertyId(), payload)
      : this.propertyService.createProperty(payload);

    request$.subscribe({
      next: (res) => {
        const propertyId = res.data?._id || this.propertyId();
        this.uploadPhotosAfterSave(propertyId);
      },
      error: (err) => {
        const msg =
          err?.error?.message ||
          `Failed to ${this.isEditMode() ? 'update' : 'create'} property`;
        this.snackBar.open(msg, 'Close', { duration: 5000 });
        this.isSaving.set(false);
      },
    });
  }

  private uploadPhotosAfterSave(propertyId: string): void {
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
      this.propertyService.uploadCoverPhoto(propertyId, coverFile).subscribe({
        next: () => checkDone(),
        error: () => {
          this.snackBar.open('Cover photo upload failed', 'Close', { duration: 3000 });
          checkDone();
        },
      });
    }

    if (newGalleryFiles.length > 0) {
      this.propertyService.uploadGalleryPhotos(propertyId, newGalleryFiles).subscribe({
        next: () => checkDone(),
        error: () => {
          this.snackBar.open('Gallery upload failed', 'Close', { duration: 3000 });
          checkDone();
        },
      });
    }

    if (newAttachmentFiles.length > 0) {
      this.propertyService.uploadAttachments(propertyId, newAttachmentFiles).subscribe({
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
      `Property ${this.isEditMode() ? 'updated' : 'created'} successfully`,
      'Close',
      { duration: 3000 },
    );
    this.isSaving.set(false);
    this.router.navigate(['..'], { relativeTo: this.route });
  }

  cancel(): void {
    this.router.navigate(['..'], { relativeTo: this.route });
  }
}
