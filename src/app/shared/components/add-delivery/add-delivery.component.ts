import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyMaskModule } from 'ng2-currency-mask';
import { StoreStore } from '../../stores/store.store';

export interface AddDeliveryDialogData {
  deliveryFee?: number;
  address?: string;
}

export interface AddDeliveryDialogResult {
  deliveryFee: number;
  address: string;
}

@Component({
  selector: 'app-add-delivery',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    CurrencyMaskModule,
  ],
  templateUrl: './add-delivery.component.html',
  styleUrl: './add-delivery.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddDeliveryComponent {
  private readonly dialogRef = inject(MatDialogRef<AddDeliveryComponent>);
  protected readonly data = inject<AddDeliveryDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  public readonly storeStore = inject(StoreStore);

  protected deliveryForm: FormGroup = this.fb.group({
    deliveryFee: [this.data?.deliveryFee || '', [Validators.required, Validators.min(0)]],
  });

  get f() {
    return this.deliveryForm.controls;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onApply(): void {
    if (this.deliveryForm.valid) {
      this.dialogRef.close(this.deliveryForm.getRawValue() as AddDeliveryDialogResult);
    }
  }

  onRemoveDelivery(): void {
    this.dialogRef.close({ deliveryFee: 0, address: '' } as AddDeliveryDialogResult);
  }
}
