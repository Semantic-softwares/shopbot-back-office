import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  BillingFrequency,
  DepositCategory,
  LateFeeType,
  LeaseInvoicingType,
  LeasePropertyCategory,
  Property,
  LeaseStatus,
  LeaseType,
  RentDueDateRule,
  Unit,
  UtilityResponsibleParty,
  UtilityType,
} from '../../../../shared/models/estate.model';
import { StoreStore } from '../../../../shared/stores/store.store';
import { EstatePropertyService } from '../../../../shared/services/estate-property.service';
import { EstateUnitService } from '../../../../shared/services/estate-unit.service';
import { TenantService } from '../../../../shared/services/tenant.service';
import { LeaseService } from '../../../../shared/services/lease.service';
import { SessionStorageService } from '../../../../shared/services/session-storage.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LeaseStepTermsComponent } from './steps/lease-step-terms.component';
import { LeaseStepTenantsComponent } from './steps/lease-step-tenants.component';
import { LeaseStepTransactionsComponent } from './steps/lease-step-transactions.component';
import { LeaseStepUtilitiesComponent } from './steps/lease-step-utilities.component';
import { LeaseStepSummaryComponent } from './steps/lease-step-summary.component';

@Component({
  selector: 'app-lease-create-wizard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatStepperModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
    LeaseStepTermsComponent,
    LeaseStepTenantsComponent,
    LeaseStepTransactionsComponent,
    LeaseStepUtilitiesComponent,
    LeaseStepSummaryComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lease-create-wizard.component.html',
  styleUrl: './lease-create-wizard.component.scss',
})
export class LeaseCreateWizardComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private storeStore = inject(StoreStore);
  private propertyService = inject(EstatePropertyService);
  private unitService = inject(EstateUnitService);
  private tenantService = inject(TenantService);
  private leaseService = inject(LeaseService);
  private sessionStorageService = inject(SessionStorageService);

  private leaseId = this.route.snapshot.paramMap.get('id');
  private prefilledTenantIds = this.getPrefilledTenantIds();
  private prefilledPropertyId = this.route.snapshot.queryParamMap.get('propertyId');
  private prefilledUnitId = this.route.snapshot.queryParamMap.get('unitId');

  isEditMode = signal(!!this.leaseId);
  isDraftEdit = signal(false);
  isSubmitting = signal(false);
  units = signal<any[]>([]);
  selectedPropertyRent = signal(0);
  private hasInitializedCurrencyDefault = signal(false);

  readonly leaseTypes = LeaseType;
  readonly propertyCategories = LeasePropertyCategory;
  readonly leaseStatuses = LeaseStatus;

  leaseForm = this.fb.group({
    terms: this.fb.group({
      propertyId: ['', Validators.required],
      propertyCategory: ['', Validators.required],
      unitId: [''],
      leaseType: [LeaseType.FIXED_TERM, Validators.required],
      startDate: [null as Date | null, Validators.required],
      endDate: [null as Date | null],
      currency: ['NGN', Validators.required],
      notes: [''],
    }),
    tenants: this.fb.group({
      tenantIds: [[] as string[], Validators.required],
    }),
    transactions: this.fb.group({
      invoicingType: [LeaseInvoicingType.JOINT],
      recurringRent: this.fb.group({
        enabled: [true],
        accountCode: ['RENT', Validators.required],
        firstRentDate: [null as Date | null],
        dueDateRule: [RentDueDateRule.FIRST_DAY_OF_MONTH],
        frequency: [BillingFrequency.MONTHLY],
        totalAmount: [0, [Validators.required, Validators.min(0)]],
        markPastInvoicesAsPaid: [false],
        tenantShares: this.fb.array([]),
      }),
      deposits: this.fb.array([]),
      otherTransactions: this.fb.array([]),
      lateFeeSettings: this.fb.group({
        enabled: [false],
        gracePeriodDays: [0],
        gracePeriodTime: [null as Date | null],
        oneTimeLateFee: this.fb.group({
          enabled: [false],
          feeType: [LateFeeType.FIXED],
          value: [0],
        }),
        dailyLateFee: this.fb.group({
          enabled: [false],
          feeType: [LateFeeType.FIXED],
          value: [0],
        }),
      }),
    }),
    utilities: this.fb.group({
      responsibilities: this.fb.array([]),
    }),
  });

  propertiesResource = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id || '' }),
    stream: ({ params }) => this.propertyService.getProperties(params.storeId, { limit: 500 }),
  });

  tenantsResource = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id || '' }),
    stream: ({ params }) => this.tenantService.getTenants(params.storeId, { limit: 500 }),
  });

  properties = computed(() => this.propertiesResource.value()?.data.items || []);
  tenants = computed(() => this.tenantsResource.value()?.data.items || []);

  get termsGroup(): FormGroup {
    return this.leaseForm.get('terms') as FormGroup;
  }

  get tenantsGroup(): FormGroup {
    return this.leaseForm.get('tenants') as FormGroup;
  }

  get transactionsGroup(): FormGroup {
    return this.leaseForm.get('transactions') as FormGroup;
  }

  get recurringRentGroup(): FormGroup {
    return this.transactionsGroup.get('recurringRent') as FormGroup;
  }

  get rentTenantSharesArray(): FormArray {
    return this.recurringRentGroup.get('tenantShares') as FormArray;
  }

  get depositsArray(): FormArray {
    return this.transactionsGroup.get('deposits') as FormArray;
  }

  get otherTransactionsArray(): FormArray {
    return this.transactionsGroup.get('otherTransactions') as FormArray;
  }

  get lateFeeSettingsGroup(): FormGroup {
    return this.transactionsGroup.get('lateFeeSettings') as FormGroup;
  }

  get utilitiesGroup(): FormGroup {
    return this.leaseForm.get('utilities') as FormGroup;
  }

  get responsibilitiesArray(): FormArray {
    return this.utilitiesGroup.get('responsibilities') as FormArray;
  }

  constructor() {
    effect(() => {
      const selectedStore = this.storeStore.selectedStore();
      const currencyControl = this.termsGroup.get('currency');

      if (!selectedStore || !currencyControl || this.hasInitializedCurrencyDefault()) {
        return;
      }

      const currentValue = String(currencyControl.value || '').trim().toUpperCase();
      const shouldApplyDefault = !currentValue || currentValue === 'NGN' || !currencyControl.dirty;

      if (!shouldApplyDefault) {
        this.hasInitializedCurrencyDefault.set(true);
        return;
      }

      const storeCurrencyCode = this.normalizeCurrencyCode(
        selectedStore.currencyCode || selectedStore.currency,
      );

      currencyControl.setValue(storeCurrencyCode, { emitEvent: false });
      this.hasInitializedCurrencyDefault.set(true);
    });

    this.termsGroup.get('propertyId')?.valueChanges.subscribe((propertyId) => {
      this.onPropertyChange(propertyId || '');
    });

    this.termsGroup.get('leaseType')?.valueChanges.subscribe((leaseType) => {
      this.updateEndDateValidation(leaseType || LeaseType.FIXED_TERM);
    });

    this.updateEndDateValidation(this.termsGroup.get('leaseType')?.value as LeaseType);

    this.tenantsGroup.get('tenantIds')?.valueChanges.subscribe(() => {
      this.syncTenantShares();
    });

    this.transactionsGroup.get('invoicingType')?.valueChanges.subscribe(() => {
      this.syncTenantShares();
    });

    this.recurringRentGroup.get('totalAmount')?.valueChanges.subscribe((amount) => {
      this.syncRecurringRentSharesWithTotal(Number(amount) || 0);
    });

    this.termsGroup.get('unitId')?.valueChanges.subscribe((unitId) => {
      this.autoFillRentAmountFromSelection(unitId || '');
    });

    if (!this.leaseId && this.prefilledTenantIds.length > 0) {
      this.tenantsGroup.patchValue({
        tenantIds: this.prefilledTenantIds,
      });
    }

    if (!this.leaseId && this.prefilledPropertyId) {
      this.termsGroup.patchValue(
        {
          propertyId: this.prefilledPropertyId,
          unitId: this.prefilledUnitId || '',
        },
        { emitEvent: false },
      );
      this.onPropertyChange(this.prefilledPropertyId);
    }

    this.syncTenantShares();

    if (this.leaseId) {
      this.loadLease();
    }
  }

  private normalizeCurrencyCode(currency?: string | null): string {
    const value = String(currency || '').trim().toUpperCase();

    if (!value) {
      return 'NGN';
    }

    const symbolToCode: Record<string, string> = {
      '₦': 'NGN',
      '$': 'USD',
      '€': 'EUR',
      '£': 'GBP',
      '¥': 'JPY',
      '₨': 'MUR',
    };

    if (symbolToCode[value]) {
      return symbolToCode[value];
    }

    if (/^[A-Z]{3}$/.test(value)) {
      return value;
    }

    return 'NGN';
  }

  // ── Deposits ─────────────────────────────────────────────────────

  addDeposit = (): void => {
    const depositGroup = this.fb.group({
      category: [DepositCategory.DEPOSIT, Validators.required],
      accountCode: ['DEPOSIT', Validators.required],
      invoiceDate: [null as Date | null, Validators.required],
      totalAmount: [0, [Validators.required, Validators.min(0)]],
      tenantShares: this.fb.array([]),
      memo: [''],
    });
    this.depositsArray.push(depositGroup);
    this.syncTenantShares();
  };

  removeDeposit = (index: number): void => {
    this.depositsArray.removeAt(index);
  };

  // ── Other Transactions ───────────────────────────────────────────

  addOtherTransaction = (): void => {
    this.otherTransactionsArray.push(this.fb.group({
      title: ['', Validators.required],
      account: ['OTHER_CHARGE', Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]],
      dueDate: [null as Date | null, Validators.required],
      frequency: [null],
      memo: [''],
    }));
  };

  removeOtherTransaction = (index: number): void => {
    this.otherTransactionsArray.removeAt(index);
  };

  // ── Utilities ────────────────────────────────────────────────────

  addUtilityResponsibility = (): void => {
    this.responsibilitiesArray.push(this.fb.group({
      utilityType: [UtilityType.ELECTRICITY, Validators.required],
      customUtilityName: [''],
      responsibleParty: [UtilityResponsibleParty.TENANT, Validators.required],
    }));
  };

  removeUtilityResponsibility = (index: number): void => {
    this.responsibilitiesArray.removeAt(index);
  };

  // ── Property change ──────────────────────────────────────────────

  private onPropertyChange(propertyId: string): void {
    if (!propertyId) {
      this.termsGroup.patchValue({ propertyCategory: '', unitId: '' }, { emitEvent: false });
      this.units.set([]);
      this.selectedPropertyRent.set(0);
      this.setRecurringRentAmount(0);
      return;
    }

    this.propertyService.getPropertyById(propertyId).subscribe({
      next: (res) => {
        const property = res.data as Property;
        const propertyRent = this.resolveAmountValue(property, ['marketRent', 'rentAmount', 'rent']);
        this.selectedPropertyRent.set(propertyRent);
        const category = res.data.category === 'MULTI_UNIT'
          ? LeasePropertyCategory.MULTI_UNIT
          : LeasePropertyCategory.SINGLE_UNIT;
        this.termsGroup.patchValue({ propertyCategory: category }, { emitEvent: false });

        if (category === LeasePropertyCategory.MULTI_UNIT) {
          this.termsGroup.get('unitId')?.setValidators([Validators.required]);
          const storeId = this.storeStore.selectedStore()?._id || '';
          this.unitService.getUnits(storeId, {
            propertyId,
            status: 'VACANT',
            limit: 500,
          }).subscribe({
            next: (unitRes) => {
              const items = unitRes.data.items || [];
              this.units.set(items);
              this.autoFillRentAmountFromSelection(this.termsGroup.get('unitId')?.value || '');
            },
            error: () => {
              this.units.set([]);
              this.setRecurringRentAmount(propertyRent);
            },
          });
        } else {
          this.units.set([]);
          this.termsGroup.patchValue({ unitId: '' }, { emitEvent: false });
          this.termsGroup.get('unitId')?.clearValidators();
          this.setRecurringRentAmount(propertyRent);
        }

        this.termsGroup.get('unitId')?.updateValueAndValidity({ emitEvent: false });
      },
      error: () => {
        this.snackBar.open('Failed to load property details', 'Close', { duration: 4000 });
      },
    });
  }

  private autoFillRentAmountFromSelection(unitId: string): void {
    if (this.isEditMode()) {
      return;
    }

    const propertyCategory = this.termsGroup.get('propertyCategory')?.value;
    if (propertyCategory === LeasePropertyCategory.MULTI_UNIT) {
      const selectedUnit = this.units().find((u: Unit) => u._id === unitId);
      const unitRent = selectedUnit
        ? this.resolveAmountValue(selectedUnit, ['rentAmount', 'marketRent', 'rent'])
        : 0;
      this.setRecurringRentAmount(unitRent || this.selectedPropertyRent());
      return;
    }

    this.setRecurringRentAmount(this.selectedPropertyRent());
  }

  private setRecurringRentAmount(amount: number): void {
    if (this.isEditMode()) {
      return;
    }

    this.recurringRentGroup.patchValue(
      { totalAmount: Number.isFinite(amount) ? amount : 0 },
      { emitEvent: false },
    );
  }

  private resolveAmountValue(source: unknown, keys: string[]): number {
    const dictionary = source as { [key: string]: unknown } | null;
    if (!dictionary) {
      return 0;
    }

    for (const key of keys) {
      const raw = dictionary[key];
      const numeric = Number(raw);
      if (Number.isFinite(numeric) && numeric >= 0) {
        return numeric;
      }
    }
    return 0;
  }

  private updateEndDateValidation(leaseType: LeaseType): void {
    const endDateControl = this.termsGroup.get('endDate');
    if (!endDateControl) return;

    if (leaseType === LeaseType.FIXED_TERM) {
      endDateControl.setValidators([Validators.required]);
    } else {
      endDateControl.clearValidators();
      endDateControl.setValue(null, { emitEvent: false });
    }

    endDateControl.updateValueAndValidity({ emitEvent: false });
  }

  private syncTenantShares(): void {
    const selectedTenantIds = (this.tenantsGroup.get('tenantIds')?.value || []) as string[];
    const invoicingType = this.transactionsGroup.get('invoicingType')?.value as LeaseInvoicingType;
    const shouldShowShares =
      invoicingType === LeaseInvoicingType.INDIVIDUAL && selectedTenantIds.length > 1;

    if (!shouldShowShares) {
      this.rentTenantSharesArray.clear();
      this.depositsArray.controls.forEach((depositControl) => {
        const shares = (depositControl as FormGroup).get('tenantShares') as FormArray;
        shares.clear();
      });
      return;
    }

    this.syncShareArray(this.rentTenantSharesArray, selectedTenantIds);

    const hasAnyRentShareAmount = this.rentTenantSharesArray.controls.some((control) => {
      const amount = Number((control as FormGroup).get('amount')?.value || 0);
      return amount > 0;
    });

    if (!hasAnyRentShareAmount) {
      this.syncRecurringRentSharesWithTotal(
        Number(this.recurringRentGroup.get('totalAmount')?.value) || 0,
      );
    }

    this.depositsArray.controls.forEach((depositControl) => {
      const shares = (depositControl as FormGroup).get('tenantShares') as FormArray;
      this.syncShareArray(shares, selectedTenantIds);
    });
  }

  private syncRecurringRentSharesWithTotal(totalAmount: number): void {
    const selectedTenantIds = (this.tenantsGroup.get('tenantIds')?.value || []) as string[];
    const invoicingType = this.transactionsGroup.get('invoicingType')?.value as LeaseInvoicingType;
    const shouldSyncShares =
      invoicingType === LeaseInvoicingType.INDIVIDUAL &&
      selectedTenantIds.length > 1 &&
      this.rentTenantSharesArray.length > 0;

    if (!shouldSyncShares) {
      return;
    }

    const normalizedTotal = Number.isFinite(totalAmount) && totalAmount > 0 ? totalAmount : 0;
    const totalCents = Math.round(normalizedTotal * 100);
    const count = this.rentTenantSharesArray.length;
    const baseCents = count > 0 ? Math.floor(totalCents / count) : 0;
    let remainderCents = count > 0 ? totalCents - baseCents * count : 0;

    this.rentTenantSharesArray.controls.forEach((control) => {
      const extraCent = remainderCents > 0 ? 1 : 0;
      if (remainderCents > 0) {
        remainderCents -= 1;
      }

      const value = (baseCents + extraCent) / 100;
      (control as FormGroup).get('amount')?.setValue(value, { emitEvent: false });
    });
  }

  private syncShareArray(targetArray: FormArray, tenantIds: string[]): void {
    const existingValues = (targetArray.value || []) as Array<{ tenantId: string; amount: number }>;
    const amountByTenant = new Map<string, number>();

    existingValues.forEach((share) => {
      if (share?.tenantId) {
        amountByTenant.set(share.tenantId, Number(share.amount) || 0);
      }
    });

    targetArray.clear();
    tenantIds.forEach((tenantId) => {
      targetArray.push(
        this.fb.group({
          tenantId: [tenantId, Validators.required],
          amount: [amountByTenant.get(tenantId) ?? 0, [Validators.required, Validators.min(0)]],
        }),
      );
    });
  }

  // ── Load existing lease ──────────────────────────────────────────

  private loadLease(): void {
    if (!this.leaseId) return;

    this.leaseService.getLeaseById(this.leaseId).subscribe({
      next: (res) => {
        const lease = res.data;
        this.isDraftEdit.set(lease.status === LeaseStatus.DRAFT);
        const tenantIds = (lease.tenantIds || [])
          .map((t) => typeof t === 'string' ? t : t._id)
          .filter((id) => !!id);

        this.termsGroup.patchValue({
          propertyId: typeof lease.propertyId === 'string' ? lease.propertyId : lease.propertyId._id,
          propertyCategory: lease.propertyCategory,
          unitId: lease.unitId ? (typeof lease.unitId === 'string' ? lease.unitId : lease.unitId._id) : '',
          leaseType: lease.leaseType,
          startDate: lease.startDate ? new Date(lease.startDate) : null,
          endDate: lease.endDate ? new Date(lease.endDate) : null,
          currency: lease.currency,
          notes: lease.notes || '',
        });

        this.tenantsGroup.patchValue({ tenantIds });

        // Lease transactions
        const txn = lease.leaseTransactions;
        if (txn) {
          this.transactionsGroup.patchValue({
            invoicingType: txn.invoicingType || LeaseInvoicingType.JOINT,
          });

          if (txn.recurringRent) {
            this.recurringRentGroup.patchValue({
              enabled: txn.recurringRent.enabled,
              accountCode: txn.recurringRent.accountCode || 'RENT',
              firstRentDate: txn.recurringRent.firstRentDate ? new Date(txn.recurringRent.firstRentDate) : null,
              dueDateRule: txn.recurringRent.dueDateRule || RentDueDateRule.FIRST_DAY_OF_MONTH,
              frequency: txn.recurringRent.frequency || BillingFrequency.MONTHLY,
              totalAmount: txn.recurringRent.totalAmount || 0,
              markPastInvoicesAsPaid: txn.recurringRent.markPastInvoicesAsPaid || false,
            }, { emitEvent: false });

            this.rentTenantSharesArray.clear();
            (txn.recurringRent.tenantShares || []).forEach((share) => {
              this.rentTenantSharesArray.push(this.fb.group({
                tenantId: [share.tenantId, Validators.required],
                amount: [share.amount, [Validators.required, Validators.min(0)]],
              }));
            });
          }

          this.depositsArray.clear();
          (txn.deposits || []).forEach((dep) => {
            const depositSharesArray = this.fb.array(
              (dep.tenantShares || []).map((s) => this.fb.group({
                tenantId: [s.tenantId, Validators.required],
                amount: [s.amount, [Validators.required, Validators.min(0)]],
              })),
            );
            this.depositsArray.push(this.fb.group({
              category: [dep.category, Validators.required],
              accountCode: [dep.accountCode || 'DEPOSIT', Validators.required],
              invoiceDate: [dep.invoiceDate ? new Date(dep.invoiceDate) : null, Validators.required],
              totalAmount: [dep.totalAmount, [Validators.required, Validators.min(0)]],
              tenantShares: depositSharesArray,
              memo: [dep.memo || ''],
            }));
          });

          this.otherTransactionsArray.clear();
          (txn.otherTransactions || []).forEach((ot) => {
            this.otherTransactionsArray.push(this.fb.group({
              title: [ot.title, Validators.required],
              account: [ot.account, Validators.required],
              amount: [ot.amount, [Validators.required, Validators.min(0)]],
              dueDate: [ot.dueDate ? new Date(ot.dueDate) : null, Validators.required],
              frequency: [ot.frequency || null],
              memo: [ot.memo || ''],
            }));
          });

          if (txn.lateFeeSettings) {
            this.lateFeeSettingsGroup.patchValue({
              enabled: txn.lateFeeSettings.enabled,
              gracePeriodDays: txn.lateFeeSettings.gracePeriodDays || 0,
              gracePeriodTime: this.parseTimeStringToDate(
                txn.lateFeeSettings.gracePeriodTime,
              ),
              oneTimeLateFee: {
                enabled: txn.lateFeeSettings.oneTimeLateFee?.enabled || false,
                feeType: txn.lateFeeSettings.oneTimeLateFee?.feeType || LateFeeType.FIXED,
                value: txn.lateFeeSettings.oneTimeLateFee?.value || 0,
              },
              dailyLateFee: {
                enabled: txn.lateFeeSettings.dailyLateFee?.enabled || false,
                feeType: txn.lateFeeSettings.dailyLateFee?.feeType || LateFeeType.FIXED,
                value: txn.lateFeeSettings.dailyLateFee?.value || 0,
              },
            });
          }
        }

        this.responsibilitiesArray.clear();
        (lease.utilityResponsibilities || []).forEach((utility) => {
          this.responsibilitiesArray.push(this.fb.group({
            utilityType: [utility.utilityType, Validators.required],
            customUtilityName: [utility.customUtilityName || ''],
            responsibleParty: [utility.responsibleParty, Validators.required],
          }));
        });

        this.onPropertyChange(this.termsGroup.get('propertyId')?.value);
        this.syncTenantShares();
      },
      error: () => this.snackBar.open('Failed to load lease', 'Close', { duration: 5000 }),
    });
  }

  // ── Submit ───────────────────────────────────────────────────────

  submit(status: LeaseStatus): void {
    if (this.leaseForm.invalid) {
      this.leaseForm.markAllAsTouched();
      this.snackBar.open('Please complete required fields before submitting', 'Close', {
        duration: 4000,
      });
      return;
    }

    const terms = this.termsGroup.value;
    const txn = this.transactionsGroup.value;
    const startDate = terms.startDate ? new Date(terms.startDate) : null;
    const endDate = terms.endDate ? new Date(terms.endDate) : null;

    if (terms.leaseType === LeaseType.FIXED_TERM && startDate && endDate && endDate <= startDate) {
      this.snackBar.open('End date must be after start date', 'Close', { duration: 4000 });
      return;
    }

    const payload = {
      tenantIds: this.tenantsGroup.get('tenantIds')?.value,
      propertyId: terms.propertyId,
      propertyCategory: terms.propertyCategory,
      unitId: terms.propertyCategory === LeasePropertyCategory.MULTI_UNIT ? terms.unitId : undefined,
      leaseType: terms.leaseType,
      startDate,
      endDate: terms.leaseType === LeaseType.FIXED_TERM ? endDate : undefined,
      currency: terms.currency,
      notes: terms.notes || undefined,
      utilityResponsibilities: this.responsibilitiesArray.value,
      leaseTransactions: this.normalizeLeaseTransactionsForPayload(txn),
      status,
      store: this.storeStore.selectedStore()?._id,
      createdBy: this.sessionStorageService.getCurrentUser()?._id,
    };

    this.isSubmitting.set(true);
    const request$ = this.isEditMode()
      ? this.leaseService.updateLease(this.leaseId!, payload as any)
      : this.leaseService.createLease(payload as any);

    request$.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEditMode() ? 'Lease updated successfully' : 'Lease created successfully',
          'Close',
          { duration: 3500 },
        );
        this.router.navigate(['../'], { relativeTo: this.route });
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message || 'Failed to save lease', 'Close', {
          duration: 5000,
        });
        this.isSubmitting.set(false);
      },
    });
  }

  saveDraft(): void {
    this.submit(LeaseStatus.DRAFT);
  }

  activateLease(): void {
    if (this.isDraftEdit() && this.leaseId) {
      // Save draft first, then activate via dedicated endpoint
      this.submitThenActivate();
    } else {
      this.submit(LeaseStatus.ACTIVE);
    }
  }

  private submitThenActivate(): void {
    if (this.leaseForm.invalid) {
      this.leaseForm.markAllAsTouched();
      this.snackBar.open('Please complete required fields before submitting', 'Close', {
        duration: 4000,
      });
      return;
    }

    const terms = this.termsGroup.value;
    const txn = this.transactionsGroup.value;
    const startDate = terms.startDate ? new Date(terms.startDate) : null;
    const endDate = terms.endDate ? new Date(terms.endDate) : null;

    if (terms.leaseType === LeaseType.FIXED_TERM && startDate && endDate && endDate <= startDate) {
      this.snackBar.open('End date must be after start date', 'Close', { duration: 4000 });
      return;
    }

    const payload = {
      tenantIds: this.tenantsGroup.get('tenantIds')?.value,
      propertyId: terms.propertyId,
      propertyCategory: terms.propertyCategory,
      unitId: terms.propertyCategory === LeasePropertyCategory.MULTI_UNIT ? terms.unitId : undefined,
      leaseType: terms.leaseType,
      startDate,
      endDate: terms.leaseType === LeaseType.FIXED_TERM ? endDate : undefined,
      currency: terms.currency,
      notes: terms.notes || undefined,
      utilityResponsibilities: this.responsibilitiesArray.value,
      leaseTransactions: this.normalizeLeaseTransactionsForPayload(txn),
      status: LeaseStatus.DRAFT,
      store: this.storeStore.selectedStore()?._id,
      createdBy: this.sessionStorageService.getCurrentUser()?._id,
    };

    this.isSubmitting.set(true);

    // Step 1: Save the draft with all updated fields
    this.leaseService.updateLease(this.leaseId!, payload as any).subscribe({
      next: () => {
        // Step 2: Activate via dedicated endpoint (triggers billing)
        this.leaseService.activateLease(this.leaseId!).subscribe({
          next: () => {
            this.snackBar.open('Lease activated successfully', 'Close', { duration: 3500 });
            this.router.navigate(['../'], { relativeTo: this.route });
          },
          error: (err) => {
            this.snackBar.open(
              err?.error?.message || 'Lease saved but activation failed',
              'Close',
              { duration: 5000 },
            );
            this.isSubmitting.set(false);
          },
        });
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message || 'Failed to save lease', 'Close', {
          duration: 5000,
        });
        this.isSubmitting.set(false);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  private getPrefilledTenantIds(): string[] {
    const tenantId = this.route.snapshot.queryParamMap.get('tenantId');
    const tenantIdsParam = this.route.snapshot.queryParamMap.get('tenantIds');

    const tenantIds = [
      ...(tenantId ? [tenantId] : []),
      ...(tenantIdsParam
        ? tenantIdsParam
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)
        : []),
    ];

    return Array.from(new Set(tenantIds));
  }

  private parseTimeStringToDate(value?: string | null): Date | null {
    if (!value) return null;

    const twelveHour = value
      .trim()
      .match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
    if (twelveHour) {
      let hours = Number(twelveHour[1]);
      const minutes = Number(twelveHour[2]);
      const period = twelveHour[3].toUpperCase();

      if (hours === 12) hours = 0;
      if (period === 'PM') hours += 12;

      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    }

    const twentyFourHour = value.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (twentyFourHour) {
      const hours = Number(twentyFourHour[1]);
      const minutes = Number(twentyFourHour[2]);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    }

    return null;
  }

  private formatDateToTimeString(value: unknown): string | undefined {
    if (!value) return undefined;
    if (typeof value === 'string') return value.trim() || undefined;
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) return undefined;

    const hours = value.getHours();
    const minutes = value.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const twelveHour = hours % 12 || 12;
    return `${twelveHour}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  private normalizeLateFeeSettingsForPayload(lateFeeSettings: any): any {
    return {
      ...lateFeeSettings,
      gracePeriodTime: this.formatDateToTimeString(
        lateFeeSettings?.gracePeriodTime,
      ),
    };
  }

  private normalizeLeaseTransactionsForPayload(txn: any): any {
    const deposits = (txn?.deposits || []).map((dep: any) => ({
      ...dep,
      category: this.mapDepositCategoryFromAccount(dep?.accountCode),
    }));

    const recurringRent = {
      ...(txn?.recurringRent || {}),
      accountCode: 'RENT',
    };

    return {
      invoicingType: txn?.invoicingType,
      recurringRent,
      deposits,
      otherTransactions: txn?.otherTransactions,
      lateFeeSettings: this.normalizeLateFeeSettingsForPayload(
        txn?.lateFeeSettings,
      ),
    };
  }

  private mapDepositCategoryFromAccount(accountCode?: string): DepositCategory {
    switch (accountCode) {
      case DepositCategory.LAST_MONTHS_RENT:
        return DepositCategory.LAST_MONTHS_RENT;
      case DepositCategory.PET_DEPOSIT:
        return DepositCategory.PET_DEPOSIT;
      case DepositCategory.KEY_DEPOSIT:
        return DepositCategory.KEY_DEPOSIT;
      case DepositCategory.OTHER:
        return DepositCategory.OTHER;
      case DepositCategory.DEPOSIT:
      default:
        return DepositCategory.DEPOSIT;
    }
  }
}
