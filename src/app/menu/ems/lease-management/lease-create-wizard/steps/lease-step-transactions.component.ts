import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  BillingFrequency,
  LateFeeType,
  LeaseInvoicingType,
  RentDueDateRule,
  Tenant,
} from '../../../../../shared/models/estate.model';
import { FinancialSide } from '../../../../../shared/enums/financial.enums';
import { InvoiceCategorySelectComponent } from '../../../../../shared/components/invoice-category-select/invoice-category-select.component';

@Component({
  selector: 'app-lease-step-transactions',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatTimepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    InvoiceCategorySelectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lease-step-transactions.component.html',
})
export class LeaseStepTransactionsComponent {
  @Input({ required: true }) transactionsGroup!: FormGroup;
  @Input({ required: true }) depositsArray!: FormArray;
  @Input({ required: true }) otherTransactionsArray!: FormArray;
  @Input({ required: true }) addDeposit!: () => void;
  @Input({ required: true }) removeDeposit!: (index: number) => void;
  @Input({ required: true }) addOtherTransaction!: () => void;
  @Input({ required: true }) removeOtherTransaction!: (index: number) => void;
  @Input() tenants: Tenant[] = [];
  @Input() selectedTenantIds: string[] = [];

  readonly financialSide = FinancialSide;

  readonly invoicingTypeOptions = Object.values(LeaseInvoicingType);
  readonly billingFrequencyOptions = Object.values(BillingFrequency);
  readonly dueDateRuleOptions = Object.values(RentDueDateRule);
  readonly lateFeeTypeOptions = Object.values(LateFeeType);

  get recurringRentGroup(): FormGroup {
    return this.transactionsGroup.get('recurringRent') as FormGroup;
  }

  get rentTenantSharesArray(): FormArray {
    return this.recurringRentGroup.get('tenantShares') as FormArray;
  }

  get lateFeeSettingsGroup(): FormGroup {
    return this.transactionsGroup.get('lateFeeSettings') as FormGroup;
  }

  get recurringRentAccountControl(): FormControl<string | null> {
    return this.recurringRentGroup.get('accountCode') as FormControl<string | null>;
  }

  get isIndividualInvoicing(): boolean {
    return this.transactionsGroup.get('invoicingType')?.value === LeaseInvoicingType.INDIVIDUAL;
  }

  get hasMultipleTenants(): boolean {
    return this.selectedTenantIds.length > 1;
  }

  tenantName(tenantId: string): string {
    const t = this.tenants.find((tenant) => tenant._id === tenantId);
    return t ? `${t.firstName} ${t.lastName}` : tenantId;
  }

  getDepositTenantSharesArray(index: number): FormArray {
    return (this.depositsArray.at(index) as FormGroup).get('tenantShares') as FormArray;
  }

  getDepositAccountControl(index: number): FormControl<string | null> {
    return (this.depositsArray.at(index) as FormGroup).get('accountCode') as FormControl<string | null>;
  }

  getOtherTransactionAccountControl(index: number): FormControl<string | null> {
    return (this.otherTransactionsArray.at(index) as FormGroup).get('account') as FormControl<string | null>;
  }

  trackByIndex(index: number): number {
    return index;
  }
}
