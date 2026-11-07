import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StoreStore } from '../../stores/store.store';
import { OfflineStore } from '../../offline/offline-store.service';
import { cachedFetch } from '../../offline/cached-fetch';
import { ConnectivityService } from '../../offline/connectivity.service';
import { RegisterContextService } from '../register-context.service';
import { RegisterApiService } from '../register-api.service';
import { buildReportHtml } from '../register-report-print';
import { RegisterReport } from '../register.models';
import { RegisterReportComponent } from './register-report.component';

export interface RegisterReportDialogData {
  sessionId: string;
  kind: 'X' | 'Z';
  /** A report already in hand (e.g. the one a close just produced); otherwise it is fetched. */
  report?: RegisterReport;
}

/** Shows an X-report (taken now, changes nothing) or a stored Z-report, with a print button that also works offline. */
@Component({
  selector: 'app-register-report-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, RegisterReportComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title class="!pb-1">
      @if (data.kind === 'Z') { <ng-container i18n>Z-report</ng-container> } @else { <ng-container i18n>X-report</ng-container> }
    </h2>
    <mat-dialog-content class="!pt-2">
      @if (loading()) {
        <div class="flex justify-center py-10"><mat-spinner diameter="36"></mat-spinner></div>
      } @else if (error()) {
        <p class="py-6 text-center text-on-surface-variant" data-testid="report-error">{{ error() }}</p>
      } @else {
        @if (net.offline()) {
          <div class="mb-3 flex items-start gap-2 rounded-lg bg-surface-container px-3 py-2 text-sm" data-testid="report-offline">
            <mat-icon class="!h-5 !w-5 !text-xl !leading-none text-on-surface-variant">cloud_off</mat-icon>
            <span>
              <ng-container i18n>You are offline: this is the last copy saved on this device.</ng-container>
              @if (waiting() > 0) { <ng-container i18n>{{ waiting() }} records are waiting to be sent and are not in it.</ng-container> }
            </span>
          </div>
        }
        <app-register-report [report]="report()" />
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="!px-6 !pb-4">
      <button matButton (click)="dialogRef.close()"><ng-container i18n>Close</ng-container></button>
      <button matButton="filled" color="primary" [disabled]="!report()" (click)="print()" data-testid="report-print">
        <mat-icon>print</mat-icon><ng-container i18n>Print</ng-container>
      </button>
    </mat-dialog-actions>
  `,
})
export class RegisterReportDialogComponent implements OnInit {
  readonly data = inject<RegisterReportDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<RegisterReportDialogComponent>);
  private readonly api = inject(RegisterApiService);
  private readonly storeStore = inject(StoreStore);
  private readonly snack = inject(MatSnackBar);
  private readonly offlineStore = inject(OfflineStore);
  private readonly ctx = inject(RegisterContextService);
  readonly net = inject(ConnectivityService);
  /** Sales, movements and a close made on this device that the server does not have yet. */
  readonly waiting = () => this.ctx.pendingFor(this.data.sessionId);

  loading = signal(true);
  error = signal<string | null>(null);
  report = signal<RegisterReport | null>(null);

  ngOnInit(): void {
    if (this.data.report) {
      this.report.set(this.data.report);
      this.loading.set(false);
      return;
    }
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;
    // Kept on the device, so the last report can still be opened with no connection.
    const request = cachedFetch(this.offlineStore, `register-${this.data.kind}report:${this.data.sessionId}`, this.data.kind === 'Z' ? this.api.zReport(storeId, this.data.sessionId) : this.api.xReport(storeId, this.data.sessionId));
    request.subscribe({
      next: (r) => {
        this.report.set(r);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.status ? (err.error?.message ?? $localize`Could not load the report.`) : $localize`Could not reach the server. Open the report again when you are back online.`);
      },
    });
  }

  print(): void {
    const r = this.report();
    if (!r) return;
    const store = this.storeStore.selectedStore();
    const html = buildReportHtml({ ...r, store: { ...r.store, name: r.store?.name ?? store?.name } }, { symbol: store?.currency || '', exponent: r.session?.exponent ?? 2 });
    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) {
      this.snack.open($localize`Allow pop-ups to print the report.`, $localize`Close`, { duration: 4000 });
      return;
    }
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 400);
  }
}
