import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StoreStore } from '../../../shared/stores/store.store';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SessionStorageService } from '../../../shared/services/session-storage.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { StoreService } from '../../../shared/services/store.service';
import { CustomerService } from '../../../shared/services/customer.service';
import { User } from '../../../shared/models';
function lowercaseEmailValidator(control: FormControl): { [key: string]: string } | null {
  if (control.value) {
    const lowercasedEmail = control.value.toLowerCase();
    if (lowercasedEmail !== control.value) {
      return { lowercaseEmail: lowercasedEmail };
    }
  }
  return null;
}

@Component({
  selector: 'app-customer-dialog',
  templateUrl: './customer-dialog.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule
  ]
})
export class CustomerDialogComponent {
  private storeStore = inject(StoreStore);
  private fb = inject(FormBuilder);
  private customerService = inject(CustomerService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<CustomerDialogComponent>);
  private data = inject(MAT_DIALOG_DATA);
  private storeService = inject(StoreService);
  public isSubmitting = signal(false);
  public genders = ['Male', 'Female'];
  public isEdit = this.data.isEdit;
  public form = this.fb.group({
    name: ["", [Validators.required, Validators.minLength(2)]],
    email: [
      "",
      [Validators.required, Validators.email, lowercaseEmailValidator],
    ],
    phoneNumber: ["", [Validators.required, Validators.minLength(6)]],
    country: ["", Validators.required],
    currency: ["", Validators.required],
    notes: [""],
    store: [this.storeStore.selectedStore()?._id, Validators.required], 
    password: ["123456", Validators.required],
  });
    public isLoading = signal(false);

  public deliveryZones = rxResource({
    stream: () =>
      this.storeService.getDeliveryZonesFromServer()
  });

  ngOnInit() {
    if (this.isEdit && this.data.customer) {
      this.form.patchValue(this.data.customer);
    }
  }


  public selectCountry(country:string): void {
    const selectedZone = this.deliveryZones.value()!.find((zone) => zone.country === country);
    if (selectedZone) {
      this.form.patchValue({
        currency: selectedZone.currency,
      });
    }
  }

  onSubmit() {
    if (this.form.valid) {
      this.isSubmitting.set(true);
      const formData = this.form.getRawValue();
      if (this.isEdit) {
        this.customerService.updateCustomer(this.data.customer._id, formData as Partial<User>).subscribe(
          (data: any) => {
            this.dialogRef.close(true);
          }, (err) => {
            this.isLoading.set(false);
            this.snackBar.open(
              "Server or internet error please try again",
              "Close",
              { duration: 3000 }
            );
          }
        );
      } else {
        this.customerService.createCustomer(formData as Partial<User>).subscribe(
          (data: any) => {
            if (data.status == 401 || data?.err) {
              if (data.err.keyPattern.hasOwnProperty("email")) {
              this.isLoading.set(false);
              this.snackBar.open(
                "Email has already been used.",
                "Close",
                { duration: 3000 }
              );
            } else if (data.err.keyPattern.hasOwnProperty("phoneNumber")) {
              this.isLoading.set(false);
              this.snackBar.open(
                "Phone number has already been used.",
                "Close",
                { duration: 3000 }
              );
            }
          } else {
            this.dialogRef.close(true);
          }
        },
        (err) => {
          this.isLoading.set(false);
          this.snackBar.open(
            "Server or internet error please try again",
            "Close",
            { duration: 3000 }
          );
        }
        );
    }
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
