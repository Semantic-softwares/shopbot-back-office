import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { rxResource } from '@angular/core/rxjs-interop';
import { LeaseActionsMenuComponent } from '../../../../shared/components/lease-actions-menu/lease-actions-menu.component';
import { LeaseService } from '../../../../shared/services/lease.service';
import { LeaseStatus } from '../../../../shared/models/estate.model';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-lease-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    LeaseActionsMenuComponent,
    PageHeaderComponent,
  ],
  templateUrl: './lease-detail-page.component.html',
})
export class LeaseDetailPageComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private leaseService = inject(LeaseService);
  private snackBar = inject(MatSnackBar);

  readonly leaseId = signal<string>(this.route.snapshot.paramMap.get('id') || '');

  readonly tabs = [
    { label: 'Tenants', link: 'tenants', icon: 'people' },
    { label: 'Lease Transactions', link: 'lease-transactions', icon: 'receipt_long' },
    { label: 'Activities', link: 'activities', icon: 'timeline' },
    { label: 'Utilities', link: 'utilities', icon: 'bolt' },
    { label: 'Billing', link: 'billing', icon: 'payments' },
  ];

  leaseResource = rxResource({
    params: () => ({ id: this.leaseId() }),
    stream: ({ params }) => this.leaseService.getLeaseById(params.id),
  });

  lease = computed(() => this.leaseResource.value()?.data);

  readonly title = computed(() => this.lease()?.leaseNumber || 'Lease Details');
  readonly subtitle = computed(() => {
    const lease = this.lease();
    if (!lease) return '';
    return [lease.leaseType, lease.status].join(' · ');
  });

  readonly isDraft = computed(() => this.lease()?.status === LeaseStatus.DRAFT);

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  editLease(): void {
    this.router.navigate(['../', this.leaseId(), 'edit'], { relativeTo: this.route });
  }

  completeDraft(): void {
    this.router.navigate(['../', this.leaseId(), 'edit'], { relativeTo: this.route });
  }

  endLease(): void {
    this.router.navigate(['../', this.leaseId(), 'end'], { relativeTo: this.route });
  }

  deleteLease(): void {
    const confirmed = window.confirm('Delete this lease? This action cannot be undone.');
    if (!confirmed) return;

    this.leaseService.deleteLease(this.leaseId()).subscribe({
      next: () => {
        this.snackBar.open('Lease deleted successfully', 'Close', { duration: 3000 });
        this.router.navigate(['../'], { relativeTo: this.route });
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message || 'Failed to delete lease', 'Close', {
          duration: 5000,
        });
      },
    });
  }

  reload(): void {
    this.leaseResource.reload();
  }
}
