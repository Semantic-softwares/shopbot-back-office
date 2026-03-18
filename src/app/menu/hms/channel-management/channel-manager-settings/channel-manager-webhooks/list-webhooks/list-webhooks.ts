import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  ViewChild,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTable } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { WebhookFormDialogComponent } from '../webhook-form/webhook-form-dialog.component';
import {
  Webhook,
  WebhookService,
} from '../../../../../../shared/services/webhook.service';
import { PageHeaderComponent } from '../../../../../../shared/components/page-header/page-header.component';
import { StoreStore } from '../../../../../../shared/stores/store.store';
import { ConfirmationDialogComponent } from '../../../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { NoRecordComponent } from '../../../../../../shared/components/no-record/no-record.component';
import { tap } from 'rxjs';

@Component({
  selector: 'app-list-webhooks',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    PageHeaderComponent,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatPaginatorModule,
    FormsModule,
    NoRecordComponent,
  ],
  templateUrl: './list-webhooks.html',
  styleUrl: './list-webhooks.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListWebhooks {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private webhookService = inject(WebhookService);
  private storeStore = inject(StoreStore);

  @ViewChild(MatTable) table!: MatTable<any>;

  searchText = '';
  displayedColumns: string[] = ['url', 'events', 'is_active', 'actions'];
  dataSource = new MatTableDataSource<any>([]);

  // Pagination state
  currentPage = signal(0);
  pageSize = signal(10);
  totalItems = signal(0);
  pageSizeOptions = [5, 10, 25, 50];

  webhooks = rxResource({
    params: () => ({
      propertyId: this.storeStore.selectedStore()?.channex?.propertyId || '',
      page: this.currentPage() + 1, // Convert 0-based to 1-based
      limit: this.pageSize(),
      search: this.searchText,
    }),
    stream: ({ params }) => {
      if (!params.propertyId) {
        throw new Error('Property ID not found');
      }
      return this.webhookService
        .getWebhooks(
          params.propertyId,
          params.page,
          params.limit,
          params.search,
        )
        .pipe(
          tap(() => {
            const response = this.webhooks.value();
            if (response?.data) {
              this.dataSource.data = response.data;
              this.totalItems.set(response.meta?.total || 0);
            }
          }),
        );
    },
  });

  constructor() {
    effect(() => {
      const response = this.webhooks.value();
      if (response?.data) {
        this.dataSource.data = response.data;
        this.totalItems.set(response.meta?.total || 0);
      }
    });
  }

  applyFilter() {
    if (this.dataSource) {
      this.currentPage.set(0); // Reset to first page on search
      this.dataSource.filter = this.searchText.trim().toLowerCase();
    }
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.webhooks.reload();
  }

  openCreateDialog(): void {
    const dialog = this.dialog.open(WebhookFormDialogComponent, {
      width: '600px',
      data: { webhook: null },
    });

    dialog.afterClosed().subscribe((result) => {
      if (result) {
        this.webhooks.reload();
        this.snackBar.open('Webhook created successfully', 'Close', {
          duration: 3000,
        });
      }
    });
  }

  openEditDialog(webhook: Webhook): void {
    const dialog = this.dialog.open(WebhookFormDialogComponent, {
      width: '600px',
      data: { webhook },
    });

    dialog.afterClosed().subscribe((result) => {
      if (result) {
        this.webhooks.reload();
        this.snackBar.open('Webhook updated successfully', 'Close', {
          duration: 3000,
        });
      }
    });
  }

  deleteWebhook(webhook: Webhook): void {
    if (!webhook.id) {
      this.snackBar.open('Invalid webhook', 'Close', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Delete Webhook',
        message: `Are you sure you want to delete the webhook "${webhook.url}"?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && webhook.id) {
        this.webhookService.deleteWebhook(webhook.id).subscribe({
          next: () => {
            this.snackBar.open('Webhook deleted successfully', 'Close', {
              duration: 3000,
            });
            this.webhooks.reload();
          },
          error: (error) => {
            const errorMessage =
              error.error?.message || 'Failed to delete webhook';
            this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
          },
        });
      }
    });
  }

  getEventNames(events: any[]): string {
    return events?.map((e) => e.title || e.id).join(', ') || 'No events';
  }

  parseEventMask(eventMask: string): string[] {
    if (!eventMask) return [];
    return eventMask
      .split(';')
      .map((e) => e.trim())
      .filter((e) => e);
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  trackByWebhookId(index: number, webhook: Webhook): string {
    return webhook.id || index.toString();
  }

  getFirstEvent(eventMask: string): string {
    if (!eventMask) return '';
    const events = eventMask
      .split(';')
      .map((e) => e.trim())
      .filter((e) => e);
    return events[0] || '';
  }

  getRemainingEventCount(eventMask: string): number {
    if (!eventMask) return 0;
    const events = eventMask
      .split(';')
      .map((e) => e.trim())
      .filter((e) => e);
    return Math.max(0, events.length - 1);
  }
}
