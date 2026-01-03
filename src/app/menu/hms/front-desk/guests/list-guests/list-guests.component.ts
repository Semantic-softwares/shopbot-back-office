import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { rxResource } from '@angular/core/rxjs-interop';
import { GuestService } from '../../../../../shared/services/guest.service';
import { Guest } from '../../../../../shared/models/reservation.model';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-list-guests',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    PageHeaderComponent
  ],
  templateUrl: './list-guests.component.html',
  styleUrl: './list-guests.component.scss'
})
export class ListGuestsComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private guestService = inject(GuestService);
  public storeStore = inject(StoreStore);

  // Pagination signals
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  // Filter signals
  searchFilter = signal<string>('');
  statusFilter = signal<string>('');
  guestTypeFilter = signal<string>('');

  // Loading state for updates
  isUpdating = signal<boolean>(false);

  // Filter form
  filterForm = this.fb.group({
    search: [''],
    status: [''],
    guestType: ['']
  });

  // Table configuration
  displayedColumns = ['guest', 'email', 'phone', 'stats', 'spent', 'lastStay', 'status', 'actions'];

  // Status options
  statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'blacklisted', label: 'Blacklisted' }
  ];

  // Guest type options
  guestTypeOptions = [
    { value: '', label: 'All Guests' },
    { value: 'vip', label: 'VIP Guests' },
    { value: 'regular', label: 'Regular Guests' }
  ];

  // Computed filter params for rxResource
  private filterParams = computed(() => {
    const selectedStore = this.storeStore.selectedStore();
    return {
      storeId: selectedStore?._id,
      search: this.searchFilter(),
      page: this.currentPage(),
      limit: this.pageSize()
    };
  });

  // rxResource for guests
  public guests = rxResource({
    params: () => this.filterParams(),
    stream: ({ params }) => this.guestService.searchGuests(
      params.search || '',
      params.page,
      params.limit,
      params.storeId
    ),
  });

  // rxResource for guest stats
  public guestStats = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id }),
    stream: ({ params }) => this.guestService.getGuestStats(params.storeId),
  });

  // Computed statistics
  totalGuests = computed(() => this.guests.value()?.total || 0);
  vipCount = computed(() => this.guestStats.value()?.vip || 0);
  returningCount = computed(() => this.guestStats.value()?.returning || 0);
  newCount = computed(() => this.guestStats.value()?.new || 0);
  recentCount = computed(() => this.guestStats.value()?.recent || 0);
  blacklistedCount = computed(() => this.guestStats.value()?.blacklisted || 0);

  constructor() {
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((formValues) => {
      this.currentPage.set(1);
      this.searchFilter.set(formValues.search || '');
      this.statusFilter.set(formValues.status || '');
      this.guestTypeFilter.set(formValues.guestType || '');
    });
  }

  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
  }

  clearFilters() {
    this.filterForm.reset({ search: '', status: '', guestType: '' });
    this.searchFilter.set('');
    this.statusFilter.set('');
    this.guestTypeFilter.set('');
    this.currentPage.set(1);
  }

  reloadData() {
    this.guests.reload();
    this.guestStats.reload();
  }

  viewGuestDetails(guest: Guest) {
    this.router.navigate(['../details', guest._id], { relativeTo: this.route });
  }

  editGuest(guest: Guest) {
    this.router.navigate(['../edit', guest._id], { relativeTo: this.route });
  }

  createGuest() {
    this.router.navigate(['../create'], { relativeTo: this.route });
  }

  async deleteGuest(guest: Guest) {
    const guestName = `${guest.firstName} ${guest.lastName}`;
    const confirmDelete = confirm(`Delete guest ${guestName}? This action cannot be undone.`);
    if (confirmDelete) {
      this.isUpdating.set(true);
      try {
        await this.guestService.deleteGuest(guest._id).toPromise();
        this.showSuccess(`Guest ${guestName} has been deleted`);
        this.reloadData();
      } catch (error) {
        console.error('Error deleting guest:', error);
        this.showError(`Failed to delete guest ${guestName}`);
      } finally {
        this.isUpdating.set(false);
      }
    }
  }

  async toggleVipStatus(guest: Guest) {
    const guestName = `${guest.firstName} ${guest.lastName}`;
    const newVipStatus = !guest.isVip;
    const confirmMessage = guest.isVip
      ? `Remove VIP status from ${guestName}?`
      : `Add VIP status to ${guestName}?`;
    if (!confirm(confirmMessage)) return;

    this.isUpdating.set(true);
    try {
      const updateData: any = { isVip: newVipStatus };
      if (newVipStatus) updateData.vipSince = new Date().toISOString();
      await this.guestService.updateGuest(guest._id, updateData).toPromise();
      this.showSuccess(`${guestName} ${newVipStatus ? 'granted VIP status' : 'removed from VIP status'}`);
      this.reloadData();
    } catch (error) {
      console.error('Error updating VIP status:', error);
      this.showError('Failed to update VIP status');
    } finally {
      this.isUpdating.set(false);
    }
  }

  async toggleBlacklistStatus(guest: Guest) {
    const guestName = `${guest.firstName} ${guest.lastName}`;
    if (guest.blacklisted) {
      if (!confirm(`Remove ${guestName} from the blacklist?`)) return;
      await this.updateBlacklistStatus(guest._id, false, '');
    } else {
      const reason = prompt(`Please provide a reason for blacklisting ${guestName}:`);
      if (reason === null) return;
      if (!reason.trim()) { alert('A reason is required.'); return; }
      await this.updateBlacklistStatus(guest._id, true, reason.trim());
    }
  }

  private async updateBlacklistStatus(guestId: string, blacklisted: boolean, reason: string) {
    this.isUpdating.set(true);
    try {
      const updateData: any = { blacklisted };
      if (blacklisted && reason) {
        updateData.blacklistReason = reason;
        updateData.blacklistedAt = new Date().toISOString();
      }
      await this.guestService.updateGuest(guestId, updateData).toPromise();
      this.showSuccess(`Guest ${blacklisted ? 'added to' : 'removed from'} blacklist`);
      this.reloadData();
    } catch (error) {
      console.error('Error updating blacklist status:', error);
      this.showError('Failed to update blacklist status');
    } finally {
      this.isUpdating.set(false);
    }
  }

  getGuestStatus(guest: Guest): string {
    if (guest.blacklisted) return 'blacklisted';
    if (guest.isVip) return 'vip';
    if (guest.totalStays && guest.totalStays > 5) return 'returning';
    if (guest.totalStays === 1) return 'new';
    return 'regular';
  }

  getStatusChipClass(status: string): string {
    const colorMap: Record<string, string> = {
      vip: 'bg-purple-600! text-white!',
      returning: 'bg-blue-600! text-white!',
      new: 'bg-green-600! text-white!',
      regular: 'bg-gray-500! text-white!',
      blacklisted: 'bg-red-600! text-white!'
    };
    return colorMap[status] || 'bg-gray-500! text-white!';
  }

  getGuestName(guest: Guest): string {
    const name = ((guest.firstName || '') + ' ' + (guest.lastName || '')).trim();
    if (name && guest.companyName) return `${name} (${guest.companyName})`;
    return name || guest.companyName || 'Unknown Guest';
  }

  getGuestInitials(guest: Guest): string {
    const first = guest.firstName?.charAt(0) || '';
    const last = guest.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  }

  canEdit(guest: Guest): boolean {
    return !guest.blacklisted;
  }

  canDelete(guest: Guest): boolean {
    return true;
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
  }
}
