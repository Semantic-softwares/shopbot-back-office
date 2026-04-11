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
import { RolesService } from '../../services/roles.service';
import { StoreStore } from '../../stores/store.store';
import {
  MarkInvoicePaidDialogComponent,
  MarkInvoicePaidDialogResult,
} from '../mark-invoice-paid-dialog/mark-invoice-paid-dialog.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { PinAuthorizationDialogComponent, PinAuthorizationDialogResult } from '../../../menu/hms/front-desk/reservations/pin-authorization-dialog/pin-authorization-dialog.component';
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
  private readonly rolesService = inject(RolesService);
  private readonly storeStore = inject(StoreStore);

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

  readonly canDelete = computed(() => this.rolesService.isAdmin());

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
    const inv = this.invoice();
    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Invoice',
        message: `Are you sure you want to delete invoice ${inv.invoiceNumber}? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    confirmRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      const storeId = this.storeStore.selectedStore()?._id;
      if (!storeId) return;

      const pinRef = this.dialog.open(PinAuthorizationDialogComponent, {
        width: '400px',
        disableClose: true,
        data: {
          storeId,
          actionDescription: `delete invoice ${inv.invoiceNumber}`,
          reservationId: '',
        },
      });

      pinRef.afterClosed().subscribe((result: PinAuthorizationDialogResult) => {
        if (!result?.authorized) return;

        this.invoiceService.deleteInvoice(inv._id).subscribe({
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
      });
    });
  }
}
