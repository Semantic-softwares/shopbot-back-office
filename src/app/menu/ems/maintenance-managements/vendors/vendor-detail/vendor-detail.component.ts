import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { NoRecordComponent } from '../../../../../shared/components/no-record/no-record.component';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { MaintenanceVendorService } from '../../../../../shared/services/maintenance-vendor.service';
import { MaintenanceService } from '../../../../../shared/services/maintenance.service';
import { MaintenanceVendor } from '../../../../../shared/models/maintenance-vendor.model';
import {
  MaintenanceRequest,
  STATUS_LABEL,
  PRIORITY_LABEL,
} from '../../../../../shared/models/maintenance.model';

@Component({
  selector: 'app-vendor-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    PageHeaderComponent,
    NoRecordComponent,
    DatePipe,
  ],
  templateUrl: './vendor-detail.component.html',
})
export class VendorDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private storeStore = inject(StoreStore);
  private vendorService = inject(MaintenanceVendorService);
  private maintenanceService = inject(MaintenanceService);

  private vendorId = this.route.snapshot.paramMap.get('id') ?? '';

  vendorResource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id ?? '',
      id: this.vendorId,
    }),
    stream: ({ params }) => {
      if (!params.storeId || !params.id) return of(null);
      return this.vendorService.getById(params.storeId, params.id).pipe(
        catchError(() => of(null)),
      );
    },
  });

  requestsResource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id ?? '',
      vendorId: this.vendorId,
    }),
    stream: ({ params }) => {
      if (!params.storeId || !params.vendorId) return of(null);
      return this.maintenanceService.getAll(params.storeId, {
        vendorId: params.vendorId,
        page: 1,
        limit: 50,
      }).pipe(catchError(() => of(null)));
    },
  });

  vendor = computed<MaintenanceVendor | null>(() => this.vendorResource.value()?.data ?? null);
  requests = computed<MaintenanceRequest[]>(
    () => (this.requestsResource.value() as any)?.data?.items ?? [],
  );

  requestColumns = ['requestNumber', 'title', 'status', 'priority', 'createdAt'];

  getStatusLabel(status: string): string {
    return STATUS_LABEL[status as keyof typeof STATUS_LABEL] ?? status;
  }

  getPriorityLabel(priority: string): string {
    return PRIORITY_LABEL[priority as keyof typeof PRIORITY_LABEL] ?? priority;
  }

  goBack(): void {
    this.router.navigate(['/menu/ems/maintenance/vendors']);
  }

  editVendor(): void {
    this.router.navigate(['/menu/ems/maintenance/vendors', this.vendorId, 'edit']);
  }

  goToRequest(id: string): void {
    this.router.navigate(['/menu/ems/maintenance', id]);
  }
}
