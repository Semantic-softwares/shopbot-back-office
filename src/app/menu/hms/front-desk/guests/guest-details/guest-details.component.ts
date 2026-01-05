import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { GuestService } from '../../../../../shared/services/guest.service';
import { Guest } from '../../../../../shared/models/reservation.model';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-guest-details',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatCardModule,
    MatTabsModule,
    MatChipsModule,
    PageHeaderComponent
  ],
  templateUrl: './guest-details.component.html',
  styleUrl: './guest-details.component.scss'
})
export class GuestDetailsComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private guestService = inject(GuestService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  // Signals
  guest = signal<Guest | null>(null);
  isLoading = signal<boolean>(false);
  guestId = signal<string | null>(null);
  guestHistory = signal<any[]>([]);
  isLoadingHistory = signal<boolean>(false);
  activeTab = signal<string>('personal'); // New signal for active tab
  isUpdating = signal<boolean>(false); // New signal for update operations

  // Computed properties
  selectedStore = computed(() => this.storeStore.selectedStore());
  guestFullName = computed(() => {
    const guest = this.guest();
    return guest ? `${guest.firstName} ${guest.lastName}` : '';
  });
  
  guestStatus = computed(() => {
    const guest = this.guest();
    if (!guest) return 'unknown';
    if (guest.blacklisted) return 'blacklisted';
    if (guest.isVip) return 'vip';
    if (guest.totalStays && guest.totalStays > 5) return 'returning';
    if (guest.totalStays === 1) return 'new';
    return 'regular';
  });

  guestStatusClass = computed(() => {
    const status = this.guestStatus();
    const statusClasses: { [key: string]: string } = {
      'vip': 'bg-purple-100 text-purple-800 border-purple-200',
      'returning': 'bg-blue-100 text-blue-800 border-blue-200',
      'new': 'bg-green-100 text-green-800 border-green-200',
      'regular': 'bg-gray-100 text-gray-800 border-gray-200',
      'blacklisted': 'bg-red-100 text-red-800 border-red-200'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  });

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params['id'];
      this.guestId.set(id || null);
      
      if (id) {
        this.loadGuest(id);
        this.loadGuestHistory(id);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadGuest(id: string) {
    this.isLoading.set(true);
    try {
      const guest = await this.guestService.getGuestById(id).toPromise();
      if (guest) {
        this.guest.set(guest);
      } else {
        throw new Error('Guest not found');
      }
    } catch (error) {
      console.error('Error loading guest:', error);
      this.showError('Failed to load guest information');
      this.router.navigate(['/menu/hms/front-desk/guests/list']);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadGuestHistory(id: string) {
    this.isLoadingHistory.set(true);
    try {
      const history = await this.guestService.getGuestHistory(id).toPromise();
      this.guestHistory.set(history?.reservations || []);
    } catch (error) {
      console.error('Error loading guest history:', error);
      this.guestHistory.set([]);
    } finally {
      this.isLoadingHistory.set(false);
    }
  }

  onEdit() {
    const guestId = this.guestId();
    if (guestId) {
      this.router.navigate(['/menu/hms/front-desk/guests/edit', guestId]);
    }
  }

  onDelete() {
    const guest = this.guest();
    if (!guest) return;

    // Enhanced confirmation dialog
    const guestName = `${guest.firstName} ${guest.lastName}`;
    const confirmationMessage = `Are you sure you want to permanently delete ${guestName}?\n\nThis action cannot be undone and will remove:\n• All guest information\n• Reservation history\n• Loyalty points\n• Notes and preferences`;
    
    if (confirm(confirmationMessage)) {
      this.deleteGuest();
    }
  }

  async deleteGuest() {
    const guestId = this.guestId();
    if (!guestId) return;

    this.isUpdating.set(true);
    try {
      await this.guestService.deleteGuest(guestId).toPromise();
      this.showSuccess('Guest deleted successfully');
      this.router.navigate(['/menu/hms/front-desk/guests/list']);
    } catch (error) {
      console.error('Error deleting guest:', error);
      this.showError('Failed to delete guest. Please try again.');
    } finally {
      this.isUpdating.set(false);
    }
  }

  async toggleVipStatus() {
    const guest = this.guest();
    const guestId = this.guestId();
    if (!guest || !guestId) return;

    const guestName = `${guest.firstName} ${guest.lastName}`;

    if (guest.isVip) {
      // Removing VIP status - simple confirmation
      if (!confirm(`Are you sure you want to remove VIP status from ${guestName}?\n\nThis will remove all VIP benefits and privileges.`)) {
        return;
      }
      await this.updateVipStatus(guestId, false);
    } else {
      // Adding VIP status - show benefits
      const confirmMessage = `Add VIP status to ${guestName}?\n\n` +
        `VIP Benefits include:\n` +
        `• Priority reservations and check-in\n` +
        `• Complimentary room upgrades (when available)\n` +
        `• Late checkout privileges\n` +
        `• Access to exclusive amenities\n` +
        `• Dedicated customer service\n` +
        `• Special welcome gifts and services`;

      if (!confirm(confirmMessage)) {
        return;
      }
      await this.updateVipStatus(guestId, true);
    }
  }

  private async updateVipStatus(guestId: string, isVip: boolean) {
    this.isUpdating.set(true);
    try {
      const updateData: any = { isVip };
      
      // Add VIP status metadata if making VIP
      if (isVip) {
        updateData.vipSince = new Date().toISOString();
      }

      const updatedGuest = await this.guestService.updateGuest(guestId, updateData).toPromise();
      if (updatedGuest) {
        this.guest.set(updatedGuest);
        const guest = this.guest();
        const guestName = guest ? `${guest.firstName} ${guest.lastName}` : 'Guest';
        const statusText = isVip ? 'granted VIP status' : 'removed from VIP status';
        this.showSuccess(`${guestName} ${statusText} successfully`);
      }
    } catch (error) {
      console.error('Error updating VIP status:', error);
      this.showError('Failed to update VIP status. Please try again.');
    } finally {
      this.isUpdating.set(false);
    }
  }

  async toggleBlacklistStatus() {
    const guest = this.guest();
    const guestId = this.guestId();
    if (!guest || !guestId) return;

    const guestName = `${guest.firstName} ${guest.lastName}`;

    if (guest.blacklisted) {
      // Removing from blacklist - simple confirmation
      if (!confirm(`Are you sure you want to remove ${guestName} from the blacklist?`)) {
        return;
      }
      await this.updateBlacklistStatus(guestId, false, '');
    } else {
      // Adding to blacklist - require reason
      await this.addToBlacklist(guestName, guestId);
    }
  }

  private async addToBlacklist(guestName: string, guestId: string) {
    // Enhanced blacklist dialog with reason
    const reason = prompt(
      `Please provide a reason for blacklisting ${guestName}:\n\n` +
      `This action will:\n` +
      `• Prevent future reservations\n` +
      `• Flag the guest account\n` +
      `• Require manager approval for any bookings\n\n` +
      `Reason (required):`,
      ''
    );

    if (reason === null) {
      // User cancelled
      return;
    }

    if (!reason.trim()) {
      alert('A reason is required to blacklist a guest.');
      return;
    }

    await this.updateBlacklistStatus(guestId, true, reason.trim());
  }

  private async updateBlacklistStatus(guestId: string, blacklisted: boolean, reason: string) {
    this.isUpdating.set(true);
    try {
      const updateData: any = { blacklisted };
      
      // Add blacklist reason if blacklisting
      if (blacklisted && reason) {
        updateData.blacklistReason = reason;
        updateData.blacklistedAt = new Date().toISOString();
      }

      const updatedGuest = await this.guestService.updateGuest(guestId, updateData).toPromise();
      if (updatedGuest) {
        this.guest.set(updatedGuest);
        const guest = this.guest();
        const guestName = guest ? `${guest.firstName} ${guest.lastName}` : 'Guest';
        const statusText = blacklisted ? 'added to blacklist' : 'removed from blacklist';
        this.showSuccess(`${guestName} ${statusText} successfully`);
      }
    } catch (error) {
      console.error('Error updating blacklist status:', error);
      this.showError('Failed to update blacklist status. Please try again.');
    } finally {
      this.isUpdating.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/menu/hms/front-desk/guests/list']);
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount) return '$0.00';
    const currency = this.selectedStore()?.currency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'Not specified';
    return new Date(date).toLocaleDateString();
  }

  formatDateTime(date: Date | string | undefined): string {
    if (!date) return 'Not specified';
    return new Date(date).toLocaleString();
  }

  getCountryName(countryCode: string | undefined): string {
    if (!countryCode) return 'Not specified';
    
    const countries: { [key: string]: string } = {
      'US': 'United States',
      'UK': 'United Kingdom',
      'CA': 'Canada',
      'DE': 'Germany',
      'FR': 'France',
      'IT': 'Italy',
      'ES': 'Spain',
      'AU': 'Australia',
      'JP': 'Japan',
      'KR': 'South Korea',
      'CN': 'China',
      'IN': 'India',
      'BR': 'Brazil',
      'MX': 'Mexico',
      'AR': 'Argentina',
      'NG': 'Nigeria',
      'ZA': 'South Africa',
      'EG': 'Egypt',
      'AE': 'United Arab Emirates',
      'SA': 'Saudi Arabia'
    };
    
    return countries[countryCode] || countryCode;
  }

  // Notification methods
  private showSuccess(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  // Tab management
  setActiveTab(tab: string) {
    this.activeTab.set(tab);
  }
}