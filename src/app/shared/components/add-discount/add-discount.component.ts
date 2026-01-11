import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyMaskModule } from 'ng2-currency-mask';
import { Discount } from '../../models/discount.model';
import { StoreStore } from '../../stores/store.store';

export interface AddDiscountDialogData {
  discount?: Discount;
}

export interface AddDiscountDialogResult {
  discountType: string;
  value: number;
  reference: string;
}

@Component({
  selector: 'app-add-discount',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    CurrencyMaskModule,
  ],
  templateUrl: './add-discount.component.html',
  styleUrl: './add-discount.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddDiscountComponent {
  private readonly dialogRef = inject(MatDialogRef<AddDiscountComponent>);
  protected readonly data = inject<AddDiscountDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  public readonly storeStore = inject(StoreStore);

  protected discountForm: FormGroup = this.fb.group({
    discountType: [this.data?.discount?.discountType || 'Amount', Validators.required],
    value: [this.data?.discount?.value || '', [Validators.required, Validators.min(0)]],
    reference: [this.data?.discount?.reference || ''],
  });

  get f() {
    return this.discountForm.controls;
  }

  get valueLabel(): string {
    return this.f['discountType'].value === 'Amount' ? 'Enter Amount' : 'Enter Percentage';
  }

  get valueIcon(): string {
    return this.f['discountType'].value === 'Amount' ? 'attach_money' : 'percent';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onApply(): void {
    if (this.discountForm.valid) {
      this.dialogRef.close(this.discountForm.getRawValue() as AddDiscountDialogResult);
    }
  }

  onRemoveDiscount(): void {
    this.dialogRef.close({ discountType: '', value: 0, reference: '' } as AddDiscountDialogResult);
  }
}
