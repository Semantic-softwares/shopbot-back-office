import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ConnectivityService } from '../../offline/connectivity.service';
import { OfflineStore } from '../../offline/offline-store.service';
import { OutboxSyncService } from '../../offline/outbox-sync.service';

/**
 * The toolbar's connection light: a green dot while online; when the server cannot be reached, or sales are waiting to be
 * sent, it says so and lets the person send them now or open the list of unsynced receipts.
 */
@Component({
  selector: 'app-sync-status',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (net.offline() || offline.waiting() || offline.failed()) {
      <button matButton="tonal" class="!h-9 !px-3" [matMenuTriggerFor]="menu" [class]="tone()" aria-live="polite" data-testid="sync-status">
        <mat-icon [class.animate-spin]="outbox.draining()">{{ net.offline() ? 'cloud_off' : offline.failed() ? 'error' : 'sync' }}</mat-icon>
        <span class="max-sm:hidden">
          @if (offline.failed()) { <ng-container i18n>{{ offline.failed() }} need attention</ng-container> }
          @else if (offline.waiting()) { <ng-container i18n>{{ offline.waiting() }} waiting to sync</ng-container> }
          @else { <ng-container i18n>Offline</ng-container> }
        </span>
      </button>
      <mat-menu #menu="matMenu">
        <div class="max-w-64 px-4 py-2 text-sm text-on-surface-variant">
          @if (net.offline()) { <ng-container i18n>No connection. Sales are saved on this device and sent when you are back online.</ng-container> }
          @else if (outbox.needsSignIn()) { <ng-container i18n>Sign in again to send the saved sales.</ng-container> }
          @else if (offline.waiting()) { <ng-container i18n>Saved sales are being sent to the server.</ng-container> }
          @else { <ng-container i18n>Some sales could not be sent. Open them to retry or discard.</ng-container> }
        </div>
        <button mat-menu-item (click)="outbox.syncNow()" [disabled]="net.offline() || outbox.draining()"><mat-icon>sync</mat-icon><span><ng-container i18n>Sync now</ng-container></span></button>
        <button mat-menu-item (click)="openReceipts()"><mat-icon>receipt_long</mat-icon><span><ng-container i18n>View unsynced receipts</ng-container></span></button>
      </mat-menu>
    } @else {
      <!-- Everything is fine: a quiet green light, so the cashier always knows the connection is there. -->
      <span class="inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm text-on-surface-variant" data-testid="sync-status" role="status">
        <span class="h-2.5 w-2.5 rounded-full bg-green-500" aria-hidden="true"></span>
        <span class="max-sm:hidden"><ng-container i18n>Online</ng-container></span>
        <span class="sm:hidden sr-only"><ng-container i18n>Online</ng-container></span>
      </span>
    }`,
})
export class SyncStatusComponent {
  readonly net = inject(ConnectivityService);
  readonly offline = inject(OfflineStore);
  readonly outbox = inject(OutboxSyncService);
  private readonly router = inject(Router);

  tone(): string {
    return this.offline.failed() ? '!bg-red-100 !text-red-900' : '!bg-amber-100 !text-amber-900';
  }

  openReceipts(): void {
    this.router.navigate(['/menu/erp/reports/receipts/list']);
  }
}
