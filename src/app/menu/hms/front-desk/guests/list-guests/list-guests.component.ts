import { Component, inject, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from "@angular/material/divider";
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { GuestService, GuestSearchResponse } from '../../../../../shared/services/guest.service';
import { Guest } from '../../../../../shared/models/reservation.model';
import { StoreStore } from '../../../../../shared/stores/store.store';

@Component({
  selector: 'app-list-guests',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatMenuModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './list-guests.component.html',
  styleUrl: './list-guests.component.scss'
})
export class ListGuestsComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private guestService = inject(GuestService);
  private storeStore = inject(StoreStore);

  // Signals
  guests = signal<Guest[]>([]);
  loading = signal<boolean>(false);
  searchTerm = signal<string>('');
  currentPage = signal<number>(1);
  totalGuests = signal<number>(0);
  totalPages = signal<number>(0);
  selectedGuest = signal<Guest | null>(null);
  isUpdating = signal<boolean>(false); // New signal for update operations
  guestStats = signal<any>({
    total: 0,
    vip: 0,
    recent: 0,
    returning: 0,
    new: 0,
    blacklisted: 0
  });

  // Form
  searchForm: FormGroup;

  // Computed properties
  selectedStore = computed(() => this.storeStore.selectedStore());
  filteredGuests = computed(() => {
    const guests = this.guests();
    const search = this.searchTerm().toLowerCase();
    
    if (!search) return guests;
    
    return guests.filter(guest => 
      (guest.firstName?.toLowerCase().includes(search) ?? false) ||
      (guest.lastName?.toLowerCase().includes(search) ?? false) ||
      (guest.companyName?.toLowerCase().includes(search) ?? false) ||
      (guest.email?.toLowerCase().includes(search) ?? false) ||
      (guest.phone?.toLowerCase().includes(search) ?? false)
    );
  });

  constructor() {
    this.searchForm = this.fb.group({
      search: [''],
      nationality: [''],
      isVip: [''],
      blacklisted: ['']
    });

    // Search effect
    effect(() => {
      const formValue = this.searchForm.value;
      if (formValue.search !== this.searchTerm()) {
        this.searchTerm.set(formValue.search || '');
      }
    });

    // Store change effect - reload guests when store changes
    effect(() => {
      const store = this.selectedStore();
      if (store?._id) {
        console.log('Store changed in guest list:', store.name, store._id);
        this.loadGuests();
        this.loadGuestStats();
      }
    });

    // Auto-search effect
    this.searchForm.get('search')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.searchTerm.set(value || '');
      this.searchGuests();
    });
  }

  ngOnInit() {
    // Initial data loading is handled by the store change effect
    // If store is already selected, the effect will trigger automatically
    const currentStore = this.selectedStore();
    if (currentStore?._id) {
      this.loadGuests();
      this.loadGuestStats();
    }
  }

  async loadGuests() {
    const currentStore = this.selectedStore();
    if (!currentStore?._id) {
      console.log('No store selected, skipping guest load');
      this.guests.set([]);
      this.totalGuests.set(0);
      this.totalPages.set(0);
      return;
    }

    this.loading.set(true);
    try {
      console.log('Loading guests for store:', currentStore.name, currentStore._id);
      const response = await this.guestService.searchGuests(
        this.searchTerm(), 
        this.currentPage(), 
        20,
        currentStore._id
      ).toPromise() as GuestSearchResponse;
      
      this.guests.set(response.guests || []);
      this.totalGuests.set(response.total || 0);
      this.totalPages.set(response.totalPages || 0);
    } catch (error) {
      console.error('Error loading guests:', error);
      this.showError('Failed to load guests');
    } finally {
      this.loading.set(false);
    }
  }

  async loadGuestStats() {
    try {
      const storeId = this.selectedStore()?._id;
      const stats = await this.guestService.getGuestStats(storeId).toPromise();
      this.guestStats.set(stats);
    } catch (error) {
      console.error('Error loading guest stats:', error);
    }
  }

  async searchGuests() {
    this.currentPage.set(1);
    await this.loadGuests();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadGuests();
  }

  clearFilters() {
    this.searchForm.reset();
    this.searchTerm.set('');
    this.currentPage.set(1);
    this.loadGuests();
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
    
    // Enhanced confirmation with guest details
    const confirmDelete = confirm(
      `⚠️ PERMANENTLY DELETE GUEST\n\n` +
      `Guest: ${guestName}\n` +
      `Email: ${guest.email}\n` +
      `Phone: ${guest.phone}\n` +
      `Total Stays: ${guest.totalStays || 0}\n` +
      `Total Spent: ${(guest.totalSpent || 0) | 0}\n\n` +
      `This action CANNOT be undone. All guest data, reservations, and history will be permanently removed.\n\n` +
      `Are you absolutely sure you want to delete this guest?`
    );

    if (confirmDelete) {
      // Final confirmation for safety
      const finalConfirm = confirm(
        `🚨 FINAL CONFIRMATION\n\n` +
        `You are about to permanently delete ${guestName}.\n\n` +
        `Type confirmation: This will delete ALL data for this guest.\n\n` +
        `Click OK to proceed with deletion or Cancel to abort.`
      );

      if (finalConfirm) {
        this.isUpdating.set(true);
        try {
          await this.guestService.deleteGuest(guest._id).toPromise();
          this.showSuccess(`Guest ${guestName} has been permanently deleted`);
          
          // Remove from local list and refresh stats
          this.guests.update(guests => guests.filter(g => g._id !== guest._id));
          await this.loadGuestStats();
          
        } catch (error) {
          console.error('Error deleting guest:', error);
          this.showError(`Failed to delete guest ${guestName}. Please try again.`);
        } finally {
          this.isUpdating.set(false);
        }
      }
    }
  }

  async toggleVipStatus(guest: Guest) {
    const guestName = `${guest.firstName} ${guest.lastName}`;

    if (guest.isVip) {
      // Removing VIP status - simple confirmation
      if (!confirm(`Are you sure you want to remove VIP status from ${guestName}?\n\nThis will remove all VIP benefits and privileges.`)) {
        return;
      }
      await this.updateVipStatus(guest._id, false);
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
      await this.updateVipStatus(guest._id, true);
    }
  }

  async toggleBlacklistStatus(guest: Guest) {
    const guestName = `${guest.firstName} ${guest.lastName}`;

    if (guest.blacklisted) {
      // Removing from blacklist - simple confirmation
      if (!confirm(`Are you sure you want to remove ${guestName} from the blacklist?`)) {
        return;
      }
      await this.updateBlacklistStatus(guest._id, false, '');
    } else {
      // Adding to blacklist - require reason
      await this.addToBlacklist(guestName, guest._id);
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
        // Update the guest in the list
        this.updateGuestInList(updatedGuest);
        const guestName = `${updatedGuest.firstName} ${updatedGuest.lastName}`;
        const statusText = isVip ? 'granted VIP status' : 'removed from VIP status';
        this.showSuccess(`${guestName} ${statusText} successfully`);
        
        // Refresh stats to reflect changes
        await this.loadGuestStats();
      }
    } catch (error) {
      console.error('Error updating VIP status:', error);
      this.showError('Failed to update VIP status. Please try again.');
    } finally {
      this.isUpdating.set(false);
    }
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
        // Update the guest in the list
        this.updateGuestInList(updatedGuest);
        const guestName = `${updatedGuest.firstName} ${updatedGuest.lastName}`;
        const statusText = blacklisted ? 'added to blacklist' : 'removed from blacklist';
        this.showSuccess(`${guestName} ${statusText} successfully`);
        
        // Refresh stats to reflect changes
        await this.loadGuestStats();
      }
    } catch (error) {
      console.error('Error updating blacklist status:', error);
      this.showError('Failed to update blacklist status. Please try again.');
    } finally {
      this.isUpdating.set(false);
    }
  }

  private updateGuestInList(updatedGuest: Guest) {
    const currentGuests = this.guests();
    const updatedGuests = currentGuests.map(guest => 
      guest._id === updatedGuest._id ? updatedGuest : guest
    );
    this.guests.set(updatedGuests);
  }

  getGuestStatus(guest: Guest): string {
    if (guest.blacklisted) return 'blacklisted';
    if (guest.isVip) return 'vip';
    if (guest.totalStays && guest.totalStays > 5) return 'returning';
    if (guest.totalStays === 1) return 'new';
    return 'regular';
  }

  getGuestStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'vip': 'bg-purple-100 text-purple-800',
      'returning': 'bg-blue-100 text-blue-800',
      'new': 'bg-green-100 text-green-800',
      'regular': 'bg-gray-100 text-gray-800',
      'blacklisted': 'bg-red-100 text-red-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  }

  // Helper methods for template
  Math = Math;
  Array = Array;

  // Generate page numbers for pagination
  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
      pages.push(i);
    }
    
    return pages;
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showInfo(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }
}
