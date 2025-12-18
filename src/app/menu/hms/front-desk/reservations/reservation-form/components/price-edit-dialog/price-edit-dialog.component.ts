import {
  Component,
  inject,
  signal,
  computed,
  effect,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormBuilder,
  ReactiveFormsModule,
  FormArray,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import {
  MatDialogModule,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { CurrencyMaskModule } from 'ng2-currency-mask';
import { StoreStore } from '../../../../../../../shared/stores/store.store';
import { Subject, takeUntil } from 'rxjs';
import { ReservationFormService } from '../../../../../../../shared/services/reservation-form.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-price-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatDividerModule,
    MatDialogModule,
    CurrencyMaskModule,
  ],
  templateUrl: './price-edit-dialog.component.html',
  styleUrl: './price-edit-dialog.component.scss',
})
export class PriceEditDialogComponent implements OnInit, OnDestroy {
  private reservationFormService = inject(ReservationFormService);
  public reservationForm = toSignal<FormGroup | null>(
    this.reservationFormService.form$,
    { initialValue: null }
  );
  private dialogRef = inject(MatDialogRef<PriceEditDialogComponent>);
  data = inject(MAT_DIALOG_DATA);
  public storeStore = inject(StoreStore);
  private destroy$ = new Subject<void>();

  discountTypeOptions = [
    { value: 'percentage', label: 'Percentage (%)' },
    { value: 'amount', label: 'Fixed Amount' },
  ];

  // Handle both cases: roomIndex (from rooms list) or pricing data (from room-sharers)
  pricingForm: FormGroup;
  stayPeriodForm: FormGroup | null = null;
  fees: FormGroup;

  constructor() {
    // Always get the form directly from reservation form using roomIndex
    const roomsArray = this.reservationForm()!.get('rooms') as FormArray;
    this.pricingForm = roomsArray.at(this.data.roomIndex)!.get('pricing') as FormGroup;
    this.stayPeriodForm = roomsArray.at(this.data.roomIndex)!.get('stayPeriod') as FormGroup;
    
    this.fees = this.pricingForm.get('fees') as FormGroup;
  }

  // Declare signals with initial values from form
  discountType = signal<string>('amount');
  taxes = signal<number>(0);
  discount = signal<number>(0);
  serviceFee = signal<number>(0);
  cleaningFee = signal<number>(0);
  resortFee = signal<number>(0);
  otherFee = signal<number>(0);
  numberOfNights = signal<number>(0);
  pricePerNight = signal<number>(0);

  // Calculate subtotal: pricePerNight * numberOfNights (BEFORE any adjustments)
  public subtotal = computed(() => {
    const price = this.pricePerNight();
    const nights = this.numberOfNights();
    return price * nights;
  });

  // Calculate discount amount based on type and value
  public discountAmount = computed(() => {
    if (this.discountType() === 'percentage') {
      return (this.subtotal() * this.discount()) / 100;
    } else {
      return this.discount();
    }
  });

  // Computed signal for auto-calculated total
  // totalPrice = subtotal - discount + taxes + fees (AFTER discount)
  public calculatedTotal = computed(() => {
    const sub = this.subtotal();
    const discountAmt = this.discountAmount();
    const tax = this.taxes();
    const svc = this.serviceFee();
    const clean = this.cleaningFee();
    const resort = this.resortFee();
    const other = this.otherFee();
    // totalPrice = subtotal - discount + taxes + fees
    const total = sub - discountAmt + tax + svc + clean + resort + other;

    return Math.max(0, total);
  });

  eff = effect(() => {
    const total = this.calculatedTotal();
    const sub = this.subtotal();
    this.pricingForm.patchValue(
      { subtotal: sub, total: total },
      { emitEvent: false }
    );
  });

  ngOnInit() {
    // Set all initial values
    this.discountType.set(this.pricingForm?.get('discountType')?.value || 'amount');
    this.taxes.set(this.pricingForm?.get('taxes')?.value || 0);
    this.discount.set(this.pricingForm?.get('discount')?.value || 0);
    this.pricePerNight.set(this.pricingForm?.get('pricePerNight')?.value || 0);

    if (this.fees) {
      this.serviceFee.set(this.fees.get('serviceFee')?.value || 0);
      this.cleaningFee.set(this.fees.get('cleaningFee')?.value || 0);
      this.resortFee.set(this.fees.get('resortFee')?.value || 0);
      this.otherFee.set(this.fees.get('other')?.value || 0);
    }

    if (this.stayPeriodForm) {
      this.numberOfNights.set(this.stayPeriodForm.get('numberOfNights')?.value || 0);
    }

    // Subscribe to changes with takeUntil for cleanup
    this.pricingForm?.get('discountType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.discountType.set(value);
      });

    this.pricingForm?.get('taxes')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.taxes.set(value || 0);
      });

    this.pricingForm?.get('discount')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.discount.set(value || 0);
      });

    this.pricingForm?.get('pricePerNight')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.pricePerNight.set(value || 0);
      });

    if (this.fees) {
      this.fees.get('serviceFee')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe((value) => {
          console.log('serviceFee changed:', value);
          this.serviceFee.set(value || 0);
        });

      this.fees.get('cleaningFee')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe((value) => {
          this.cleaningFee.set(value || 0);
        });

      this.fees.get('resortFee')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe((value) => {
          this.resortFee.set(value || 0);
        });

      this.fees.get('other')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe((value) => {
          this.otherFee.set(value || 0);
        });
    }

    if (this.stayPeriodForm) {
      this.stayPeriodForm.get('numberOfNights')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe((value) => {
          this.numberOfNights.set(value || 0);
        });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    if (this.pricingForm.valid) {
      this.dialogRef.close(this.pricingForm.value);
    }
  }
}