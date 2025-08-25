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
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReconciliationService, Reconciliation, ReconciliationItem } from '../../../../shared/services/reconciliation.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { AuthService } from '../../../../shared/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-reconciliation-details',
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
    MatDividerModule,
    RouterModule,
  ],
  template: `
    <div class="p-6 max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Reconciliation Details</h1>
          @if (reconciliation()) {
            <p class="text-gray-600 mt-1">{{ reconciliation()!.name }}</p>
          }
        </div>
        <div class="flex space-x-4">
          <button mat-button [routerLink]="['../..']" class="text-gray-600">
            <mat-icon>arrow_back</mat-icon>
            Back to List
          </button>
          @if (reconciliation() && reconciliation()!.status !== 'completed') {
            <button mat-raised-button color="primary" [routerLink]="['../count']">
              <mat-icon>edit</mat-icon>
              Continue Editing
            </button>
          }
        </div>
      </div>

      @if (reconciliation()) {
        <!-- Status and Basic Info -->
        <mat-card class="mb-6">
          <mat-card-content class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 class="text-sm font-medium text-gray-500 mb-2">Status</h3>
                <span [class]="getStatusClass(reconciliation()!.status)" class="px-3 py-2 rounded-full text-sm font-medium">
                  {{ reconciliation()!.status | titlecase }}
                </span>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-500 mb-2">Type</h3>
                <span class="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium">
                  {{ getTypeDisplay(reconciliation()!.type) }}
                </span>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-500 mb-2">Created</h3>
                <p class="text-sm text-gray-900">{{ reconciliation()!.createdAt | date:'medium' }}</p>
              </div>
            </div>

            @if (reconciliation()!.description) {
              <mat-divider class="my-4"></mat-divider>
              <div>
                <h3 class="text-sm font-medium text-gray-500 mb-2">Description</h3>
                <p class="text-sm text-gray-900">{{ reconciliation()!.description }}</p>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Summary Statistics -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <mat-card class="p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Total Products</p>
                <p class="text-3xl font-bold text-blue-600">{{ reconciliation()!.totalProducts }}</p>
              </div>
              <mat-icon class="text-blue-500 text-3xl">inventory</mat-icon>
            </div>
          </mat-card>

          <mat-card class="p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Products Counted</p>
                <p class="text-3xl font-bold text-green-600">{{ reconciliation()!.countedProducts }}</p>
                <p class="text-xs text-gray-500">{{ getCompletionPercentage() }}% Complete</p>
              </div>
              <mat-icon class="text-green-500 text-3xl">check_circle</mat-icon>
            </div>
          </mat-card>

          <mat-card class="p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Discrepancies</p>
                <p class="text-3xl font-bold text-orange-600">{{ reconciliation()!.discrepancyCount }}</p>
                <p class="text-xs text-gray-500">{{ getDiscrepancyPercentage() }}% of counted items</p>
              </div>
              <mat-icon class="text-orange-500 text-3xl">warning</mat-icon>
            </div>
          </mat-card>

          <mat-card class="p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Financial Impact</p>
                <p class="text-3xl font-bold" 
                   [class.text-red-600]="reconciliation()!.totalVarianceValue < 0"
                   [class.text-green-600]="reconciliation()!.totalVarianceValue > 0"
                   [class.text-gray-600]="reconciliation()!.totalVarianceValue === 0">
                  {{ reconciliation()!.totalVarianceValue | currency:currency():'symbol':'1.2-2' }}
                </p>
                <p class="text-xs text-gray-500" 
                   [class.text-red-500]="reconciliation()!.totalVarianceValue < 0"
                   [class.text-green-500]="reconciliation()!.totalVarianceValue > 0">
                  {{ reconciliation()!.totalVarianceValue > 0 ? 'Inventory Gain' : reconciliation()!.totalVarianceValue < 0 ? 'Inventory Loss' : 'No Impact' }}
                </p>
              </div>
              <mat-icon class="text-purple-500 text-3xl">account_balance</mat-icon>
            </div>
          </mat-card>
        </div>

        <!-- Timeline -->
        @if (reconciliation()!.status === 'completed') {
          <mat-card class="mb-6">
            <mat-card-header>
              <mat-card-title>Reconciliation Timeline</mat-card-title>
            </mat-card-header>
            <mat-card-content class="p-6">
              <div class="relative">
                <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                <!-- Started -->
                <div class="relative flex items-center mb-6">
                  <div class="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <mat-icon class="text-white text-sm">play_arrow</mat-icon>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-900">Reconciliation Started</p>
                    <p class="text-xs text-gray-500">{{ reconciliation()!.startDate | date:'medium' }}</p>
                    @if (reconciliation()!.createdBy) {
                      <p class="text-xs text-gray-500">by User {{ reconciliation()!.createdBy }}</p>
                    }
                  </div>
                </div>

                <!-- Completed -->
                @if (reconciliation()!.completedDate) {
                  <div class="relative flex items-center">
                    <div class="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <mat-icon class="text-white text-sm">check</mat-icon>
                    </div>
                    <div class="ml-4">
                      <p class="text-sm font-medium text-gray-900">Reconciliation Completed</p>
                      <p class="text-xs text-gray-500">{{ reconciliation()!.completedDate | date:'medium' }}</p>
                      @if (reconciliation()!.completedBy) {
                        <p class="text-xs text-gray-500">by User {{ reconciliation()!.completedBy }}</p>
                      }
                    </div>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        }

        <!-- Items Detail -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>Items Detail</mat-card-title>
            <mat-card-subtitle>{{ reconciliation()!.items.length }} items total</mat-card-subtitle>
          </mat-card-header>
          
          <mat-tab-group class="p-4">
            <!-- All Items Tab -->
            <mat-tab label="All Items ({{ reconciliation()!.items.length }})">
              <div class="pt-4">
                <div class="flex justify-between items-center mb-4">
                  <mat-form-field appearance="outline" class="w-64">
                    <mat-label>Search products</mat-label>
                    <input matInput [(ngModel)]="searchTerm" placeholder="Product name or SKU">
                    <mat-icon matSuffix>search</mat-icon>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline" class="w-48">
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
                  <table mat-table [dataSource]="filteredItems()" class="w-full">
                    
                    <!-- Product Column -->
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
                        <div class="text-center">
                          <div 
                            [class.text-red-600]="item.variance < 0"
                            [class.text-green-600]="item.variance > 0"
                            [class.text-gray-600]="item.variance === 0"
                            class="font-medium"
                          >
                            {{ item.variance > 0 ? '+' : '' }}{{ item.variance || 0 }}
                          </div>
                          @if (item.varianceValue !== 0) {
                            <div 
                              [class.text-red-600]="item.varianceValue < 0"
                              [class.text-green-600]="item.varianceValue > 0"
                              class="text-xs"
                            >
                              {{ item.varianceValue > 0 ? '+' : '' }}{{ item.varianceValue | currency:currency():'symbol':'1.2-2' }}
                            </div>
                          }
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
                          @if (item.reasonNote) {
                            <div class="text-xs text-gray-500 mt-1">{{ item.reasonNote }}</div>
                          }
                        } @else if (item.variance !== 0) {
                          <span class="text-gray-400 text-sm">No reason specified</span>
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

                    <!-- Counted By Column -->
                    <ng-container matColumnDef="countedBy">
                      <th mat-header-cell *matHeaderCellDef class="font-semibold">Counted By</th>
                      <td mat-cell *matCellDef="let item" class="py-4">
                        @if (item.countedBy) {
                          <div>
                            <div class="text-sm">User {{ item.countedBy }}</div>
                            @if (item.countedAt) {
                              <div class="text-xs text-gray-500">{{ item.countedAt | date:'short' }}</div>
                            }
                          </div>
                        } @else {
                          <span class="text-gray-400 text-sm">-</span>
                        }
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="allItemsColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: allItemsColumns;"></tr>
                  </table>
                </div>
              </div>
            </mat-tab>

            <!-- Discrepancies Only Tab -->
            <mat-tab label="Discrepancies ({{ discrepancyItems().length }})">
              <div class="pt-4">
                @if (discrepancyItems().length > 0) {
                  <div class="overflow-x-auto">
                    <table mat-table [dataSource]="discrepancyItems()" class="w-full">
                      
                      <!-- Product Column -->
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
                        <th mat-header-cell *matHeaderCellDef class="font-semibold">System → Physical</th>
                        <td mat-cell *matCellDef="let item" class="py-4">
                          <div class="flex items-center space-x-2">
                            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                              {{ item.systemQuantity }}
                            </span>
                            <mat-icon class="text-gray-400">arrow_forward</mat-icon>
                            <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                              {{ item.physicalQuantity }}
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
                            @if (item.reasonNote) {
                              <div class="text-xs text-gray-500 mt-1">{{ item.reasonNote }}</div>
                            }
                          } @else {
                            <span class="text-gray-400 text-sm">No reason specified</span>
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
                } @else {
                  <div class="text-center py-12">
                    <mat-icon class="text-green-500 text-6xl mb-4">check_circle</mat-icon>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No Discrepancies Found</h3>
                    <p class="text-gray-500">All counted items matched the system quantities perfectly</p>
                  </div>
                }
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card>
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
export class ReconciliationDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reconciliationService = inject(ReconciliationService);
  private storeStore = inject(StoreStore);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  // Signals
  public reconciliation = signal<Reconciliation | null>(null);
  public searchTerm = signal('');
  public statusFilter = signal('');

  // Computed properties
  public selectedStore = computed(() => this.storeStore.selectedStore());
  public currency = computed(() => this.selectedStore()?.currency || 'NGN');
  public currentUser = toSignal(this.authService.currentUser, { initialValue: null });

  public discrepancyItems = computed(() => {
    const rec = this.reconciliation();
    return rec ? rec.items.filter(item => item.variance !== 0 && item.physicalQuantity !== undefined) : [];
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

    return items;
  });

  allItemsColumns: string[] = ['product', 'systemQuantity', 'physicalQuantity', 'variance', 'reason', 'status', 'countedBy'];
  discrepancyColumns: string[] = ['product', 'quantities', 'variance', 'reason', 'status'];

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

  getCompletionPercentage(): number {
    const rec = this.reconciliation();
    return rec ? Math.round((rec.countedProducts / rec.totalProducts) * 100) : 0;
  }

  getDiscrepancyPercentage(): number {
    const rec = this.reconciliation();
    if (!rec || rec.countedProducts === 0) return 0;
    return Math.round((rec.discrepancyCount / rec.countedProducts) * 100);
  }

  getTypeDisplay(type: string): string {
    const typeMap: { [key: string]: string } = {
      'full_inventory': 'Full Inventory Count',
      'partial': 'Partial Count',
      'cycle_count': 'Cycle Count'
    };
    return typeMap[type] || type;
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
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
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
