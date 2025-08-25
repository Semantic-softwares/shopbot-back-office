import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, FormBuilder, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReconciliationService, Reconciliation, ReconciliationItem } from '../../../../shared/services/reconciliation.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { AuthService } from '../../../../shared/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-count-inventory',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatProgressBarModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTabsModule,
    MatCheckboxModule,
    MatTooltipModule,
    RouterModule,
  ],
  template: `
    <div class="p-6 max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Count Inventory</h1>
          @if (reconciliation()) {
            <p class="text-gray-600 mt-1">{{ reconciliation()!.name }}</p>
          }
        </div>
        <div class="flex space-x-4">
          <button mat-button [routerLink]="['../..']" class="text-gray-600">
            <mat-icon>arrow_back</mat-icon>
            Back to List
          </button>
          @if (reconciliation()) {
            <button 
              mat-raised-button 
              color="primary" 
              (click)="saveProgress()"
              [disabled]="isSaving()"
            >
              @if (isSaving()) {
                <mat-icon>refresh</mat-icon>
              }
              Save Progress
            </button>
          }
        </div>
      </div>

      @if (reconciliation()) {
        <!-- Progress Card -->
        <mat-card class="mb-6">
          <mat-card-content class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-600">{{ reconciliation()!.totalProducts }}</div>
                <div class="text-sm text-gray-600">Total Products</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">{{ reconciliation()!.countedProducts }}</div>
                <div class="text-sm text-gray-600">Counted</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-orange-600">{{ remainingProducts() }}</div>
                <div class="text-sm text-gray-600">Remaining</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-red-600">{{ reconciliation()!.discrepancyCount }}</div>
                <div class="text-sm text-gray-600">Discrepancies</div>
              </div>
            </div>
            <mat-progress-bar 
              [value]="progressPercentage()" 
              class="mt-4"
              color="primary">
            </mat-progress-bar>
            <div class="text-center mt-2 text-sm text-gray-600">
              {{ progressPercentage() }}% Complete
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Filter and Search -->
        <mat-card class="mb-6">
          <mat-card-content class="p-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <mat-form-field appearance="outline">
                <mat-label>Search products</mat-label>
                <input matInput [(ngModel)]="searchTerm" placeholder="Product name or SKU">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Filter by status</mat-label>
                <mat-select [(ngModel)]="statusFilter">
                  <mat-option value="">All</mat-option>
                  <mat-option value="pending">Pending</mat-option>
                  <mat-option value="counted">Counted</mat-option>
                  <mat-option value="approved">Approved</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Show discrepancies only</mat-label>
                <mat-select [(ngModel)]="discrepancyFilter">
                  <mat-option value="">All items</mat-option>
                  <mat-option value="true">Discrepancies only</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Items Table -->
        <mat-card>
          <div class="overflow-x-auto">
            <table mat-table [dataSource]="filteredItems()" class="w-full">
              
              <!-- Product Name Column -->
              <ng-container matColumnDef="product">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Product</th>
                <td mat-cell *matCellDef="let item" class="py-4">
                  <div>
                    <div class="font-medium">{{ item.productName }}</div>
                    @if (item.productSku) {
                      <div class="text-sm text-gray-500">SKU: {{ item.productSku }}</div>
                    }
                  </div>
                </td>
              </ng-container>

              <!-- System Quantity Column -->
              <ng-container matColumnDef="systemQuantity">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">System Qty</th>
                <td mat-cell *matCellDef="let item" class="py-4">
                  <span class="font-medium">{{ item.systemQuantity }}</span>
                </td>
              </ng-container>

              <!-- Physical Count Column -->
              <ng-container matColumnDef="physicalQuantity">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Physical Count</th>
                <td mat-cell *matCellDef="let item" class="py-4">
                  <mat-form-field appearance="outline" class="w-32">
                    <input 
                      matInput 
                      type="number" 
                      min="0"
                      [value]="item.physicalQuantity || ''"
                      (input)="updatePhysicalCount(item, $event)"
                      placeholder="0"
                    >
                  </mat-form-field>
                </td>
              </ng-container>

              <!-- Variance Column -->
              <ng-container matColumnDef="variance">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Variance</th>
                <td mat-cell *matCellDef="let item" class="py-4">
                  <span 
                    [class.text-red-600]="item.variance < 0"
                    [class.text-green-600]="item.variance > 0"
                    [class.text-gray-600]="item.variance === 0"
                    class="font-medium"
                  >
                    {{ item.variance || 0 }}
                  </span>
                </td>
              </ng-container>

              <!-- Variance Value Column -->
              <ng-container matColumnDef="varianceValue">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Value Impact</th>
                <td mat-cell *matCellDef="let item" class="py-4">
                  <span 
                    [class.text-red-600]="item.varianceValue < 0"
                    [class.text-green-600]="item.varianceValue > 0"
                    [class.text-gray-600]="item.varianceValue === 0"
                    class="font-medium"
                  >
                    {{ item.varianceValue || 0 | currency:currency():'symbol':'1.2-2' }}
                  </span>
                </td>
              </ng-container>

              <!-- Reason Column -->
              <ng-container matColumnDef="reason">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Reason</th>
                <td mat-cell *matCellDef="let item" class="py-4">
                  @if (item.variance !== 0 && item.physicalQuantity !== undefined) {
                    <mat-form-field appearance="outline" class="w-40">
                      <mat-select 
                        [value]="item.reason || ''"
                        (selectionChange)="updateReason(item, $event.value)"
                        placeholder="Select reason"
                      >
                        <mat-option value="damage">Damage</mat-option>
                        <mat-option value="theft">Theft</mat-option>
                        <mat-option value="expiry">Expiry</mat-option>
                        <mat-option value="supplier_error">Supplier Error</mat-option>
                        <mat-option value="counting_error">Counting Error</mat-option>
                        <mat-option value="system_error">System Error</mat-option>
                        <mat-option value="other">Other</mat-option>
                      </mat-select>
                    </mat-form-field>
                  }
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Status</th>
                <td mat-cell *matCellDef="let item" class="py-4">
                  <span [class]="getStatusClass(item.status)" class="px-2 py-1 rounded-full text-xs font-medium">
                    {{ item.status | titlecase }}
                  </span>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Actions</th>
                <td mat-cell *matCellDef="let item" class="py-4">
                  @if (item.physicalQuantity !== undefined && item.status === 'pending') {
                    <button 
                      mat-icon-button 
                      color="primary"
                      (click)="markAsCounted(item)"
                      matTooltip="Mark as counted"
                    >
                      <mat-icon>check</mat-icon>
                    </button>
                  }
                  @if (item.status === 'counted') {
                    <button 
                      mat-icon-button 
                      color="warn"
                      (click)="resetCount(item)"
                      matTooltip="Reset count"
                    >
                      <mat-icon>undo</mat-icon>
                    </button>
                  }
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>

          <!-- Empty State -->
          @if (filteredItems().length === 0) {
            <div class="text-center py-12">
              <mat-icon class="text-gray-400 text-6xl mb-4">inventory_2</mat-icon>
              <h3 class="text-lg font-medium text-gray-900 mb-2">No items found</h3>
              <p class="text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          }
        </mat-card>

        <!-- Action Buttons -->
        <div class="flex justify-between items-center mt-6">
          <div class="text-sm text-gray-600">
            {{ reconciliation()!.countedProducts }} of {{ reconciliation()!.totalProducts }} items counted
          </div>
          <div class="space-x-4">
            <button 
              mat-button
              color="primary"
              (click)="saveProgress()"
              [disabled]="isSaving()"
            >
              Save Progress
            </button>
            <button 
              mat-raised-button 
              color="primary"
              (click)="proceedToReview()"
              [disabled]="!canProceedToReview()"
            >
              Review & Complete
            </button>
          </div>
        </div>
      } @else {
        <div class="flex justify-center items-center py-12">
          <mat-progress-bar mode="indeterminate" class="w-64"></mat-progress-bar>
        </div>
      }
    </div>
  `,
  styles: [`
    .mat-mdc-form-field {
      width: 100%;
    }
    
    .mat-mdc-table {
      background: transparent;
    }
    
    .mat-mdc-row:hover {
      background-color: rgba(0, 0, 0, 0.02);
    }
  `]
})
export class CountInventoryComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reconciliationService = inject(ReconciliationService);
  private storeStore = inject(StoreStore);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  // Signals
  public reconciliation = signal<Reconciliation | null>(null);
  public isSaving = signal(false);
  public searchTerm = signal('');
  public statusFilter = signal('');
  public discrepancyFilter = signal('');

  // Computed properties
  public selectedStore = computed(() => this.storeStore.selectedStore());
  public currency = computed(() => this.selectedStore()?.currency || 'NGN');
  public currentUser = toSignal(this.authService.currentUser, { initialValue: null });

  public remainingProducts = computed(() => {
    const rec = this.reconciliation();
    return rec ? rec.totalProducts - rec.countedProducts : 0;
  });

  public progressPercentage = computed(() => {
    const rec = this.reconciliation();
    return rec ? Math.round((rec.countedProducts / rec.totalProducts) * 100) : 0;
  });

  public filteredItems = computed(() => {
    const rec = this.reconciliation();
    if (!rec) return [];

    let items = rec.items;

    // Search filter
    const searchTerm = this.searchTerm().toLowerCase();
    if (searchTerm) {
      items = items.filter(item => 
        item.productName.toLowerCase().includes(searchTerm) ||
        (item.productSku && item.productSku.toLowerCase().includes(searchTerm))
      );
    }

    // Status filter
    const statusFilter = this.statusFilter();
    if (statusFilter) {
      items = items.filter(item => item.status === statusFilter);
    }

    // Discrepancy filter
    const discrepancyFilter = this.discrepancyFilter();
    if (discrepancyFilter === 'true') {
      items = items.filter(item => item.variance !== 0);
    }

    return items;
  });

  public canProceedToReview = computed(() => {
    const rec = this.reconciliation();
    return rec && rec.countedProducts > 0;
  });

  displayedColumns: string[] = ['product', 'systemQuantity', 'physicalQuantity', 'variance', 'varianceValue', 'reason', 'status', 'actions'];

  ngOnInit(): void {
    const reconciliationId = this.route.snapshot.params['id'];
    this.loadReconciliation(reconciliationId);
  }

  loadReconciliation(id: string): void {
    this.reconciliationService.findOne(id).subscribe({
      next: (reconciliation) => {
        this.reconciliation.set(reconciliation);
      },
      error: (error) => {
        console.error('Error loading reconciliation:', error);
        this.snackBar.open('Error loading reconciliation', 'Close', { duration: 3000 });
      }
    });
  }

  updatePhysicalCount(item: ReconciliationItem, event: any): void {
    const value = parseInt(event.target.value);
    const physicalQuantity = isNaN(value) ? undefined : value;
    
    // Update the item
    item.physicalQuantity = physicalQuantity;
    item.variance = physicalQuantity !== undefined ? physicalQuantity - item.systemQuantity : 0;
    item.varianceValue = item.variance * item.unitCost;
    
    // Update reconciliation signals
    this.reconciliation.update(rec => {
      if (!rec) return rec;
      
      const updatedRec = { ...rec };
      const itemIndex = updatedRec.items.findIndex(i => i._id === item._id);
      if (itemIndex !== -1) {
        updatedRec.items[itemIndex] = { ...item };
      }
      
      // Recalculate totals
      updatedRec.countedProducts = updatedRec.items.filter(i => i.physicalQuantity !== undefined).length;
      updatedRec.discrepancyCount = updatedRec.items.filter(i => i.variance !== 0 && i.physicalQuantity !== undefined).length;
      updatedRec.totalVarianceValue = updatedRec.items.reduce((total, i) => total + (i.varianceValue || 0), 0);
      
      return updatedRec;
    });
  }

  updateReason(item: ReconciliationItem, reason: string): void {
    item.reason = reason as any;
    
    // Update the reconciliation signal
    this.reconciliation.update(rec => {
      if (!rec) return rec;
      
      const updatedRec = { ...rec };
      const itemIndex = updatedRec.items.findIndex(i => i._id === item._id);
      if (itemIndex !== -1) {
        updatedRec.items[itemIndex] = { ...item };
      }
      
      return updatedRec;
    });
  }

  markAsCounted(item: ReconciliationItem): void {
    if (item.physicalQuantity === undefined) return;
    
    item.status = 'counted';
    item.countedAt = new Date();
    item.countedBy = this.currentUser()?._id;
    
    // Update the reconciliation signal
    this.reconciliation.update(rec => {
      if (!rec) return rec;
      
      const updatedRec = { ...rec };
      const itemIndex = updatedRec.items.findIndex(i => i._id === item._id);
      if (itemIndex !== -1) {
        updatedRec.items[itemIndex] = { ...item };
      }
      
      return updatedRec;
    });

    this.snackBar.open('Item marked as counted', 'Close', { duration: 2000 });
  }

  resetCount(item: ReconciliationItem): void {
    item.physicalQuantity = undefined;
    item.variance = 0;
    item.varianceValue = 0;
    item.reason = undefined;
    item.reasonNote = undefined;
    item.status = 'pending';
    item.countedAt = undefined;
    item.countedBy = undefined;
    
    // Update reconciliation signals
    this.reconciliation.update(rec => {
      if (!rec) return rec;
      
      const updatedRec = { ...rec };
      const itemIndex = updatedRec.items.findIndex(i => i._id === item._id);
      if (itemIndex !== -1) {
        updatedRec.items[itemIndex] = { ...item };
      }
      
      // Recalculate totals
      updatedRec.countedProducts = updatedRec.items.filter(i => i.physicalQuantity !== undefined).length;
      updatedRec.discrepancyCount = updatedRec.items.filter(i => i.variance !== 0 && i.physicalQuantity !== undefined).length;
      updatedRec.totalVarianceValue = updatedRec.items.reduce((total, i) => total + (i.varianceValue || 0), 0);
      
      return updatedRec;
    });

    this.snackBar.open('Count reset', 'Close', { duration: 2000 });
  }

  saveProgress(): void {
    const rec = this.reconciliation();
    if (!rec) return;

    this.isSaving.set(true);
    
    this.reconciliationService.update(rec._id!, rec).subscribe({
      next: (updatedRec) => {
        this.reconciliation.set(updatedRec);
        this.isSaving.set(false);
        this.snackBar.open('Progress saved successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error saving progress:', error);
        this.isSaving.set(false);
        this.snackBar.open('Error saving progress', 'Close', { duration: 3000 });
      }
    });
  }

  proceedToReview(): void {
    const rec = this.reconciliation();
    if (!rec) return;

    // Save progress first, then navigate
    this.saveProgress();
    
    setTimeout(() => {
      this.router.navigate(['../review'], { relativeTo: this.route });
    }, 1000);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'counted':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
