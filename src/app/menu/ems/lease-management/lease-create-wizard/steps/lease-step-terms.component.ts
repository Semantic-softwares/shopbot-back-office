import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { LeasePropertyCategory, LeaseType, Property, Unit } from '../../../../../shared/models/estate.model';

@Component({
  selector: 'app-lease-step-terms',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lease-step-terms.component.html',
})
export class LeaseStepTermsComponent {
  @Input({ required: true }) termsGroup!: FormGroup;
  @Input({ required: true }) properties: Property[] = [];
  @Input() units: Unit[] = [];

  readonly leaseTypeOptions = Object.values(LeaseType);
  readonly propertyCategory = LeasePropertyCategory;
  readonly currencyOptions = [
    { code: 'NGN', label: 'Nigerian Naira (NGN)' },
    { code: 'USD', label: 'US Dollar (USD)' },
    { code: 'EUR', label: 'Euro (EUR)' },
    { code: 'GBP', label: 'British Pound (GBP)' },
    { code: 'MUR', label: 'Mauritian Rupee (MUR)' },
    { code: 'CAD', label: 'Canadian Dollar (CAD)' },
    { code: 'AUD', label: 'Australian Dollar (AUD)' },
    { code: 'ZAR', label: 'South African Rand (ZAR)' },
    { code: 'KES', label: 'Kenyan Shilling (KES)' },
    { code: 'GHS', label: 'Ghanaian Cedi (GHS)' },
    { code: 'AED', label: 'UAE Dirham (AED)' },
  ];
}
