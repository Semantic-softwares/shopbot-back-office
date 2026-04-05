import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatDialog } from '@angular/material/dialog';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { NoRecordComponent } from '../../../../shared/components/no-record/no-record.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { MarkInvoicePaidDialogComponent, MarkInvoicePaidDialogResult } from '../../../../shared/components/mark-invoice-paid-dialog/mark-invoice-paid-dialog.component';
import { LeaseCloseoutSummary, LeaseCloseoutInvoice, EstateInvoice, InvoiceType } from '../../../../shared/models/estate.model';
import { LeaseService } from '../../../../shared/services/lease.service';
import { EstatePaymentService } from '../../../../shared/services/estate-payment.service';
import { EstateInvoiceService } from '../../../../shared/services/estate-invoice.service';
import {
  ReturnDepositDialogComponent,
  ReturnDepositDialogResult,
} from './return-deposit-dialog/return-deposit-dialog.component';

@Component({
  selector: 'app-lease-closeout',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    NoRecordComponent,
    PageHeaderComponent,
  ],
  templateUrl: './lease-closeout.component.html',
  styleUrl: './lease-closeout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaseCloseoutComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private leaseService = inject(LeaseService);
  private paymentService = inject(EstatePaymentService);
  private invoiceService = inject(EstateInvoiceService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  readonly leaseId = signal(this.route.snapshot.paramMap.get('id') || '');
  readonly isSubmitting = signal(false);
  readonly isRefundingDeposit = signal(false);
  private readonly hasInitializedForm = signal(false);

  readonly form = this.fb.group({
    effectiveEndDate: [null as Date | null, Validators.required],
    moveOutDate: [null as Date | null],
    reason: [''],
    notes: [''],
  });

  readonly closeoutResource = rxResource({
    params: () => ({ id: this.leaseId() }),
    stream: ({ params }) => this.leaseService.getLeaseCloseoutSummary(params.id),
  });

  readonly summary = computed<LeaseCloseoutSummary | undefined>(
    () => this.closeoutResource.value()?.data,
  );
  readonly lease = computed(() => this.summary()?.lease);
  readonly hasAvailableDepositToRefund = computed(
    () => (this.summary()?.depositSummary?.availableDepositAmount || 0) > 0,
  );
  readonly isDepositFullyRefunded = computed(() => {
    const depositSummary = this.summary()?.depositSummary;
    const totalCollected = depositSummary?.totalDepositCollected || 0;
    const available = depositSummary?.availableDepositAmount || 0;
    return totalCollected > 0 && available <= 0;
  });
  readonly currencyCode = computed(() => 'NGN');

  constructor() {
    effect(() => {
      const lease = this.lease();
      if (!lease || this.hasInitializedForm()) {
        return;
      }

      this.form.patchValue({
        effectiveEndDate: this.parseDate(lease.endDate) ?? new Date(),
        moveOutDate: null,
      });
      this.hasInitializedForm.set(true);
    });
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const effectiveEndDate = this.formatDateForApi(this.form.getRawValue().effectiveEndDate);
    if (!effectiveEndDate) {
      this.form.controls.effectiveEndDate.setErrors({ required: true });
      return;
    }

    this.dialog
      .open(ConfirmationDialogComponent, {
        data: {
          message:
            'End this lease now? Future recurring billing will stop, but outstanding invoices and deposits will remain for manual closeout.',
        },
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) {
          return;
        }

        this.isSubmitting.set(true);

        this.leaseService
          .endLease(this.leaseId(), {
            effectiveEndDate,
            moveOutDate: this.formatDateForApi(this.form.getRawValue().moveOutDate) || undefined,
            reason: this.trimmedValue(this.form.getRawValue().reason),
            notes: this.trimmedValue(this.form.getRawValue().notes),
          })
          .subscribe({
            next: () => {
              this.isSubmitting.set(false);
              this.snackBar.open('Lease ended successfully', 'Close', { duration: 4000 });
              this.router.navigate(['../'], { relativeTo: this.route });
            },
            error: (error) => {
              this.isSubmitting.set(false);
              this.snackBar.open(error?.error?.message || 'Failed to end lease', 'Close', {
                duration: 6000,
              });
            },
          });
      });
  }

  reload(): void {
    this.closeoutResource.reload();
  }

  private parseDate(value?: string | null): Date | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private formatDateForApi(value: Date | string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private trimmedValue(value: string | null | undefined): string | undefined {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }

  recordPayment(summaryInvoice: LeaseCloseoutInvoice): void {
    // First, fetch the full invoice details using the invoice id
    this.invoiceService.getInvoiceById(summaryInvoice.id).subscribe({
      next: (response) => {
        this.openMarkPaidDialog(response.data);
      },
      error: (err: { error?: { message?: string } }) => {
        this.snackBar.open(
          err?.error?.message || 'Failed to load invoice details',
          'Close',
          { duration: 5000 },
        );
      },
    });
  }

  refundDeposit(): void {
    const summary = this.summary();
    const lease = summary?.lease;
    const availableDeposit = summary?.depositSummary?.availableDepositAmount || 0;
    const totalDeposit = summary?.depositSummary?.totalDepositCollected || 0;

    if (!lease || availableDeposit <= 0 || this.isRefundingDeposit()) {
      return;
    }

    const dialogRef = this.dialog.open(ReturnDepositDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: {
        currencyCode: this.currencyCode(),
        totalDeposit,
        availableDeposit,
        tenants: lease.tenants,
      },
    });

    dialogRef.afterClosed().subscribe((result?: ReturnDepositDialogResult) => {
      if (!result) {
        return;
      }

      this.isRefundingDeposit.set(true);

      const today = this.formatDateForApi(new Date());
      if (!today) {
        this.isRefundingDeposit.set(false);
        this.snackBar.open('Unable to determine refund date', 'Close', {
          duration: 4000,
        });
        return;
      }

      this.invoiceService
        .createManualInvoice({
          leaseId: this.leaseId(),
          tenantId: result.tenantId,
          title: 'Refund Deposit',
          description: 'Lease closeout deposit refund',
          type: InvoiceType.ONE_TIME_CHARGE,
          dueDate: today,
          amount: result.amount,
          categoryCode: 'REFUND_DEPOSIT',
          categorySide: 'EXPENSE',
          metadata: {
            workflow: 'LEASE_CLOSEOUT',
          },
        })
        .subscribe({
          next: (response) => {
            const createdInvoice = response.data;

            if (!result.markAsPaid) {
              this.isRefundingDeposit.set(false);
              this.snackBar.open('Refund invoice created', 'Close', {
                duration: 3500,
              });
              this.closeoutResource.reload();
              return;
            }

            this.invoiceService.getInvoiceById(createdInvoice._id).subscribe({
              next: (invoiceResponse) => {
                this.isRefundingDeposit.set(false);
                this.openMarkPaidDialog(invoiceResponse.data);
              },
              error: (err: { error?: { message?: string } }) => {
                this.isRefundingDeposit.set(false);
                this.snackBar.open(
                  err?.error?.message || 'Refund invoice created but failed to load payment dialog',
                  'Close',
                  { duration: 5000 },
                );
                this.closeoutResource.reload();
              },
            });
          },
          error: (err: { error?: { message?: string } }) => {
            this.isRefundingDeposit.set(false);
            this.snackBar.open(
              err?.error?.message || 'Failed to create refund invoice',
              'Close',
              { duration: 5000 },
            );
          },
        });
    });
  }

  private openMarkPaidDialog(invoice: EstateInvoice): void {
    const dialogRef = this.dialog.open(MarkInvoicePaidDialogComponent, {
      width: '720px',
      maxWidth: '95vw',
      data: { invoice },
    });

    dialogRef.afterClosed().subscribe((result?: MarkInvoicePaidDialogResult) => {
      if (!result) {
        this.closeoutResource.reload();
        return;
      }

      const tenantId =
        typeof invoice.tenantId === 'string'
          ? invoice.tenantId
          : invoice.tenantId?._id;

      this.paymentService
        .createPayment({
          leaseId:
            typeof invoice.leaseId === 'string'
              ? invoice.leaseId
              : invoice.leaseId._id,
          tenantId: tenantId || undefined,
          totalAmount: result.amount,
          paymentDate: result.paymentDate,
          paymentMethod: result.paymentMethod,
          note: result.note,
          allocations: [{ invoiceId: invoice._id, allocatedAmount: result.amount }],
        })
        .subscribe({
          next: () => {
            this.snackBar.open('Payment recorded and applied to invoice', 'Close', {
              duration: 3500,
            });
            this.closeoutResource.reload();
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
}