import { Component, OnInit, inject, signal } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReconciliationService } from '../../../../../shared/services/reconciliation.service';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { AuthService } from '../../../../../shared/services/auth.service';

@Component({
  selector: 'app-start-reconciliation',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    RouterModule
],
  template: `
    <div class="p-6 max-w-2xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Start New Reconciliation</h1>
          <p class="text-gray-600 mt-1">Initialize a new inventory reconciliation session</p>
        </div>
        <button mat-button [routerLink]="['..']" class="text-gray-600">
          <mat-icon>arrow_back</mat-icon>
          Back to List
        </button>
      </div>

      <form [formGroup]="reconciliationForm" (ngSubmit)="onSubmit()">
        <mat-card class="mb-6">
          <mat-card-header>
            <mat-card-title>Reconciliation Details</mat-card-title>
          </mat-card-header>
          <mat-card-content class="p-6">
            <div class="space-y-6">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Reconciliation Name *</mat-label>
                <input matInput formControlName="name" placeholder="e.g., Monthly Inventory Count - December 2024">
                @if (reconciliationForm.get('name')?.invalid && reconciliationForm.get('name')?.touched) {
                  <mat-error>Reconciliation name is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Type</mat-label>
                <mat-select formControlName="type">
                  <mat-option value="full_inventory">Full Inventory Count</mat-option>
                  <mat-option value="partial">Partial Count</mat-option>
                  <mat-option value="cycle_count">Cycle Count</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" rows="3" 
                          placeholder="Optional description or notes about this reconciliation"></textarea>
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Information Card -->
        <mat-card class="mb-6">
          <mat-card-content class="p-6">
            <div class="flex items-start space-x-4">
              <mat-icon class="text-blue-500 mt-1">info</mat-icon>
              <div>
                <h3 class="font-semibold text-gray-900 mb-2">What happens next?</h3>
                <ul class="text-sm text-gray-600 space-y-1">
                  <li>• System will load all current products and their quantities</li>
                  <li>• You'll be able to enter physical counts for each product</li>
                  <li>• Discrepancies will be automatically calculated</li>
                  <li>• Review and approve adjustments before updating inventory</li>
                </ul>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Action Buttons -->
        <div class="flex justify-end space-x-4">
          <button type="button" mat-button [routerLink]="['..']">Cancel</button>
          <button
            type="submit"
            mat-raised-button
            color="primary"
            [disabled]="reconciliationForm.invalid || isSubmitting()"
          >
            @if (isSubmitting()) {
              <mat-spinner diameter="20" class="mr-2"></mat-spinner>
            }
            Initialize Reconciliation
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .mat-mdc-form-field {
      width: 100%;
    }
  `]
})
export class StartReconciliationComponent implements OnInit {
  public storeStore = inject(StoreStore);
  private authService = inject(AuthService);
  public isSubmitting = signal(false);
  public currentUser = toSignal(this.authService.currentUser, { initialValue: null });

  reconciliationForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private reconciliationService: ReconciliationService,
    private router: Router
  ) {
    this.reconciliationForm = this.fb.group({
      name: ['', Validators.required],
      type: ['full_inventory'],
      description: ['']
    });
  }

  ngOnInit(): void {
    // Generate default name with current date
    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const defaultName = `Inventory Count - ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    this.reconciliationForm.patchValue({ name: defaultName });
  }

  onSubmit(): void {
    if (this.reconciliationForm.valid) {
      this.isSubmitting.set(true);
      
      const formValue = this.reconciliationForm.value;
      const initData = {
        ...formValue,
        createdBy: this.currentUser()?._id
      };

      this.reconciliationService.initialize(initData).subscribe({
        next: (response) => {
          console.log('Reconciliation initialized:', response);
          // Navigate to the count page for this reconciliation
          this.router.navigate(['dashboard', 'inventory', 'reconciliations', response._id, 'count']);
        },
        error: (error) => {
          console.error('Error initializing reconciliation:', error);
          this.isSubmitting.set(false);
        }
      });
    }
  }
}
