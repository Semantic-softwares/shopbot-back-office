import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, firstValueFrom } from 'rxjs';
import { StatusPillComponent } from '../../../../shared/components/status-pill/status-pill.component';
import { PlatformBillingService } from '../../../../shared/services/platform-billing.service';
import { ReasonDialogComponent, RecordPaymentDialogComponent } from '../../dialogs/admin-dialogs';

@Component({
  selector: 'app-admin-invoice-detail',
  imports: [CurrencyPipe, DatePipe, RouterLink, MatButtonModule, MatCardModule, MatIconModule, MatProgressBarModule, StatusPillComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <a mat-button routerLink="../" class="!-ml-2 mb-2"><mat-icon>arrow_back</mat-icon><span i18n>All invoices</span></a>
    @if (res.isLoading() && !res.hasValue()) { <mat-progress-bar mode="indeterminate" /> }
    @if (res.error() && !res.hasValue()) {
      <div class="rounded-3xl border border-outline-variant p-8 text-center" role="alert"><p class="m-0 font-semibold" i18n>Could not load this invoice.</p><button mat-flat-button class="!mt-3" (click)="res.reload()" i18n>Try again</button></div>
    } @else if (res.hasValue()) {
      @let d = res.value();
      @let i = d.invoice;
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <h1 class="m-0 text-2xl font-bold" data-testid="inv-number">{{ i.invoiceNumber }}</h1><app-status-pill kind="invoice" [value]="i.status" />
        <span class="flex-1"></span>
        <button mat-stroked-button [disabled]="busy()" (click)="pdf()" data-testid="inv-pdf"><mat-icon>picture_as_pdf</mat-icon><span i18n>PDF</span></button>
        @if (i.status === 'PENDING') {
          <button mat-flat-button color="primary" [disabled]="busy()" (click)="recordPayment()" data-testid="inv-pay"><mat-icon>payments</mat-icon><span i18n>Record payment</span></button>
          <button mat-stroked-button [disabled]="busy()" (click)="writeOff()" data-testid="inv-writeoff" i18n>Write off</button>
          <button mat-stroked-button color="warn" [disabled]="busy()" (click)="voidIt()" data-testid="inv-void" i18n>Void</button>
        }
      </div>
      <div class="grid gap-4 lg:grid-cols-3">
        <mat-card appearance="outlined" class="lg:col-span-2"><mat-card-content class="!p-5">
          <div class="flex flex-wrap justify-between gap-4 text-sm">
            <div><div class="text-xs uppercase text-on-surface-variant" i18n>Billed to</div>@if (d.store) { <a [routerLink]="['../../stores', d.store._id]" class="font-semibold text-primary">{{ d.store.name }}</a> }</div>
            <div><div class="text-xs uppercase text-on-surface-variant" i18n>Issued</div>{{ (i.issuedAt ?? i.billingDate) | date: 'mediumDate' : 'UTC' }}</div>
            <div><div class="text-xs uppercase text-on-surface-variant" i18n>Due</div>{{ i.dueDate | date: 'mediumDate' : 'UTC' }}</div>
            @if (i.billingPeriodStart) { <div><div class="text-xs uppercase text-on-surface-variant" i18n>Period</div>{{ i.billingPeriodStart | date: 'mediumDate' : 'UTC' }} – {{ i.billingPeriodEnd | date: 'mediumDate' : 'UTC' }}</div> }
          </div>
          <table class="mt-5 w-full text-sm"><thead class="text-left text-xs uppercase text-on-surface-variant"><tr><th class="py-2" i18n>Description</th><th class="py-2 text-right" i18n>Qty</th><th class="py-2 text-right" i18n>Amount</th></tr></thead>
            <tbody>@for (l of i.lineItems ?? []; track $index) { <tr class="border-t border-outline-variant"><td class="py-2 capitalize">{{ l.description }}</td><td class="py-2 text-right tabular-nums">{{ l.quantity }}</td><td class="py-2 text-right tabular-nums">{{ l.amount | currency: i.currency }}</td></tr> }
              @empty { <tr class="border-t border-outline-variant"><td class="py-2 capitalize">{{ i.description || 'Subscription' }}</td><td class="py-2 text-right">1</td><td class="py-2 text-right tabular-nums">{{ i.total ?? i.amount | currency: i.currency }}</td></tr> }</tbody></table>
          <div class="mt-4 ml-auto w-full max-w-xs text-sm">
            <div class="flex justify-between py-1"><span i18n>Total</span><b class="tabular-nums">{{ i.total ?? i.amount | currency: i.currency }}</b></div>
            <div class="flex justify-between py-1"><span i18n>Paid</span><span class="tabular-nums">{{ i.amountPaid ?? 0 | currency: i.currency }}</span></div>
            <div class="flex justify-between border-t border-outline-variant py-1 font-semibold"><span i18n>Amount due</span><span class="tabular-nums" data-testid="inv-due">{{ i.amountDue ?? 0 | currency: i.currency }}</span></div>
          </div>
        </mat-card-content></mat-card>
        <mat-card appearance="outlined"><mat-card-content class="!p-4">
          <h3 class="m-0 mb-2 text-sm font-semibold" i18n>Payments</h3>
          @for (p of d.payments; track p._id) { <div class="border-t border-outline-variant py-2 text-sm first:border-t-0"><div class="flex justify-between"><b class="tabular-nums">{{ p.amount | currency: p.currency }}</b><span class="text-xs text-on-surface-variant">{{ p.receivedAt | date: 'mediumDate' }}</span></div><div class="text-xs text-on-surface-variant">{{ p.providerKey === 'paystack' ? 'Card (Paystack)' : p.providerKey === 'cash' ? 'Cash' : 'Bank transfer' }}@if (p.reference) { · {{ p.reference }} }</div>@if (p.notes) { <div class="text-xs">{{ p.notes }}</div> }</div> }
          @empty { <p class="m-0 text-sm text-on-surface-variant" i18n>No payments yet.</p> }
        </mat-card-content></mat-card>
      </div>
    }
  `,
})
export class InvoiceDetailPage {
  private readonly api = inject(PlatformBillingService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  readonly id = inject(ActivatedRoute).snapshot.paramMap.get('invoiceId')!;
  readonly res = rxResource({ stream: () => this.api.adminInvoice(this.id) });
  readonly busy = signal(false);

  private async act(call: Observable<unknown>, done: string): Promise<void> {
    this.busy.set(true);
    try {
      await firstValueFrom(call);
      this.snack.open(done, $localize`Close`, { duration: 3500 });
      this.res.reload();
    } catch (e: any) {
      this.snack.open(e?.error?.message ?? $localize`That did not work. Please try again.`, $localize`Close`, { duration: 6000 });
    } finally {
      this.busy.set(false);
    }
  }
  async recordPayment(): Promise<void> {
    const i = this.res.value()!.invoice;
    const sub = this.res.value()!.store;
    const result = await firstValueFrom(this.dialog.open(RecordPaymentDialogComponent, { data: { number: i.invoiceNumber, amountDue: i.amountDue ?? 0, currency: i.currency, canExtend: i.kind !== 'PRORATION' && !!sub }, width: '480px', maxWidth: '92vw' }).afterClosed());
    if (result) await this.act(this.api.adminRecordPayment(this.id, result), $localize`Payment recorded`);
  }
  async voidIt(): Promise<void> {
    const r = await firstValueFrom(this.dialog.open(ReasonDialogComponent, { data: { title: $localize`Void this invoice?`, message: $localize`The invoice is cancelled and can no longer be paid. This cannot be undone.`, confirm: $localize`Void invoice`, warn: true, requireReason: true }, width: '440px', maxWidth: '92vw' }).afterClosed());
    if (r) await this.act(this.api.adminVoidInvoice(this.id, typeof r === 'string' ? r : undefined), $localize`Invoice voided`);
  }
  async writeOff(): Promise<void> {
    const r = await firstValueFrom(this.dialog.open(ReasonDialogComponent, { data: { title: $localize`Write this invoice off?`, message: $localize`The balance is given up as uncollectible. The invoice stays on record.`, confirm: $localize`Write off`, warn: true, requireReason: true }, width: '440px', maxWidth: '92vw' }).afterClosed());
    if (r) await this.act(this.api.adminWriteOff(this.id, typeof r === 'string' ? r : undefined), $localize`Invoice written off`);
  }
  async pdf(): Promise<void> {
    this.busy.set(true);
    try {
      const blob = await firstValueFrom(this.api.adminInvoicePdf(this.id));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.res.value()!.invoice.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      this.snack.open($localize`Could not make the PDF. Please try again.`, $localize`Close`, { duration: 5000 });
    } finally {
      this.busy.set(false);
    }
  }
}
