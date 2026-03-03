import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

import { RateInventoryService, RatePlan } from '../../../../../shared/services/rate-inventory.service';
import { RoomsService } from '../../../../../shared/services/rooms.service';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { RatePlanDialogComponent, RatePlanDialogData } from '../rate-plan-dialog/rate-plan-dialog.component';

@Component({
  selector: 'app-rate-plans-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CurrencyPipe,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    MatDividerModule,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rate-plans-list.component.html',
})
export class RatePlansListComponent {
  private rateInventoryService = inject(RateInventoryService);
  private roomsService = inject(RoomsService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  displayedColumns: string[] = ['name', 'roomType', 'baseRate', 'dayOfWeek', 'restrictions', 'channexSync', 'status', 'actions'];

  private storeId = computed(() => this.storeStore.selectedStore()?._id);

  storeCurrency = computed(() => {
    const store = this.storeStore.selectedStore();
    return this.getCurrencyCode(store?.currencyCode || store?.currency || 'NGN');
  });

  // Load room types for the dialog
  roomTypesResource = rxResource({
    params: () => ({ storeId: this.storeId() }),
    stream: ({ params }) => {
      if (!params.storeId) return of([]);
      return this.roomsService.getRoomTypes(params.storeId);
    },
  });

  // Load rate plans
  ratePlansResource = rxResource({
    params: () => ({ storeId: this.storeId() }),
    stream: ({ params }) => {
      if (!params.storeId) return of([] as RatePlan[]);
      return this.rateInventoryService.getRatePlans(params.storeId);
    },
  });

  ratePlans = computed(() => this.ratePlansResource.value() || []);

  stats = computed(() => {
    const plans = this.ratePlans();
    return {
      total: plans.length,
      active: plans.filter(p => p.active).length,
      defaults: plans.filter(p => p.isDefault).length,
      roomTypesCovered: new Set(plans.map(p => (typeof p.roomType === 'object' ? p.roomType?._id : p.roomType))).size,
    };
  });

  openCreateDialog(): void {
    const storeId = this.storeId();
    if (!storeId) return;

    const dialogData: RatePlanDialogData = {
      storeId,
      roomTypes: this.roomTypesResource.value() || [],
      storeCurrency: this.storeCurrency(),
    };

    this.dialog
      .open(RatePlanDialogComponent, { data: dialogData, width: '700px', disableClose: true })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.ratePlansResource.reload();
      });
  }

  openEditDialog(ratePlan: RatePlan): void {
    const storeId = this.storeId();
    if (!storeId) return;

    const dialogData: RatePlanDialogData = {
      storeId,
      roomTypes: this.roomTypesResource.value() || [],
      ratePlan,
      storeCurrency: this.storeCurrency(),
    };

    this.dialog
      .open(RatePlanDialogComponent, { data: dialogData, width: '700px', disableClose: true })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.ratePlansResource.reload();
      });
  }

  deleteRatePlan(ratePlan: RatePlan): void {
    if (!confirm(`Delete rate plan "${ratePlan.name}"? This will also remove all associated inventory records.`)) {
      return;
    }

    this.rateInventoryService.deleteRatePlan(ratePlan._id).subscribe({
      next: () => {
        this.snackBar.open('Rate plan deleted', 'Close', { duration: 3000 });
        this.ratePlansResource.reload();
      },
      error: () => {
        this.snackBar.open('Failed to delete rate plan', 'Close', { duration: 5000 });
      },
    });
  }

  generateInventory(ratePlan: RatePlan): void {
    const storeId = this.storeId();
    if (!storeId) return;

    // Generate for the next 90 days by default
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 90);

    this.rateInventoryService
      .generateFromRatePlan(
        storeId,
        ratePlan._id,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
      )
      .subscribe({
        next: (result) => {
          this.snackBar.open(
            `Generated ${result.upsertedCount + result.modifiedCount} inventory records for the next 90 days`,
            'Close',
            { duration: 5000 },
          );
        },
        error: () => {
          this.snackBar.open('Failed to generate inventory', 'Close', { duration: 5000 });
        },
      });
  }

  syncingPlanId = signal<string | null>(null);

  syncRatePlanToChannex(ratePlan: RatePlan): void {
    const storeId = this.storeId();
    if (!storeId) return;

    this.syncingPlanId.set(ratePlan._id);

    this.rateInventoryService.syncRatePlanToChannex(storeId, ratePlan._id).subscribe({
      next: (updated: RatePlan) => {
        this.syncingPlanId.set(null);
        this.snackBar.open(
          `Rate plan "${ratePlan.name}" synced to Channex successfully`,
          'Close',
          { duration: 5000 },
        );
        this.ratePlansResource.reload();
      },
      error: (err: any) => {
        this.syncingPlanId.set(null);
        const msg = err.error?.message || err.message || 'Sync failed';
        this.snackBar.open(`Channex sync failed: ${msg}`, 'Close', { duration: 6000 });
      },
    });
  }

  getRoomTypeName(ratePlan: RatePlan): string {
    if (typeof ratePlan.roomType === 'object' && ratePlan.roomType?.name) {
      return ratePlan.roomType.name;
    }
    return 'Unknown';
  }

  getDayOverrides(ratePlan: RatePlan): string[] {
    const overrides: string[] = [];
    const dayLabels: Record<string, string> = {
      monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
      friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
    };

    if (ratePlan.dayOfWeekRates) {
      for (const [key, label] of Object.entries(dayLabels)) {
        const rate = (ratePlan.dayOfWeekRates as any)[key];
        if (rate !== null && rate !== undefined) {
          overrides.push(`${label}: ${rate}`);
        }
      }
    }
    return overrides;
  }

  private getCurrencyCode(symbol: string): string {
    const map: Record<string, string> = {
      '₦': 'NGN', '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY',
      '₹': 'INR', '₽': 'RUB', '₩': 'KRW', '₱': 'PHP', '฿': 'THB',
    };
    return map[symbol] || symbol;
  }
}
