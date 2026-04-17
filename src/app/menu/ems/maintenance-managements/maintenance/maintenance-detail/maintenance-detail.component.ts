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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { NoRecordComponent } from '../../../../../shared/components/no-record/no-record.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AssignVendorDialogComponent } from '../../../../../shared/components/assign-vendor-dialog/assign-vendor-dialog.component';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { MaintenanceService } from '../../../../../shared/services/maintenance.service';
import {
  MaintenanceRequestDetail,
  MaintenanceRequest,
  ACTIVITY_ICON,
  MaintenanceActivityType,
  MaintenanceAssigneeType,
  MaintenancePriority,
  MaintenanceStatus,
  PRIORITY_COLOR,
  PRIORITY_LABEL,
  STATUS_COLOR,
  STATUS_LABEL,
  STATUS_TRANSITIONS,
  MaintenanceUserRef,
  MaintenanceTenantRef,
  MaintenanceVendorRef,
} from '../../../../../shared/models/maintenance.model';

@Component({
  selector: 'app-maintenance-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    NoRecordComponent,
    DatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './maintenance-detail.component.html',
})
export class MaintenanceDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly maintenanceService = inject(MaintenanceService);
  private readonly storeStore = inject(StoreStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  private readonly requestId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly newComment = signal<string>('');
  readonly selectedStatus = signal<MaintenanceStatus | null>(null);
  readonly statusNote = signal<string>('');
  readonly assigneeType = signal<MaintenanceAssigneeType>(MaintenanceAssigneeType.STAFF);
  readonly assigneeId = signal<string>('');
  readonly assignNote = signal<string>('');
  readonly estimatedCost = signal<number | null>(null);
  readonly actualCost = signal<number | null>(null);
  readonly costNote = signal<string>('');
  readonly detailLoadError = signal<string>('');
  readonly updatingStatus = signal<boolean>(false);

  readonly detailResource = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id ?? '',
      id: this.requestId,
    }),
    stream: ({ params }) => {
      if (!params.storeId || !params.id) {
        return of({
          success: true,
          message: 'Maintenance request not ready',
          data: {
            request: undefined,
            activities: [],
          } as unknown as MaintenanceRequestDetail,
        });
      }

      return this.maintenanceService.getById(params.storeId, params.id).pipe(
        catchError((error) => {
          const message = error?.error?.message || 'Failed to load maintenance request';
          this.detailLoadError.set(message);
          return of({
            success: true,
            message,
            data: {
              request: undefined,
              activities: [],
            } as unknown as MaintenanceRequestDetail,
          });
        }),
      );
    },
  });

  readonly detail = computed(() => this.detailResource.value()?.data);
  readonly request = computed(() => this.detail()?.request);
  readonly activities = computed(() => this.detail()?.activities ?? []);
  readonly currencyCode = computed(() => this.storeStore.selectedStore()?.currencyCode || 'NGN');

  readonly availableStatusTransitions = computed<MaintenanceStatus[]>(() => {
    const status = this.request()?.status;
    if (!status) return [];
    return STATUS_TRANSITIONS[status] ?? [];
  });

  getStatusLabel(status: MaintenanceStatus): string {
    return STATUS_LABEL[status];
  }

  getStatusClass(status: MaintenanceStatus): string {
    return STATUS_COLOR[status];
  }

  getPriorityLabel(priority: MaintenancePriority): string {
    return PRIORITY_LABEL[priority];
  }

  getPriorityClass(priority: MaintenancePriority): string {
    return PRIORITY_COLOR[priority];
  }

  getCategoryLabel(category: string): string {
    return category ?? '-';
  }

  getActivityIcon(type: MaintenanceActivityType): string {
    return ACTIVITY_ICON[type] ?? 'history';
  }

  getUserName(ref: MaintenanceUserRef | string | null | undefined): string {
    if (!ref) return '-';
    if (typeof ref === 'string') return ref;
    return ref.name ?? ref.email ?? ref._id;
  }

  getTenantName(ref: MaintenanceTenantRef | string | null | undefined): string {
    if (!ref) return '-';
    if (typeof ref === 'string') return ref;
    return `${ref.firstName} ${ref.middleName || ''} ${ref.lastName}`.replace(/\s+/g, ' ').trim();
  }

  getVendorName(ref: MaintenanceVendorRef | string | null | undefined): string {
    if (!ref) return '-';
    if (typeof ref === 'string') return ref;
    return ref.name ?? ref.email ?? ref._id;
  }

  backToList(): void {
    this.router.navigate(['/menu/ems/maintenance']);
  }

  editRequest(): void {
    if (!this.requestId) return;
    this.router.navigate(['/menu/ems/maintenance/maintenances', this.requestId, 'edit']);
  }

  viewInvoice(): void {
    const invoiceId = this.request()?.expenseInvoiceId;
    if (!invoiceId) return;
    this.router.navigate(['/menu/ems/accounting/invoices', invoiceId]);
  }

  addComment(): void {
    const comment = this.newComment().trim();
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId || !this.requestId || !comment) return;

    this.maintenanceService
      .addComment(storeId, this.requestId, { comment })
      .subscribe({
        next: () => {
          this.newComment.set('');
          this.detailResource.reload();
          this.snackBar.open('Comment added', 'Close', { duration: 3000 });
        },
        error: (error) => {
          const message = error?.error?.message || 'Failed to add comment';
          this.snackBar.open(message, 'Close', { duration: 4000 });
        },
      });
  }

  changeStatus(): void {
    const status = this.selectedStatus();
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId || !this.requestId || !status) return;

    this.updatingStatus.set(true);
    this.maintenanceService
      .updateStatus(storeId, this.requestId, {
        status,
        note: this.statusNote().trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.selectedStatus.set(null);
          this.statusNote.set('');
          this.updatingStatus.set(false);
          this.detailResource.reload();
          this.snackBar.open('Status updated', 'Close', { duration: 3000 });
        },
        error: (error) => {
          this.updatingStatus.set(false);
          const message = error?.error?.message || 'Failed to update status';
          this.snackBar.open(message, 'Close', { duration: 4000 });
        },
      });
  }

  assignRequest(): void {
    const assigneeId = this.assigneeId().trim();
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId || !this.requestId || !assigneeId) return;

    this.maintenanceService
      .assign(storeId, this.requestId, {
        assigneeType: this.assigneeType(),
        assigneeId,
        note: this.assignNote().trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.assignNote.set('');
          this.detailResource.reload();
          this.snackBar.open('Request assigned', 'Close', { duration: 3000 });
        },
        error: (error) => {
          const message = error?.error?.message || 'Failed to assign request';
          this.snackBar.open(message, 'Close', { duration: 4000 });
        },
      });
  }

  updateCost(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId || !this.requestId) return;

    this.maintenanceService
      .updateCost(storeId, this.requestId, {
        estimatedCost: this.estimatedCost() ?? undefined,
        actualCost: this.actualCost() ?? undefined,
        note: this.costNote().trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.costNote.set('');
          this.detailResource.reload();
          this.snackBar.open('Cost updated', 'Close', { duration: 3000 });
        },
        error: (error) => {
          const message = error?.error?.message || 'Failed to update cost';
          this.snackBar.open(message, 'Close', { duration: 4000 });
        },
      });
  }

  onDelete(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId || !this.requestId) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Maintenance Request',
        message: 'Are you sure you want to delete this maintenance request? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.maintenanceService.delete(storeId, this.requestId).subscribe({
        next: () => {
          this.snackBar.open('Maintenance request deleted', 'Close', { duration: 3000 });
          this.backToList();
        },
        error: (error) => {
          const message = error?.error?.message || 'Failed to delete maintenance request';
          this.snackBar.open(message, 'Close', { duration: 4000 });
        },
      });
    });
  }

  assignVendor(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    const request = this.request();
    if (!storeId || !request) return;

    const dialogRef = this.dialog.open(AssignVendorDialogComponent, {
      width: '520px',
      data: {
        storeId,
        requestId: request._id,
        currentVendorId: request.vendorId ?? undefined,
        requestTitle: request.title,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.detailResource.reload();
      }
    });
  }
}
