import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, of, startWith } from 'rxjs';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { PropertyManagerSelectorComponent } from '../../../../../shared/components/property-manager-selector/property-manager-selector.component';
import { Employee } from '../../../../../shared/models/employee.model';
import { PaginatedResponse, Unit } from '../../../../../shared/models/estate.model';
import {
  CreateMaintenanceRequestPayload,
  MaintenancePriority,
  MaintenanceReportedByType,
  MaintenanceStatus,
  PartsAndLaborItem,
  PRIORITY_LABEL,
  STATUS_LABEL,
} from '../../../../../shared/models/maintenance.model';
import { LeaseService } from '../../../../../shared/services/lease.service';
import { MaintenanceService } from '../../../../../shared/services/maintenance.service';
import { InvoiceCategorySelectComponent } from '../../../../../shared/components/invoice-category-select/invoice-category-select.component';
import { MaintenanceCategorySelectComponent } from '../../../../../shared/components/maintenance-category-select/maintenance-category-select.component';
import { MaintenanceVendorSelectComponent } from '../../../../../shared/components/maintenance-vendor-select/maintenance-vendor-select.component';
import { FinancialSide } from '../../../../../shared/enums/financial.enums';
import { EstatePropertyService } from '../../../../../shared/services/estate-property.service';
import { EstateUnitService } from '../../../../../shared/services/estate-unit.service';
import { SessionStorageService } from '../../../../../shared/services/session-storage.service';
import { TenantService } from '../../../../../shared/services/tenant.service';
import { StoreStore } from '../../../../../shared/stores/store.store';

@Component({
  selector: 'app-maintenance-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    PropertyManagerSelectorComponent,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatStepperModule,
    MatDatepickerModule,
    MatNativeDateModule,
    InvoiceCategorySelectComponent,
    MaintenanceCategorySelectComponent,
    MaintenanceVendorSelectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './maintenance-form.component.html',
  styleUrl: './maintenance-form.component.scss',
})
export class MaintenanceFormComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly storeStore = inject(StoreStore);
  private readonly propertyService = inject(EstatePropertyService);
  private readonly unitService = inject(EstateUnitService);
  private readonly tenantService = inject(TenantService);
  private readonly leaseService = inject(LeaseService);
  private readonly maintenanceService = inject(MaintenanceService);
  private readonly sessionStorageService = inject(SessionStorageService);
  private readonly snackBar = inject(MatSnackBar);

  private readonly requestId = this.route.snapshot.paramMap.get('id');
  readonly isEditMode = computed(() => !!this.requestId);
  readonly submitting = signal<boolean>(false);
  readonly selectedPhotoFiles = signal<File[]>([]);
  readonly selectedPhotoPreviews = signal<string[]>([]);
  readonly uploadedPhotoUrls = signal<string[]>([]);

  readonly tenantSearchControl = new FormControl<string>('', { nonNullable: true });
  readonly preloadedManagerForSelector = signal<Employee | null>(null);
  readonly preloadedAssignedToForSelector = signal<Employee | null>(null);

  readonly form = this.fb.group({
    reporter: this.fb.group({
      reportedByType: this.fb.control<MaintenanceReportedByType>(MaintenanceReportedByType.STAFF, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      tenantId: this.fb.control<string>(''),
      reportedByUserId: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.pattern(/^[a-fA-F0-9]{24}$/)],
      }),
    }),
    location: this.fb.group({
      propertyId: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      unitId: this.fb.control<string>(''),
      leaseId: this.fb.control<string>(''),
    }),
    info: this.fb.group({
      title: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      description: this.fb.control<string>(''),
      category: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      priority: this.fb.control<MaintenancePriority>(MaintenancePriority.MEDIUM, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      status: this.fb.control<MaintenanceStatus>(MaintenanceStatus.OPEN, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      vendorId: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      assignedTo: this.fb.control<string>('', {
        nonNullable: true,
      }),
      dueDate: this.fb.control<Date | null>(null),
      partsAndLabor: this.fb.array<FormGroup>([]),
    }),

  });

  get reporterGroup(): FormGroup {
    return this.form.controls.reporter as FormGroup;
  }

  get locationGroup(): FormGroup {
    return this.form.controls.location as FormGroup;
  }

  get infoGroup(): FormGroup {
    return this.form.controls.info as FormGroup;
  }

  readonly priorityOptions = Object.values(MaintenancePriority).map((value) => ({
    value,
    label: PRIORITY_LABEL[value],
  }));

  readonly statusOptions = Object.values(MaintenanceStatus).map((value) => ({
    value,
    label: STATUS_LABEL[value],
  }));

  readonly reportedByOptions = Object.values(MaintenanceReportedByType);

  readonly financialSide = FinancialSide;

  get partsAndLaborArray(): FormArray {
    return this.form.controls.info.controls.partsAndLabor;
  }

  readonly partsAndLaborTotal = signal<number>(0);

  private recalcPartsAndLaborTotal(): void {
    const controls = this.partsAndLaborArray.controls as FormGroup[];
    const total = controls.reduce((sum, row) => {
      return sum + (row.controls['total']?.value ?? 0);
    }, 0);
    this.partsAndLaborTotal.set(+total.toFixed(2));
  }

  addPartRow(item?: PartsAndLaborItem): void {
    const row = this.fb.group({
      quantity: this.fb.control<number>(item?.quantity ?? 1, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0)],
      }),
      category: this.fb.control<string>(item?.category ?? '', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      description: this.fb.control<string>(item?.description ?? ''),
      price: this.fb.control<number>(item?.price ?? 0, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0)],
      }),
      total: this.fb.control<number>(item?.total ?? 0, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0)],
      }),
    });

    // Auto-calculate total when quantity or price changes
    row.controls.quantity.valueChanges.subscribe(() => {
      this.recalcRowTotal(row);
      this.recalcPartsAndLaborTotal();
    });
    row.controls.price.valueChanges.subscribe(() => {
      this.recalcRowTotal(row);
      this.recalcPartsAndLaborTotal();
    });

    this.partsAndLaborArray.push(row);
    this.recalcPartsAndLaborTotal();
  }

  removePartRow(index: number): void {
    this.partsAndLaborArray.removeAt(index);
    this.recalcPartsAndLaborTotal();
  }

  getPartCategoryControl(index: number): FormControl<string | null> {
    const row = this.partsAndLaborArray.at(index) as FormGroup;
    return row.controls['category'] as FormControl<string | null>;
  }

  private recalcRowTotal(row: FormGroup): void {
    const qty = row.controls['quantity']?.value ?? 0;
    const price = row.controls['price']?.value ?? 0;
    row.controls['total'].setValue(+(qty * price).toFixed(2), { emitEvent: false });
  }

  private normalizeReportedByType(value: unknown): MaintenanceReportedByType {
    if (
      value === MaintenanceReportedByType.TENANT ||
      value === MaintenanceReportedByType.STAFF ||
      value === MaintenanceReportedByType.MANAGER ||
      value === MaintenanceReportedByType.ADMIN
    ) {
      return value;
    }
    return MaintenanceReportedByType.STAFF;
  }

  readonly propertyId = toSignal(
    this.locationGroup.controls['propertyId'].valueChanges.pipe(
      startWith(this.locationGroup.controls['propertyId'].value),
    ),
    { initialValue: this.locationGroup.controls['propertyId'].value },
  );

  readonly unitId = toSignal(
    this.locationGroup.controls['unitId'].valueChanges.pipe(
      startWith(this.locationGroup.controls['unitId'].value),
    ),
    { initialValue: this.locationGroup.controls['unitId'].value },
  );

  readonly reportedByType = toSignal(
    this.reporterGroup.controls['reportedByType'].valueChanges.pipe(
      startWith(this.reporterGroup.controls['reportedByType'].value),
    ),
    { initialValue: this.reporterGroup.controls['reportedByType'].value },
  );

  readonly propertiesResource = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id ?? '' }),
    stream: ({ params }) => this.propertyService.getProperties(params.storeId, { page: 1, limit: 300 }),
  });

  readonly unitsResource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id ?? '',
      propertyId: this.propertyId(),
    }),
    stream: ({ params }) => {
      if (!params.propertyId) {
        const emptyResponse: PaginatedResponse<Unit> = {
          success: true,
          message: 'No property selected',
          data: {
            items: [],
            meta: {
              page: 1,
              limit: 300,
              totalItems: 0,
              totalPages: 1,
            },
          },
        };
        return of(emptyResponse);
      }
      return this.unitService.getUnits(params.storeId, {
        page: 1,
        limit: 300,
        propertyId: params.propertyId,
      });
    },
  });

  readonly tenantsResource = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id ?? '' }),
    stream: ({ params }) => this.tenantService.getTenants(params.storeId, { page: 1, limit: 300 }),
  });

  readonly leasesResource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id ?? '',
      propertyId: this.propertyId(),
      unitId: this.unitId(),
    }),
    stream: ({ params }) => {
      if (!params.propertyId) {
        return of({
          success: true,
          message: 'No property selected',
          data: {
            items: [],
            meta: {
              page: 1,
              limit: 300,
              totalItems: 0,
              totalPages: 1,
            },
          },
        });
      }
      return this.leaseService.getLeases(params.storeId, {
        page: 1,
        limit: 300,
        propertyId: params.propertyId,
        unitId: params.unitId || undefined,
      });
    },
  });

  readonly properties = computed(() => this.propertiesResource.value()?.data.items ?? []);
  readonly units = computed(() => this.unitsResource.value()?.data.items ?? []);
  readonly tenants = computed(() => this.tenantsResource.value()?.data.items ?? []);
  readonly leases = computed(() => this.leasesResource.value()?.data.items ?? []);

  readonly filteredReporterTenants = computed(() => {
    const search = this.tenantSearchControl.value.trim().toLowerCase();

    const propertyId = this.propertyId();
    const unitId = this.unitId() || null;

    if (!propertyId) {
      return this.tenants().filter((tenant) => {
        if (!search) return true;
        const fullName = `${tenant.firstName} ${tenant.middleName || ''} ${tenant.lastName}`
          .replace(/\s+/g, ' ')
          .trim()
          .toLowerCase();
        return fullName.includes(search) || (tenant.email || '').toLowerCase().includes(search);
      });
    }

    const matchingLeases = this.leases().filter((lease) => {
      const leasePropertyId = typeof lease.propertyId === 'string' ? lease.propertyId : lease.propertyId?._id;
      const leaseUnitId = typeof lease.unitId === 'string' ? lease.unitId : lease.unitId?._id;

      if (leasePropertyId !== propertyId) return false;
      if (unitId) return leaseUnitId === unitId;
      return true;
    });

    const tenantIds = new Set<string>();
    matchingLeases.forEach((lease) => {
      lease.tenantIds.forEach((tenant) => {
        const tenantId = typeof tenant === 'string' ? tenant : tenant?._id;
        if (tenantId) tenantIds.add(tenantId);
      });
    });

    return this.tenants().filter((tenant) => {
      if (!tenantIds.has(tenant._id)) return false;
      if (!search) return true;
      const fullName = `${tenant.firstName} ${tenant.middleName || ''} ${tenant.lastName}`
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
      return fullName.includes(search) || (tenant.email || '').toLowerCase().includes(search);
    });
  });

  readonly selectedReporterTenant = computed(() => {
    const tenantId = this.reporterGroup.controls['tenantId'].value;
    if (!tenantId) return null;
    return this.tenants().find((tenant) => tenant._id === tenantId) || null;
  });

  constructor() {
    this.locationGroup.controls['propertyId'].valueChanges.subscribe(() => {
      this.locationGroup.controls['unitId'].setValue('');
      this.locationGroup.controls['leaseId'].setValue('');
    });

    this.locationGroup.controls['unitId'].valueChanges.subscribe(() => {
      this.locationGroup.controls['leaseId'].setValue('');
    });

    this.reporterGroup.controls['reportedByType'].valueChanges.subscribe((type) => {
      this.applyReporterTypeValidators(this.normalizeReportedByType(type));
    });

    this.applyReporterTypeValidators(
      this.normalizeReportedByType(this.reporterGroup.controls['reportedByType'].value),
    );
    this.prefillFromQueryParams();
    this.loadEditRequest();
  }

  private prefillFromQueryParams(): void {
    const queryParams = this.route.snapshot.queryParams;
    if (queryParams['propertyId']) {
      this.locationGroup.controls['propertyId'].setValue(queryParams['propertyId']);
    }
    if (queryParams['unitId']) {
      this.locationGroup.controls['unitId'].setValue(queryParams['unitId']);
    }
  }

  private applyReporterTypeValidators(type: MaintenanceReportedByType): void {
    const tenantControl = this.reporterGroup.controls['tenantId'];
    const staffControl = this.reporterGroup.controls['reportedByUserId'];

    tenantControl.clearValidators();
    staffControl.clearValidators();

    if (type === MaintenanceReportedByType.TENANT) {
      tenantControl.setValidators([Validators.required]);
      staffControl.setValue('', { emitEvent: false });
    } else {
      // STAFF, MANAGER, ADMIN all use staffControl
      staffControl.setValidators([
        Validators.required,
        Validators.pattern(/^[a-fA-F0-9]{24}$/),
      ]);
      tenantControl.setValue('', { emitEvent: false });
    }

    tenantControl.updateValueAndValidity({ emitEvent: false });
    staffControl.updateValueAndValidity({ emitEvent: false });
  }

  selectReporterTenant(event: MatAutocompleteSelectedEvent): void {
    const tenantId = event.option.value as string;
    this.reporterGroup.controls['tenantId'].setValue(tenantId);
    this.tenantSearchControl.setValue(this.reporterTenantLabel(tenantId), { emitEvent: false });
  }

  clearReporterTenant(): void {
    this.reporterGroup.controls['tenantId'].setValue('');
    this.tenantSearchControl.setValue('');
  }

  reporterTenantLabel(tenantId: string): string {
    if (!tenantId) return '';
    const tenant = this.tenants().find((item) => item._id === tenantId);
    if (!tenant) return '';
    return `${tenant.firstName} ${tenant.middleName || ''} ${tenant.lastName}`.replace(/\s+/g, ' ').trim();
  }

  private loadEditRequest(): void {
    if (!this.requestId) return;

    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    this.maintenanceService.getById(storeId, this.requestId).subscribe({
      next: (response) => {
        const request = response.data.request;

        const reportedByUserId =
          typeof request.reportedByUserId === 'string'
            ? request.reportedByUserId
            : request.reportedByUserId?._id ?? '';

        this.form.patchValue({
          reporter: {
            tenantId:
              typeof request.tenantId === 'string'
                ? request.tenantId
                : request.tenantId?._id ?? '',
            reportedByType: this.normalizeReportedByType(request.reportedByType),
            reportedByUserId,
          },
          location: {
            propertyId:
              typeof request.propertyId === 'string'
                ? request.propertyId
                : request.propertyId?._id,
            unitId:
              typeof request.unitId === 'string'
                ? request.unitId
                : request.unitId?._id ?? '',
            leaseId:
              typeof request.leaseId === 'string'
                ? request.leaseId
                : request.leaseId?._id ?? '',
          },
          info: {
            title: request.title,
            description: request.description ?? '',
            category: request.category,
            priority: request.priority,
            status: request.status ?? MaintenanceStatus.OPEN,
            vendorId: typeof request.vendorId === 'object' ? request.vendorId?._id ?? '' : request.vendorId ?? '',
            assignedTo:
              typeof request.assignedTo === 'string'
                ? request.assignedTo
                : request.assignedTo?._id ?? '',
            dueDate: request.dueDate ? new Date(request.dueDate) : null,
          },
        });

        const reportedByUser =
          typeof request.reportedByUserId === 'object' && request.reportedByUserId
            ? (request.reportedByUserId as Employee)
            : null;
        if (reportedByUser) {
          this.preloadedManagerForSelector.set(reportedByUser);
        }

        const assignedToUser =
          typeof request.assignedTo === 'object' && request.assignedTo
            ? (request.assignedTo as Employee)
            : null;
        if (assignedToUser) {
          this.preloadedAssignedToForSelector.set(assignedToUser);
        }

        // Populate parts and labor rows
        if (request.partsAndLabor?.length) {
          this.partsAndLaborArray.clear();
          request.partsAndLabor.forEach((item) => this.addPartRow(item));
        }

        this.tenantSearchControl.setValue(this.reporterTenantLabel(this.reporterGroup.controls['tenantId'].value));
        this.uploadedPhotoUrls.set(request.photos ?? []);
      },
      error: (error) => {
        const message = error?.error?.message || 'Failed to load request';
        this.snackBar.open(message, 'Close', { duration: 4000 });
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/menu/ems/maintenance']);
  }

  onPhotosSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];

    if (files.length === 0) {
      return;
    }

    const nextFiles = [...this.selectedPhotoFiles(), ...files];
    this.selectedPhotoFiles.set(nextFiles);
    this.selectedPhotoPreviews.set(nextFiles.map((file) => URL.createObjectURL(file)));
  }

  removeSelectedPhoto(index: number): void {
    const files = [...this.selectedPhotoFiles()];
    files.splice(index, 1);
    this.selectedPhotoFiles.set(files);
    this.selectedPhotoPreviews.set(files.map((file) => URL.createObjectURL(file)));
  }

  removeUploadedPhoto(index: number): void {
    const urls = [...this.uploadedPhotoUrls()];
    urls.splice(index, 1);
    this.uploadedPhotoUrls.set(urls);
  }

  private async uploadSelectedPhotos(storeId: string): Promise<string[]> {
    const files = this.selectedPhotoFiles();
    if (files.length === 0) {
      return [];
    }

    try {
      const res = await firstValueFrom(this.maintenanceService.uploadPhotos(storeId, files));
      return res.data.photos ?? [];
    } catch (error) {
      const status = (error as { status?: number })?.status;
      // Fallback for environments where /estate/maintenance/upload/photos is not deployed yet.
      if (status === 404 || status === 405) {
        const propertyId = this.locationGroup.controls['propertyId'].value;
        if (!propertyId) {
          throw error;
        }

        const fallback = await firstValueFrom(
          this.propertyService.uploadAttachments(propertyId, files),
        );
        return fallback.attachments ?? [];
      }

      throw error;
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    this.submitting.set(true);

    const reporter = this.form.controls.reporter.value;
    const location = this.form.controls.location.value;
    const info = this.form.controls.info.value;

    const onSuccess = (message: string, id: string) => {
      this.submitting.set(false);
      this.selectedPhotoFiles.set([]);
      this.selectedPhotoPreviews.set([]);
      this.snackBar.open(message, 'Close', { duration: 3000 });
      this.router.navigate(['/menu/ems/maintenance/maintenances', id]);
    };

    const onError = (error: unknown) => {
      this.submitting.set(false);
      const message = (error as { error?: { message?: string } })?.error?.message || 'Failed to save maintenance request';
      this.snackBar.open(message, 'Close', { duration: 4000 });
    };

    try {
      const uploadedFromSelection = await this.uploadSelectedPhotos(storeId);
      const photos = [...this.uploadedPhotoUrls(), ...uploadedFromSelection];

      const partsAndLabor: PartsAndLaborItem[] = this.partsAndLaborArray.controls.map((row) => {
        const g = row as FormGroup;
        return {
          quantity: g.controls['quantity'].value ?? 0,
          category: g.controls['category'].value ?? '',
          description: g.controls['description'].value || undefined,
          price: g.controls['price'].value ?? 0,
          total: g.controls['total'].value ?? 0,
        };
      });
      const estimatedCost = partsAndLabor.length > 0
        ? partsAndLabor.reduce((sum, item) => sum + item.total, 0)
        : undefined;

      const payload: CreateMaintenanceRequestPayload = {
        propertyId: location.propertyId ?? '',
        unitId: location.unitId || undefined,
        leaseId: location.leaseId || undefined,
        tenantId:
          reporter.reportedByType === MaintenanceReportedByType.TENANT
            ? reporter.tenantId || undefined
            : undefined,
        title: info.title ?? '',
        description: info.description || undefined,
        category: info.category ?? '',
        priority: info.priority ?? MaintenancePriority.MEDIUM,
        status: info.status ?? MaintenanceStatus.OPEN,
        reportedByType: this.normalizeReportedByType(reporter.reportedByType),
        reportedByUserId:
          this.normalizeReportedByType(reporter.reportedByType) !== MaintenanceReportedByType.TENANT
            ? reporter.reportedByUserId || undefined
            : undefined,
        createdBy: this.sessionStorageService.getCurrentUser()?._id || undefined,
        estimatedCost,
        partsAndLabor: partsAndLabor.length > 0 ? partsAndLabor : undefined,
        vendorId: info.vendorId || undefined,
        assignedTo: info.assignedTo || undefined,
        dueDate: info.dueDate ? info.dueDate.toISOString() : undefined,
        photos,
      };

      if (this.requestId) {
        this.maintenanceService
          .update(storeId, this.requestId, {
            propertyId: payload.propertyId,
            unitId: payload.unitId,
            tenantId: payload.tenantId,
            leaseId: payload.leaseId,
            title: payload.title,
            description: payload.description,
            category: payload.category,
            priority: payload.priority,
            status: payload.status,
            reportedByType: payload.reportedByType,
            reportedByUserId: payload.reportedByUserId,
            vendorId: payload.vendorId,
            assignedTo: info.assignedTo || undefined,
            dueDate: info.dueDate ? info.dueDate.toISOString() : undefined,
            estimatedCost,
            partsAndLabor: partsAndLabor.length > 0 ? partsAndLabor : undefined,
            photos,
          })
          .subscribe({
            next: (response) => onSuccess('Maintenance request updated', response.data._id),
            error: onError,
          });
        return;
      }

      this.maintenanceService.create(storeId, payload).subscribe({
        next: (response) => onSuccess('Maintenance request created', response.data._id),
        error: onError,
      });
    } catch (error) {
      onError(error);
    }
  }
}
