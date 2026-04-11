import { Component, input, inject, signal, computed, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from "@angular/material/icon";
import { MatSnackBar } from '@angular/material/snack-bar';
import { CancelSubscriptionDialogComponent } from './cancel-subscription-dialog/cancel-subscription-dialog.component';
import { SubscriptionWithModules, ModuleKey, BillingCycle } from '../../../../shared/models/subscription.model';
import { environment } from '../../../../../environments/environment';
import { SubscriptionService } from '../../../../shared/services/subscription.service';

interface ModuleDef {
  key: ModuleKey;
  label: string;
  icon: string;
  description: string;
}

const MODULE_DEFS: ModuleDef[] = [
  { key: 'PMS', label: 'Property Management', icon: 'hotel', description: 'Hotel rooms, reservations, guests' },
  { key: 'EMS', label: 'Estate Management', icon: 'apartment', description: 'Properties, tenants, leases' },
  { key: 'POS', label: 'Point of Sale', icon: 'point_of_sale', description: 'Sales, orders, kitchen display' },
  { key: 'ERP', label: 'Enterprise Resource Planning', icon: 'business', description: 'Inventory, suppliers, staff' },
];

@Component({
  selector: 'app-current-plan',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './current-plan.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrentPlanComponent {
  data = input.required<SubscriptionWithModules>();
  subscriptionChanged = output<void>();

  private subscriptionService = inject(SubscriptionService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  addingModule = signal<ModuleKey | null>(null);
  removingModule = signal<ModuleKey | null>(null);
  changingCycle = signal<boolean>(false);

  readonly subscription = computed(() => this.data().subscription);
  readonly modules = computed(() => this.data().modules);
  readonly pricing = computed(() => this.data().pricing);

  readonly activeModules = computed(() =>
    this.modules().filter(m => m.status === 'ACTIVE')
  );

  readonly pendingRemovalModules = computed(() =>
    this.modules().filter(m => m.status === 'PENDING_REMOVAL')
  );

  readonly subscribedKeys = computed(() =>
    new Set(this.modules().map(m => m.moduleKey))
  );

  readonly availableToAdd = computed(() =>
    MODULE_DEFS.filter(def => !this.subscribedKeys().has(def.key))
  );

  getModuleDef(key: ModuleKey): ModuleDef {
    return MODULE_DEFS.find(d => d.key === key) ?? MODULE_DEFS[0];
  }

  getModulePricing(key: ModuleKey): { monthly: number; yearly: number; billingPrice: number } {
    const p = this.pricing().find(pr => pr.moduleKey === key);
    return p ?? { monthly: 0, yearly: 0, billingPrice: 0 };
  }

  onUpgradeClick(): void {
    this.subscriptionService
      .initiateUpgradePayment(undefined, environment.paymentReturnUrl)
      .subscribe({
        next: (response) => {
          if (response.checkoutUrl) {
            window.location.href = response.checkoutUrl;
          }
        },
        error: (error) => {
          console.error('Failed to initiate payment:', error);
          this.snackBar.open('Failed to initiate payment', 'Close', { duration: 4000 });
        },
      });
  }

  onCancelClick(): void {
    const dialogRef = this.dialog.open(CancelSubscriptionDialogComponent, {
      width: '400px',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((reason: string | undefined) => {
      if (reason) {
        this.subscriptionChanged.emit();
      }
    });
  }

  addModule(key: ModuleKey): void {
    this.addingModule.set(key);
    this.subscriptionService.addModule(key).subscribe({
      next: () => {
        this.snackBar.open(`${this.getModuleDef(key).label} added`, 'Close', { duration: 3000 });
        this.addingModule.set(null);
        this.subscriptionChanged.emit();
      },
      error: (err) => {
        console.error('Failed to add module:', err);
        this.snackBar.open('Failed to add module', 'Close', { duration: 4000 });
        this.addingModule.set(null);
      },
    });
  }

  removeModule(key: ModuleKey): void {
    this.removingModule.set(key);
    this.subscriptionService.removeModule(key).subscribe({
      next: () => {
        const msg = this.subscription().status === 'TRIAL'
          ? `${this.getModuleDef(key).label} removed`
          : `${this.getModuleDef(key).label} marked for removal at end of billing cycle`;
        this.snackBar.open(msg, 'Close', { duration: 4000 });
        this.removingModule.set(null);
        this.subscriptionChanged.emit();
      },
      error: (err) => {
        console.error('Failed to remove module:', err);
        this.snackBar.open('Failed to remove module', 'Close', { duration: 4000 });
        this.removingModule.set(null);
      },
    });
  }

  toggleBillingCycle(): void {
    const newCycle: BillingCycle = this.subscription().billingCycle === 'MONTHLY' ? 'YEARLY' : 'MONTHLY';
    this.changingCycle.set(true);
    this.subscriptionService.changeBillingCycle(newCycle).subscribe({
      next: () => {
        this.snackBar.open(`Billing cycle changed to ${newCycle.toLowerCase()}`, 'Close', { duration: 3000 });
        this.changingCycle.set(false);
        this.subscriptionChanged.emit();
      },
      error: (err) => {
        console.error('Failed to change billing cycle:', err);
        this.snackBar.open('Failed to change billing cycle', 'Close', { duration: 4000 });
        this.changingCycle.set(false);
      },
    });
  }
}
