import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SuppliersService } from '../../../../shared/services/suppliers.service';
import { Supplier, CreateSupplierDto, UpdateSupplierDto } from '../../../../shared/models/supplier.model';
import { StoreStore } from '../../../../shared/stores/store.store';
import { AuthService } from '../../../../shared/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-create-suppliers',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './create-suppliers.component.html',
  styleUrl: './create-suppliers.component.scss'
})
export class CreateSuppliersComponent implements OnInit {
  private fb = inject(FormBuilder);
  private suppliersService = inject(SuppliersService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  public storeStore = inject(StoreStore);
  private authService = inject(AuthService);

  public currentUser = toSignal(this.authService.currentUser, {
    initialValue: null,
  });

  supplierForm!: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  isEditMode = signal(false);
  supplierId: string | null = null;

  constructor() {
    this.initializeForm();
  }

  ngOnInit() {
    this.supplierId = this.route.snapshot.paramMap.get('id');
    if (this.supplierId) {
      this.isEditMode.set(true);
      this.loadSupplier();
    }
  }

  private initializeForm() {
    this.supplierForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      contactPerson: [''],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      website: [''],
      description: [''],
      taxId: [''],
      paymentTerms: [''],
      creditLimit: [null],
      active: [true],
      notes: [''],
      address: this.fb.group({
        street: [''],
        city: [''],
        state: [''],
        country: [''],
        postalCode: ['']
      })
    });
  }

  loadSupplier() {
    if (!this.supplierId) return;
    
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;
    
    this.loading.set(true);
    this.suppliersService.getSupplier(this.supplierId, storeId).subscribe({
      next: (supplier) => {
        this.supplierForm.patchValue(supplier);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set('Failed to load supplier details');
        this.loading.set(false);
        console.error('Error loading supplier:', error);
      }
    });
  }

  onSubmit() {
    if (this.supplierForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    const storeId = this.storeStore.selectedStore()?._id;
    const currentUser = this.currentUser();
    
    if (!storeId || !currentUser) {
      this.error.set('Store or user information not available');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formValue = this.supplierForm.value;
    
    if (this.isEditMode() && this.supplierId) {
      // Update existing supplier
      const updateDto: UpdateSupplierDto = formValue;
      this.suppliersService.updateSupplier(this.supplierId, updateDto, storeId).subscribe({
        next: () => {
          this.snackBar.open('Supplier updated successfully', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          this.router.navigate(['/dashboard/inventory/suppliers']);
        },
        error: (error) => {
          this.error.set('Failed to update supplier');
          this.loading.set(false);
          this.snackBar.open('Failed to update supplier', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          console.error('Error updating supplier:', error);
        }
      });
    } else {
      // Create new supplier
      const createDto: CreateSupplierDto = {
        ...formValue,
        store: storeId,
        createdBy: currentUser._id
      };
      
      this.suppliersService.createSupplier(createDto).subscribe({
        next: () => {
          this.snackBar.open('Supplier created successfully', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          this.router.navigate(['/dashboard/inventory/suppliers']);
        },
        error: (error) => {
          this.error.set('Failed to create supplier');
          this.loading.set(false);
          this.snackBar.open('Failed to create supplier', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          console.error('Error creating supplier:', error);
        }
      });
    }
  }

  onCancel() {
    this.router.navigate(['/dashboard/inventory/suppliers']);
  }

  private markAllFieldsAsTouched() {
    Object.keys(this.supplierForm.controls).forEach(key => {
      const control = this.supplierForm.get(key);
      control?.markAsTouched();

      if (control && control.value && typeof control.value === 'object') {
        // Handle nested form groups (like address)
        const formGroup = control as FormGroup;
        Object.keys(formGroup.controls).forEach(nestedKey => {
          formGroup.get(nestedKey)?.markAsTouched();
        });
      }
    });
  }

  // Helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.supplierForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  isNestedFieldInvalid(groupName: string, fieldName: string): boolean {
    const field = this.supplierForm.get(`${groupName}.${fieldName}`);
    return field ? field.invalid && field.touched : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.supplierForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }
}
