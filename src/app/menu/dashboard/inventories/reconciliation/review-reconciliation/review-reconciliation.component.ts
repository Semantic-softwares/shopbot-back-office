import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
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
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReconciliationService, Reconciliation, ReconciliationItem } from '../../../../../shared/services/reconciliation.service';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { AuthService } from '../../../../../shared/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-review-reconciliation',
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
    MatExpansionModule,
    RouterModule,
  ],
  template: `
    <div class="p-6 max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Review Reconciliation</h1>
          @if (reconciliation()) {
            <p class="text-gray-600 mt-1">{{ reconciliation()!.name }}</p>
          }
        </div>
        <div class="flex space-x-4">
          <button mat-button [routerLink]="['../count']" class="text-gray-600">
            <mat-icon>arrow_back</mat-icon>
            Back to Count
          </button>
          <button mat-button [routerLink]="['../..']" class="text-gray-600">
            <mat-icon>list</mat-icon>
            Back to List
          </button>
        </div>
      </div>

      @if (reconciliation()) {
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <mat-card class="p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Total Items</p>
                <p class="text-2xl font-bold text-blue-600">{{ reconciliation()!.totalProducts }}</p>
              </div>
              <mat-icon class="text-blue-500">inventory</mat-icon>
            </div>
          </mat-card>

          <mat-card class="p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Items Counted</p>
                <p class="text-2xl font-bold text-green-600">{{ reconciliation()!.countedProducts }}</p>
              </div>
              <mat-icon class="text-green-500">check_circle</mat-icon>
            </div>
          </mat-card>

          <mat-card class="p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Discrepancies</p>
                <p class="text-2xl font-bold text-orange-600">{{ reconciliation()!.discrepancyCount }}</p>
              </div>
              <mat-icon class="text-orange-500">warning</mat-icon>
            </div>
          </mat-card>

          <mat-card class="p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Value Impact</p>
                <p class="text-2xl font-bold" 
                   [class.text-red-600]="reconciliation()!.totalVarianceValue < 0"
                   [class.text-green-600]="reconciliation()!.totalVarianceValue > 0"
                   [class.text-gray-600]="reconciliation()!.totalVarianceValue === 0">
                  {{ reconciliation()!.totalVarianceValue | currency:currency():'symbol':'1.2-2' }}
                </p>
              </div>
              <mat-icon class="text-purple-500">account_balance</mat-icon>
            </div>
          </mat-card>
        </div>

        <!-- Tabs for different views -->
        <mat-tab-group [(selectedIndex)]="selectedTab" class="mb-6">
          <mat-tab label="Discrepancies Only ({{ discrepancyItems().length }})">
            <div class="pt-4">
              @if (discrepancyItems().length > 0) {
                <mat-card>
                  <div class="p-4">
                    <div class="flex justify-between items-center mb-4">
                      <h3 class="text-lg font-semibold">Items with Discrepancies</h3>
                      <div class="space-x-2">
                        <button 
                          mat-button
                          (click)="selectAllDiscrepancies()"
                          [disabled]="allDiscrepanciesSelected()"
                        >
                          Select All
                        </button>
                        <button 
                          mat-button
                          (click)="deselectAllDiscrepancies()"
                          [disabled]="!anyDiscrepanciesSelected()"
                        >
                          Deselect All
                        </button>
                        <button 
                          mat-raised-button
                          color="primary"
                          (click)="approveSelectedDiscrepancies()"
                          [disabled]="!anyDiscrepanciesSelected() || isProcessing()"
                        >
                          @if (isProcessing()) {
                            <mat-icon>refresh</mat-icon>
                          }
                          Approve Selected ({{ selectedDiscrepancyItems().length }})
                        </button>
                      </div>
                    </div>
                    
                    <div class="overflow-x-auto">
                      <table mat-table [dataSource]="discrepancyItems()" class="w-full">
                        
                        <!-- Selection Column -->
                        <ng-container matColumnDef="select">
                          <th mat-header-cell *matHeaderCellDef>
                            <mat-checkbox
                              [checked]="allDiscrepanciesSelected()"
                              [indeterminate]="someDiscrepanciesSelected()"
                              (change)="toggleAllDiscrepancies()"
                            ></mat-checkbox>
                          </th>
                          <td mat-cell *matCellDef="let item">
                            <mat-checkbox
                              [checked]="isDiscrepancySelected(item)"
                              (change)="toggleDiscrepancySelection(item)"
                            ></mat-checkbox>
                          </td>
                        </ng-container>

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

                        <!-- Quantities Column -->
                        <ng-container matColumnDef="quantities">
                          <th mat-header-cell *matHeaderCellDef class="font-semibold">System / Physical</th>
                          <td mat-cell *matCellDef="let item" class="py-4">
                            <div class="flex items-center space-x-2">
                              <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                System: {{ item.systemQuantity }}
                              </span>
                              <mat-icon class="text-gray-400">arrow_forward</mat-icon>
                              <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                                Physical: {{ item.physicalQuantity }}
                              </span>
                            </div>
                          </td>
                        </ng-container>

                        <!-- Variance Column -->
                        <ng-container matColumnDef="variance">
                          <th mat-header-cell *matHeaderCellDef class="font-semibold">Variance</th>
                          <td mat-cell *matCellDef="let item" class="py-4">
                            <div class="text-center">
                              <div 
                                [class.text-red-600]="item.variance < 0"
                                [class.text-green-600]="item.variance > 0"
                                class="font-bold text-lg"
                              >
                                {{ item.variance > 0 ? '+' : '' }}{{ item.variance }}
                              </div>
                              <div 
                                [class.text-red-600]="item.varianceValue < 0"
                                [class.text-green-600]="item.varianceValue > 0"
                                class="text-sm"
                              >
                                {{ item.varianceValue > 0 ? '+' : '' }}{{ item.varianceValue | currency:currency():'symbol':'1.2-2' }}
                              </div>
                            </div>
                          </td>
                        </ng-container>

                        <!-- Reason Column -->
                        <ng-container matColumnDef="reason">
                          <th mat-header-cell *matHeaderCellDef class="font-semibold">Reason</th>
                          <td mat-cell *matCellDef="let item" class="py-4">
                            @if (item.reason) {
                              <span class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                                {{ getReasonDisplay(item.reason) }}
                              </span>
                            } @else {
                              <span class="text-gray-400 text-sm">No reason specified</span>
                            }
                            @if (item.reasonNote) {
                              <div class="text-xs text-gray-500 mt-1">{{ item.reasonNote }}</div>
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

                        <tr mat-header-row *matHeaderRowDef="discrepancyColumns"></tr>
                        <tr mat-row *matRowDef="let row; columns: discrepancyColumns;"></tr>
                      </table>
                    </div>
                  </div>
                </mat-card>
              } @else {
                <div class="text-center py-12">
                  <mat-icon class="text-green-500 text-6xl mb-4">check_circle</mat-icon>
                  <h3 class="text-lg font-medium text-gray-900 mb-2">No Discrepancies Found</h3>
                  <p class="text-gray-500">All counted items match the system quantities</p>
                </div>
              }
            </div>
          </mat-tab>

          <mat-tab label="All Items ({{ reconciliation()!.items.length }})">
            <div class="pt-4">
              <mat-card>
                <div class="p-4">
                  <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">All Items</h3>
                    <mat-form-field appearance="outline" class="w-64">
                      <mat-label>Filter by status</mat-label>
                      <mat-select [(ngModel)]="statusFilter">
                        <mat-option value="">All</mat-option>
                        <mat-option value="pending">Pending</mat-option>
                        <mat-option value="counted">Counted</mat-option>
                        <mat-option value="approved">Approved</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                  
                  <div class="overflow-x-auto">
                    <table mat-table [dataSource]="filteredAllItems()" class="w-full">
                      
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

                      <!-- Physical Quantity Column -->
                      <ng-container matColumnDef="physicalQuantity">
                        <th mat-header-cell *matHeaderCellDef class="font-semibold">Physical Qty</th>
                        <td mat-cell *matCellDef="let item" class="py-4">
                          @if (item.physicalQuantity !== undefined) {
                            <span class="font-medium">{{ item.physicalQuantity }}</span>
                          } @else {
                            <span class="text-gray-400">Not counted</span>
                          }
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

                      <!-- Status Column -->
                      <ng-container matColumnDef="status">
                        <th mat-header-cell *matHeaderCellDef class="font-semibold">Status</th>
                        <td mat-cell *matCellDef="let item" class="py-4">
                          <span [class]="getStatusClass(item.status)" class="px-2 py-1 rounded-full text-xs font-medium">
                            {{ item.status | titlecase }}
                          </span>
                        </td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="allItemsColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: allItemsColumns;"></tr>
                    </table>
                  </div>
                </div>
              </mat-card>
            </div>
          </mat-tab>
        </mat-tab-group>

        <!-- Action Buttons -->
        <div class="flex justify-between items-center">
          <div class="text-sm text-gray-600">
            @if (reconciliation()!.discrepancyCount > 0) {
              {{ selectedDiscrepancyItems().length }} of {{ discrepancyItems().length }} discrepancies selected for approval
            } @else {
              No discrepancies to approve
            }
          </div>
          
          <div class="space-x-4">
            <button 
              mat-button
              color="primary"
              [routerLink]="['../count']"
            >
              <mat-icon>edit</mat-icon>
              Continue Counting
            </button>
            
            @if (reconciliation()!.discrepancyCount === 0 || allDiscrepanciesApproved()) {
              <button 
                mat-raised-button 
                color="primary"
                (click)="completeReconciliation()"
                [disabled]="isProcessing()"
              >
                @if (isProcessing()) {
                  <mat-icon>refresh</mat-icon>
                }
                Complete Reconciliation
              </button>
            } @else {
              <button 
                mat-raised-button 
                color="primary"
                (click)="approveSelectedDiscrepancies()"
                [disabled]="!anyDiscrepanciesSelected() || isProcessing()"
              >
                @if (isProcessing()) {
                  <mat-icon>refresh</mat-icon>
                }
                Approve Selected ({{ selectedDiscrepancyItems().length }})
              </button>
            }
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
export class ReviewReconciliationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reconciliationService = inject(ReconciliationService);
  private storeStore = inject(StoreStore);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  // Signals
  public reconciliation = signal<Reconciliation | null>(null);
  public isProcessing = signal(false);
  public selectedTab = signal(0);
  public statusFilter = signal('');
  public selectedDiscrepancyItemIds = signal<string[]>([]);

  // Computed properties
  public selectedStore = computed(() => this.storeStore.selectedStore());
  public currency = computed(() => this.selectedStore()?.currency || 'NGN');
  public currentUser = toSignal(this.authService.currentUser, { initialValue: null });

  public discrepancyItems = computed(() => {
    const rec = this.reconciliation();
    return rec ? rec.items.filter(item => item.variance !== 0 && item.physicalQuantity !== undefined) : [];
  });

  public selectedDiscrepancyItems = computed(() => {
    const selectedIds = this.selectedDiscrepancyItemIds();
    return this.discrepancyItems().filter(item => selectedIds.includes(item._id || ''));
  });

  public filteredAllItems = computed(() => {
    const rec = this.reconciliation();
    if (!rec) return [];

    let items = rec.items;
    const statusFilter = this.statusFilter();
    
    if (statusFilter) {
      items = items.filter(item => item.status === statusFilter);
    }

    return items;
  });

  public allDiscrepanciesSelected = computed(() => {
    const discrepancies = this.discrepancyItems();
    const selected = this.selectedDiscrepancyItemIds();
    return discrepancies.length > 0 && discrepancies.every(item => selected.includes(item._id || ''));
  });

  public someDiscrepanciesSelected = computed(() => {
    const selected = this.selectedDiscrepancyItemIds();
    return selected.length > 0 && !this.allDiscrepanciesSelected();
  });

  public anyDiscrepanciesSelected = computed(() => {
    return this.selectedDiscrepancyItemIds().length > 0;
  });

  public allDiscrepanciesApproved = computed(() => {
    const discrepancies = this.discrepancyItems();
    return discrepancies.every(item => item.status === 'approved');
  });

  discrepancyColumns: string[] = ['select', 'product', 'quantities', 'variance', 'reason', 'status'];
  allItemsColumns: string[] = ['product', 'systemQuantity', 'physicalQuantity', 'variance', 'status'];

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

  isDiscrepancySelected(item: ReconciliationItem): boolean {
    return this.selectedDiscrepancyItemIds().includes(item._id || '');
  }

  toggleDiscrepancySelection(item: ReconciliationItem): void {
    const itemId = item._id || '';
    const currentSelected = this.selectedDiscrepancyItemIds();
    
    if (currentSelected.includes(itemId)) {
      this.selectedDiscrepancyItemIds.set(currentSelected.filter(id => id !== itemId));
    } else {
      this.selectedDiscrepancyItemIds.set([...currentSelected, itemId]);
    }
  }

  selectAllDiscrepancies(): void {
    const allIds = this.discrepancyItems().map(item => item._id || '').filter(id => id);
    this.selectedDiscrepancyItemIds.set(allIds);
  }

  deselectAllDiscrepancies(): void {
    this.selectedDiscrepancyItemIds.set([]);
  }

  toggleAllDiscrepancies(): void {
    if (this.allDiscrepanciesSelected()) {
      this.deselectAllDiscrepancies();
    } else {
      this.selectAllDiscrepancies();
    }
  }

  approveSelectedDiscrepancies(): void {
    const selectedItems = this.selectedDiscrepancyItems();
    if (selectedItems.length === 0) return;

    const rec = this.reconciliation();
    if (!rec || !rec._id) return;

    this.isProcessing.set(true);

    const itemIds = selectedItems.map(item => item._id).filter(id => id) as string[];
    
    this.reconciliationService.approveAdjustments(rec._id, {
      itemIds,
      approvedBy: this.currentUser()?._id || ''
    }).subscribe({
      next: (updatedRec) => {
        this.reconciliation.set(updatedRec);
        this.selectedDiscrepancyItemIds.set([]);
        this.isProcessing.set(false);
        this.snackBar.open(`${selectedItems.length} discrepancies approved successfully`, 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error approving discrepancies:', error);
        this.isProcessing.set(false);
        this.snackBar.open('Error approving discrepancies', 'Close', { duration: 3000 });
      }
    });
  }

  completeReconciliation(): void {
    const rec = this.reconciliation();
    if (!rec || !rec._id) return;

    this.isProcessing.set(true);

    this.reconciliationService.complete(rec._id, {
      completedBy: this.currentUser()?._id || ''
    }).subscribe({
      next: (updatedRec) => {
        this.reconciliation.set(updatedRec);
        this.isProcessing.set(false);
        this.snackBar.open('Reconciliation completed successfully', 'Close', { duration: 3000 });
        // Navigate to reconciliation list or details
        setTimeout(() => {
          this.router.navigate(['../../'], { relativeTo: this.route });
        }, 1500);
      },
      error: (error) => {
        console.error('Error completing reconciliation:', error);
        this.isProcessing.set(false);
        this.snackBar.open('Error completing reconciliation', 'Close', { duration: 3000 });
      }
    });
  }

  getReasonDisplay(reason: string): string {
    const reasonMap: { [key: string]: string } = {
      'damage': 'Damage',
      'theft': 'Theft',
      'expiry': 'Expiry',
      'supplier_error': 'Supplier Error',
      'counting_error': 'Counting Error',
      'system_error': 'System Error',
      'other': 'Other'
    };
    return reasonMap[reason] || reason;
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
