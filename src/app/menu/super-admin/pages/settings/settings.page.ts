import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { BillingSettingsV2 } from '../../../../shared/models/platform-billing.model';
import { PlatformBillingService } from '../../../../shared/services/platform-billing.service';

@Component({
  selector: 'app-admin-settings',
  imports: [FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatProgressBarModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-page-header title="Settings" i18n-title subtitle="Rules that apply to every store" i18n-subtitle />
    @if (res.isLoading() && !res.hasValue()) { <mat-progress-bar mode="indeterminate" /> }
    @if (res.error() && !res.hasValue()) {
      <div class="rounded-3xl border border-outline-variant p-8 text-center" role="alert"><p class="m-0 font-semibold" i18n>Could not load the settings.</p><button mat-flat-button class="!mt-3" (click)="res.reload()" i18n>Try again</button></div>
    } @else if (res.hasValue()) {
      <div class="grid max-w-3xl gap-4">
        <mat-card appearance="outlined"><mat-card-content class="!p-4">
          <p class="mb-5 mt-0 text-sm text-on-surface-variant" i18n>These apply to trials and renewals from now on. A trial already running keeps its end date.</p>
          <div class="grid gap-x-4 sm:grid-cols-3">
            <mat-form-field appearance="outline"><mat-label i18n>Trial length</mat-label><span matTextSuffix class="pr-3 text-sm text-on-surface-variant" i18n>days</span><input matInput type="number" min="1" max="90" [ngModel]="f().trialDays" (ngModelChange)="set('trialDays', +$event)" data-testid="set-trial" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label i18n>Grace period</mat-label><span matTextSuffix class="pr-3 text-sm text-on-surface-variant" i18n>days</span><mat-hint i18n>After a missed payment</mat-hint><input matInput type="number" min="0" max="60" [ngModel]="f().graceDays" (ngModelChange)="set('graceDays', +$event)" data-testid="set-grace" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label i18n>Invoice ahead</mat-label><span matTextSuffix class="pr-3 text-sm text-on-surface-variant" i18n>days</span><mat-hint i18n>Before each renewal</mat-hint><input matInput type="number" min="1" max="60" [ngModel]="f().invoiceLeadDays" (ngModelChange)="set('invoiceLeadDays', +$event)" data-testid="set-lead" /></mat-form-field>
          </div>
          <mat-form-field appearance="outline" class="mt-2 w-full"><mat-label i18n>Bank transfer instructions</mat-label><mat-hint i18n>Shown to customers who pay by transfer</mat-hint><textarea matInput rows="5" maxlength="2000" [ngModel]="f().bankTransferInstructions" (ngModelChange)="set('bankTransferInstructions', $event)" data-testid="set-bank"></textarea></mat-form-field>
          <button mat-flat-button color="primary" class="!mt-5" [disabled]="busy()" (click)="save()" data-testid="set-save" i18n>Save settings</button>
        </mat-card-content></mat-card>
        <mat-card appearance="outlined"><mat-card-content class="!p-4">
          <h3 class="m-0 text-sm font-semibold" i18n>Billing run</h3>
          <p class="mb-3 mt-1 text-sm text-on-surface-variant" i18n>The hourly run issues invoices, charges saved cards and locks stores that are overdue. A practice run shows what it would do without changing anything.</p>
          <button mat-stroked-button [disabled]="busy()" (click)="practice()" data-testid="sweep-dry" i18n>Practice run</button>
          @if (sweep()) { <pre class="mt-3 max-h-64 overflow-auto rounded-xl bg-surface-container p-3 text-xs" data-testid="sweep-out">{{ sweep() }}</pre> }
        </mat-card-content></mat-card>
      </div>
    }
  `,
})
export class SettingsPage {
  private readonly api = inject(PlatformBillingService);
  private readonly snack = inject(MatSnackBar);
  readonly res = rxResource({ stream: () => this.api.adminSettings() });
  readonly f = signal<BillingSettingsV2>({ trialDays: 14, graceDays: 7, invoiceLeadDays: 7, bankTransferInstructions: '' });
  readonly busy = signal(false);
  readonly sweep = signal('');
  constructor() {
    effect(() => {
      if (this.res.hasValue()) this.f.set({ ...this.res.value() });
    });
  }
  set<K extends keyof BillingSettingsV2>(k: K, v: BillingSettingsV2[K]): void {
    this.f.update((cur) => ({ ...cur, [k]: v }));
  }
  async save(): Promise<void> {
    this.busy.set(true);
    try {
      await firstValueFrom(this.api.adminUpdateSettings(this.f()));
      this.snack.open($localize`Settings saved`, $localize`Close`, { duration: 3000 });
      this.res.reload();
    } catch (e: any) {
      this.snack.open(e?.error?.message ?? $localize`That did not work. Please try again.`, $localize`Close`, { duration: 6000 });
    } finally {
      this.busy.set(false);
    }
  }
  async practice(): Promise<void> {
    this.busy.set(true);
    try {
      this.sweep.set(JSON.stringify(await firstValueFrom(this.api.adminRunSweep(true)), null, 2));
    } catch (e: any) {
      this.snack.open(e?.error?.message ?? $localize`That did not work. Please try again.`, $localize`Close`, { duration: 6000 });
    } finally {
      this.busy.set(false);
    }
  }
}
