import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { Property, Tenant, Unit } from '../../../../../shared/models/estate.model';

@Component({
  selector: 'app-lease-step-summary',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatChipsModule, MatDividerModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lease-step-summary.component.html',
})
export class LeaseStepSummaryComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) leaseForm!: FormGroup;
  @Input() properties: Property[] = [];
  @Input() units: Unit[] = [];
  @Input() tenants: Tenant[] = [];

  ngOnInit(): void {
    this.leaseForm.valueChanges.subscribe(() => this.cdr.markForCheck());
  }

  get terms(): Record<string, any> {
    return this.leaseForm.get('terms')?.value || {};
  }

  get transactions(): Record<string, any> {
    return this.leaseForm.get('transactions')?.value || {};
  }

  get recurringRent(): Record<string, any> {
    return this.transactions['recurringRent'] || {};
  }

  get deposits(): any[] {
    return this.transactions['deposits'] || [];
  }

  get otherTransactions(): any[] {
    return this.transactions['otherTransactions'] || [];
  }

  get lateFeeSettings(): Record<string, any> {
    return this.transactions['lateFeeSettings'] || {};
  }

  get utilities(): any[] {
    return this.leaseForm.get('utilities.responsibilities')?.value || [];
  }

  get tenantIds(): string[] {
    return this.leaseForm.get('tenants.tenantIds')?.value || [];
  }

  propertyName(propertyId: string): string {
    return this.properties.find((p) => p._id === propertyId)?.name || '-';
  }

  unitName(unitId?: string): string {
    if (!unitId) return '-';
    return this.units.find((u) => u._id === unitId)?.name || '-';
  }

  tenantList(): Array<{ name: string; found: boolean }> {
    return this.tenantIds.map((id) => {
      const tenant = this.tenants.find((t) => t._id === id);
      return tenant
        ? { name: this.tenantFullName(tenant), found: true }
        : { name: id, found: false };
    });
  }

  tenantFullName(tenant: Tenant): string {
    return `${tenant.firstName} ${tenant.middleName || ''} ${tenant.lastName}`.replace(/\s+/g, ' ').trim();
  }

  tenantName(tenantId: string): string {
    const tenant = this.tenants.find((t) => t._id === tenantId);
    return tenant ? this.tenantFullName(tenant) : tenantId;
  }

  formatDate(val: Date | string | null | undefined): string {
    if (!val) return '-';
    const d = new Date(val);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  leaseTypeLabel(val: string): string {
    const map: Record<string, string> = {
      FIXED_TERM: 'Fixed Term',
      MONTH_TO_MONTH: 'Month to Month',
    };
    return map[val] ?? val;
  }

  invoicingTypeLabel(val: string): string {
    const map: Record<string, string> = {
      JOINT: 'Joint (Single Invoice)',
      INDIVIDUAL: 'Individual (Per Tenant)',
    };
    return map[val] ?? val;
  }

  dueDateRuleLabel(val: string): string {
    const map: Record<string, string> = {
      SAME_DAY_AS_FIRST_RENT_DATE: 'Same Day as First Rent Date',
      FIRST_DAY_OF_MONTH: '1st of the Month',
      LAST_DAY_OF_MONTH: 'Last Day of the Month',
      CUSTOM_DAY_OF_MONTH: 'Custom Day of Month',
    };
    return map[val] ?? val;
  }

  frequencyLabel(val: string): string {
    const map: Record<string, string> = {
      DAILY: 'Daily',
      WEEKLY: 'Weekly',
      BI_WEEKLY: 'Bi-Weekly',
      MONTHLY: 'Monthly',
      BI_MONTHLY: 'Bi-Monthly',
      QUARTERLY: 'Quarterly',
      SEMI_ANNUAL: 'Semi-Annual',
      ANNUAL: 'Annual',
    };
    return map[val] ?? val;
  }

  depositCategoryLabel(val: string): string {
    const map: Record<string, string> = {
      DEPOSIT: 'Security Deposit',
      LAST_MONTHS_RENT: "Last Month's Rent",
      PET_DEPOSIT: 'Pet Deposit',
      KEY_DEPOSIT: 'Key Deposit',
      OTHER: 'Other',
    };
    return map[val] ?? val;
  }

  lateFeeTypeLabel(val: string): string {
    const map: Record<string, string> = {
      FIXED: 'Fixed Amount',
      PERCENTAGE: 'Percentage of Rent',
    };
    return map[val] ?? val;
  }
}
