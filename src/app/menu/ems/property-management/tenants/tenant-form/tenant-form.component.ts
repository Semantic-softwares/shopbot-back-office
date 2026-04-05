import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormArray, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TenantService } from '../../../../../shared/services/tenant.service';
import { VehicleService } from '../../../../../shared/services/vehicle.service';
import { PetService } from '../../../../../shared/services/pet.service';
import { EmergencyContact, Tenant, TenantStatus, Vehicle, Pet } from '../../../../../shared/models/estate.model';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import {
  VehicleFormModalComponent,
} from '../../../../../shared/components/vehicle-form-modal/vehicle-form-modal.component';
import {
  PetFormModalComponent,
} from '../../../../../shared/components/pet-form-modal/pet-form-modal.component';

@Component({
  selector: 'app-tenant-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    PageHeaderComponent,
  ],
  templateUrl: './tenant-form.component.html',
})
export class TenantFormComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private tenantService = inject(TenantService);
  private vehicleService = inject(VehicleService);
  private petService = inject(PetService);
  private storeStore = inject(StoreStore);

  private tenantId = this.route.snapshot.paramMap.get('id');
  isEditMode = signal<boolean>(!!this.tenantId);
  isSaving = signal<boolean>(false);
  isCompany = signal<boolean>(false);

  /** Vehicles staged for submission (not yet persisted) */
  pendingVehicles = signal<Partial<Vehicle>[]>([]);
  /** Pets staged for submission (not yet persisted) */
  pendingPets = signal<Partial<Pet>[]>([]);
  /** Photo selected by the user — file + local preview URL */
  coverPhotoFile = signal<{ file: File; preview: string } | null>(null);
  /** Existing photo URL loaded from the server in edit mode */
  coverPhotoUrl = signal<string>('');

  statusOptions = [
    { value: TenantStatus.ACTIVE, label: 'Active' },
    { value: TenantStatus.INACTIVE, label: 'Inactive' },
  ];

  form = this.fb.group({
    firstName: ['', Validators.required],
    middleName: [''],
    lastName: ['', Validators.required],
    email: ['', Validators.email],
    phoneNumbers: this.fb.array([this.fb.control('')]),
    dateOfBirth: [null as Date | null],
    age: [{ value: '', disabled: true }],
    forwardingAddress: [''],
    emergencyContacts: this.fb.array([this.createEmergencyContactGroup()]),
    isCompany: [false],
    companyName: [''],
    notes: [''],
    status: [TenantStatus.ACTIVE],
  });

  get phoneNumbersArray(): FormArray {
    return this.form.get('phoneNumbers') as FormArray;
  }

  get emergencyContactsArray(): FormArray {
    return this.form.get('emergencyContacts') as FormArray;
  }

  constructor() {
    if (this.tenantId) {
      this.loadTenant();
    }

    this.form.get('isCompany')?.valueChanges.subscribe((value) => {
      this.isCompany.set(!!value);
    });


  }
  // ── Cover Photo ───────────────────────────────────────────────────────────────

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
  // ── Date of Birth ────────────────────────────────────────────────────────

  onDobChange(event: MatDatepickerInputEvent<Date>): void {
    const calculated = this.calculateAge(event.value);
    this.form.get('age')?.setValue(calculated !== null ? String(calculated) : '');
  }

  private createEmergencyContactGroup(contact?: Partial<EmergencyContact>): FormGroup {
    return this.fb.group({
      name: [contact?.name ?? '', Validators.required],
      email: [contact?.email ?? '', Validators.email],
      phoneNumber: [contact?.phoneNumber ?? '', Validators.required],
      relationship: [contact?.relationship ?? ''],
    });
  }

  // ── Phone Numbers ──────────────────────────────────────────────────────────

  addPhone(): void {
    this.phoneNumbersArray.push(this.fb.control(''));
  }

  removePhone(index: number): void {
    if (this.phoneNumbersArray.length > 1) {
      this.phoneNumbersArray.removeAt(index);
    }
  }

  // ── Emergency Contacts ─────────────────────────────────────────────────────

  addEmergencyContact(): void {
    this.emergencyContactsArray.push(this.createEmergencyContactGroup());
  }

  removeEmergencyContact(index: number): void {
    if (this.emergencyContactsArray.length > 1) {
      this.emergencyContactsArray.removeAt(index);
    }
  }

  // ── Vehicles ──────────────────────────────────────────────────────────────

  openAddVehicleModal(index?: number): void {
    const existing = index !== undefined ? this.pendingVehicles()[index] : undefined;
    const ref = this.dialog.open(VehicleFormModalComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { vehicle: existing },
      disableClose: true,
    });

    ref.afterClosed().subscribe((result: Partial<Vehicle> | null) => {
      if (!result) return;
      if (index !== undefined) {
        const updated = [...this.pendingVehicles()];
        updated[index] = result;
        this.pendingVehicles.set(updated);
      } else {
        this.pendingVehicles.update((v) => [...v, result]);
      }
    });
  }

  removeVehicle(index: number): void {
    this.pendingVehicles.update((v) => v.filter((_, i) => i !== index));
  }

  vehicleLabel(v: Partial<Vehicle>): string {
    const parts = [v.year, v.make, v.model].filter(Boolean).join(' ');
    return v.licensePlate ? `${parts} (${v.licensePlate})` : parts;
  }

  // ── Pets ──────────────────────────────────────────────────────────────────

  openAddPetModal(index?: number): void {
    const existing = index !== undefined ? this.pendingPets()[index] : undefined;
    const ref = this.dialog.open(PetFormModalComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: { pet: existing },
      disableClose: true,
    });

    ref.afterClosed().subscribe((result: Partial<Pet> | null) => {
      if (!result) return;
      if (index !== undefined) {
        const updated = [...this.pendingPets()];
        updated[index] = result;
        this.pendingPets.set(updated);
      } else {
        this.pendingPets.update((p) => [...p, result]);
      }
    });
  }

  removePet(index: number): void {
    this.pendingPets.update((p) => p.filter((_, i) => i !== index));
  }

  petLabel(p: Partial<Pet>): string {
    return [p.name, p.type, p.breed].filter(Boolean).join(' — ');
  }

  // ── Load existing tenant ──────────────────────────────────────────────────

  private loadTenant(): void {
    if (!this.tenantId) return;

    this.tenantService.getTenantById(this.tenantId).subscribe({
      next: (res) => {
        const tenant = res.data;

        // Rebuild phoneNumbers FormArray
        const phones: string[] = Array.isArray(tenant.phoneNumbers) && tenant.phoneNumbers.length
          ? tenant.phoneNumbers
          : [''];
        const phoneControls = phones.map((p) => this.fb.control(p));
        while (this.phoneNumbersArray.length) this.phoneNumbersArray.removeAt(0);
        phoneControls.forEach((c) => this.phoneNumbersArray.push(c));

        const emergencyContacts = Array.isArray(tenant.emergencyContacts) && tenant.emergencyContacts.length
          ? tenant.emergencyContacts
          : [{}];
        while (this.emergencyContactsArray.length) this.emergencyContactsArray.removeAt(0);
        emergencyContacts.forEach((contact) => {
          this.emergencyContactsArray.push(this.createEmergencyContactGroup(contact));
        });

        this.form.patchValue({
          firstName: tenant.firstName,
          middleName: tenant.middleName || '',
          lastName: tenant.lastName,
          email: tenant.email || '',
          dateOfBirth: tenant.dateOfBirth ? new Date(tenant.dateOfBirth) : null,
          forwardingAddress: tenant.forwardingAddress || '',
          isCompany: tenant.isCompany,
          companyName: tenant.companyName || '',
          notes: tenant.notes || '',
          status: tenant.status,
        });

        this.isCompany.set(tenant.isCompany);
        const calculatedAge = this.calculateAge(tenant.dateOfBirth ? new Date(tenant.dateOfBirth) : null);
        this.form.get('age')?.setValue(calculatedAge !== null ? String(calculatedAge) : '');
        if (tenant.coverPhoto) this.coverPhotoUrl.set(tenant.coverPhoto);

        // Populate existing vehicles/pets as pending items
        if (Array.isArray(tenant.vehicles)) {
          this.pendingVehicles.set(
            tenant.vehicles.map((v) => (typeof v === 'string' ? { _id: v } : v)) as Partial<Vehicle>[],
          );
        }
        if (Array.isArray(tenant.pets)) {
          this.pendingPets.set(
            tenant.pets.map((p) => (typeof p === 'string' ? { _id: p } : p)) as Partial<Pet>[],
          );
        }
      },
      error: () => {
        this.snackBar.open('Failed to load tenant', 'Close', { duration: 5000 });
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private calculateAge(dateOfBirth: Date | string | null | undefined): number | null {
    if (!dateOfBirth) return null;
    const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
    if (Number.isNaN(dob.getTime())) return null;
    const today = new Date();
    let years = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      years -= 1;
    }
    return years >= 0 ? years : null;
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const formValue = this.form.value;

    const phoneNumbers = (formValue.phoneNumbers as string[]).filter(Boolean);
    const emergencyContacts = ((formValue.emergencyContacts as EmergencyContact[] | undefined) ?? [])
      .map((contact) => ({
        name: contact.name?.trim() ?? '',
        email: contact.email?.trim() || undefined,
        phoneNumber: contact.phoneNumber?.trim() ?? '',
        relationship: contact.relationship?.trim() || undefined,
      }))
      .filter((contact) => contact.name && contact.phoneNumber);

    const storeId = this.storeStore.selectedStore()?._id;

    // For existing items that already have _id, pass the _id.
    // For new items (no _id), pass the data — backend will create them.
    const vehicleIds = this.pendingVehicles()
      .filter((v) => !!v._id)
      .map((v) => v._id as string);

    const petIds = this.pendingPets()
      .filter((p) => !!p._id)
      .map((p) => p._id as string);

    const newVehicles = this.pendingVehicles().filter((v) => !v._id);
    const newPets = this.pendingPets().filter((p) => !p._id);

    const data: Record<string, unknown> = {
      firstName: formValue.firstName || '',
      middleName: formValue.middleName || undefined,
      lastName: formValue.lastName || '',
      email: formValue.email || undefined,
      phoneNumbers,
      dateOfBirth: formValue.dateOfBirth
        ? (formValue.dateOfBirth as unknown as Date).toISOString().slice(0, 10)
        : undefined,
      forwardingAddress: formValue.forwardingAddress || undefined,
      emergencyContacts: emergencyContacts.length ? emergencyContacts : undefined,
      isCompany: !!formValue.isCompany,
      companyName: formValue.companyName || undefined,
      notes: formValue.notes || undefined,
      status: formValue.status || TenantStatus.ACTIVE,
      vehicles: vehicleIds,
      pets: petIds,
    };

    if (!this.isEditMode()) {
      data['store'] = storeId;
    }

    // If there are new (unsaved) vehicles/pets, create them first then submit tenant
    if (newVehicles.length > 0 || newPets.length > 0) {
      this.createLinkedEntitiesAndSubmit(data, newVehicles, newPets, vehicleIds, petIds, storeId);
    } else {
      this.submitTenant(data);
    }
  }

  private createLinkedEntitiesAndSubmit(
    data: Record<string, unknown>,
    newVehicles: Partial<Vehicle>[],
    newPets: Partial<Pet>[],
    existingVehicleIds: string[],
    existingPetIds: string[],
    storeId: string | undefined,
  ): void {
    const vehicleRequests = newVehicles.map((v) =>
      this.vehicleService.createVehicle({ ...v, store: storeId }),
    );
    const petRequests = newPets.map((p) =>
      this.petService.createPet({ ...p, store: storeId }),
    );

    // Use forkJoin-like sequential creation via Promise.all pattern
    import('rxjs').then(({ forkJoin, of }) => {
      const allVehicles$ = vehicleRequests.length
        ? forkJoin(vehicleRequests)
        : of([] as { data: Vehicle }[]);
      const allPets$ = petRequests.length
        ? forkJoin(petRequests)
        : of([] as { data: Pet }[]);

      forkJoin([allVehicles$, allPets$]).subscribe({
        next: ([vehicleResponses, petResponses]) => {
          const createdVehicleIds = vehicleResponses.map((r) => r.data._id);
          const createdPetIds = petResponses.map((r) => r.data._id);
          data['vehicles'] = [...existingVehicleIds, ...createdVehicleIds];
          data['pets'] = [...existingPetIds, ...createdPetIds];
          this.submitTenant(data);
        },
        error: () => {
          this.snackBar.open('Failed to save vehicles/pets', 'Close', { duration: 5000 });
          this.isSaving.set(false);
        },
      });
    });
  }

  private submitTenant(data: Record<string, unknown>): void {
    const request$ = this.isEditMode()
      ? this.tenantService.updateTenant(this.tenantId!, data as Partial<Tenant>)
      : this.tenantService.createTenant(data as Partial<Tenant>);

    request$.subscribe({
      next: (res) => {
        const coverFile = this.coverPhotoFile()?.file;
        if (coverFile) {
          this.tenantService.uploadCoverPhoto(res.data._id, coverFile).subscribe({
            next: () => this.navigateAfterSave(res.data._id),
            error: () => {
              this.snackBar.open('Profile photo upload failed', 'Close', { duration: 3000 });
              this.navigateAfterSave(res.data._id);
            },
          });
        } else {
          this.navigateAfterSave(res.data._id);
        }
      },
      error: (err) => {
        this.snackBar.open(
          err?.error?.message || 'Failed to save tenant',
          'Close',
          { duration: 5000 },
        );
        this.isSaving.set(false);
      },
    });
  }

  private navigateAfterSave(tenantId: string): void {
    this.snackBar.open(
      this.isEditMode() ? 'Tenant updated' : 'Tenant created',
      'Close',
      { duration: 3000 },
    );
    if (this.isEditMode()) {
      this.router.navigate(['../../', this.tenantId], { relativeTo: this.route });
    } else {
      this.router.navigate(['../', tenantId], { relativeTo: this.route });
    }
  }

  cancel(): void {
    if (this.isEditMode()) {
      this.router.navigate(['../../', this.tenantId], { relativeTo: this.route });
    } else {
      this.router.navigate(['../'], { relativeTo: this.route });
    }
  }
}
