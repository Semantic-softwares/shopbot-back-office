import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EstateInvoiceService } from '../../services/estate-invoice.service';
import { EstatePaymentService } from '../../services/estate-payment.service';
import {
  MarkInvoicePaidDialogComponent,
  MarkInvoicePaidDialogResult,
} from '../mark-invoice-paid-dialog/mark-invoice-paid-dialog.component';
import { EstateInvoice, InvoiceStatus } from '../../models/estate.model';

@Component({
  selector: 'app-invoice-actions-menu',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invoice-actions-menu.component.html',
  styleUrl: './invoice-actions-menu.component.scss',
})
export class InvoiceActionsMenuComponent {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly invoiceService = inject(EstateInvoiceService);
  private readonly paymentService = inject(EstatePaymentService);

  invoice = input.required<EstateInvoice>();
  /** 'icon' = icon-only button (for table rows); 'button' = labelled stroked button (for page headers) */
  variant = input<'icon' | 'button'>('icon');

  actionCompleted = output<'paid' | 'voided' | 'unvoided' | 'deleted'>();

  readonly canMarkAsPaid = computed(() => {
    const inv = this.invoice();
    return (
      inv.status !== InvoiceStatus.VOID &&
      inv.status !== InvoiceStatus.PAID &&
      inv.balance > 0
    );
  });

  readonly canVoid = computed(() => {
    const inv = this.invoice();
    return inv.status !== InvoiceStatus.VOID && (inv.amountPaid ?? 0) <= 0;
  });

  readonly canUnvoid = computed(
    () => this.invoice().status === InvoiceStatus.VOID,
  );

  readonly canDelete = computed(
    () => this.invoice().status === InvoiceStatus.VOID,
  );

  openMarkAsPaid(): void {
    const inv = this.invoice();
    const dialogRef = this.dialog.open(MarkInvoicePaidDialogComponent, {
      width: '720px',
      maxWidth: '95vw',
      data: { invoice: inv },
    });

    dialogRef
      .afterClosed()
      .subscribe((result?: MarkInvoicePaidDialogResult) => {
        if (!result) return;

        const tenantId =
          typeof inv.tenantId === 'string' ? inv.tenantId : inv.tenantId?._id;

        this.paymentService
          .createPayment({
            leaseId:
              typeof inv.leaseId === 'string' ? inv.leaseId : inv.leaseId._id,
            tenantId: tenantId || undefined,
            totalAmount: result.amount,
            paymentDate: result.paymentDate,
            paymentMethod: result.paymentMethod,
            note: result.note,
            allocations: [
              { invoiceId: inv._id, allocatedAmount: result.amount },
            ],
          })
          .subscribe({
            next: () => {
              this.snackBar.open(
                'Payment recorded and applied to invoice',
                'Close',
                { duration: 3500 },
              );
              this.actionCompleted.emit('paid');
            },
            error: (err: { error?: { message?: string } }) => {
              this.snackBar.open(
                err?.error?.message || 'Failed to record payment',
                'Close',
                { duration: 5000 },
              );
            },
          });
      });
  }

  voidInvoice(): void {
    this.invoiceService.voidInvoice(this.invoice()._id).subscribe({
      next: () => {
        this.snackBar.open('Invoice voided successfully', 'Close', {
          duration: 3000,
        });
        this.actionCompleted.emit('voided');
      },
      error: (err: { error?: { message?: string } }) => {
        this.snackBar.open(
          err?.error?.message || 'Failed to void invoice',
          'Close',
          { duration: 5000 },
        );
      },
    });
  }

  unvoidInvoice(): void {
    this.invoiceService.unvoidInvoice(this.invoice()._id).subscribe({
      next: () => {
        this.snackBar.open('Invoice restored successfully', 'Close', {
          duration: 3000,
        });
        this.actionCompleted.emit('unvoided');
      },
      error: (err: { error?: { message?: string } }) => {
        this.snackBar.open(
          err?.error?.message || 'Failed to restore invoice',
          'Close',
          { duration: 5000 },
        );
      },
    });
  }

  deleteInvoice(): void {
    const confirmed = window.confirm(
      'Delete this void invoice? This action cannot be undone.',
    );
    if (!confirmed) return;

    this.invoiceService.deleteInvoice(this.invoice()._id).subscribe({
      next: () => {
        this.snackBar.open('Invoice deleted', 'Close', { duration: 3000 });
        this.actionCompleted.emit('deleted');
      },
      error: (err: { error?: { message?: string } }) => {
        this.snackBar.open(
          err?.error?.message || 'Failed to delete invoice',
          'Close',
          { duration: 5000 },
        );
      },
    });
  }
}
