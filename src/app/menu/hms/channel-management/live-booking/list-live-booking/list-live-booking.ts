import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { signal, computed } from '@angular/core';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { rxResource } from '@angular/core/rxjs-interop';
import { LiveBookingService, LiveBookingFilters } from '../../../../../shared/services/live-booking.service';
import { LiveBookingModel } from '../../../../../shared/models/live-booking.model';
import { LiveBooking } from '../live-booking';

@Component({
  selector: 'app-list-live-booking',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatMenuModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatFormFieldModule,
    PageHeaderComponent,
    RouterLink
],
  templateUrl: './list-live-booking.html',
  styleUrl: './list-live-booking.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListLiveBooking {
  private fb = inject(FormBuilder);
  private liveBookingService = inject(LiveBookingService);
  private storeStore = inject(StoreStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Signals for pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(20);

  // Filter signals
  searchFilter = signal<string>('');
  otaFilter = signal<string[]>([]);
  arrivalDateFromFilter = signal<Date | null>(null);
  arrivalDateToFilter = signal<Date | null>(null);
  departureDateFromFilter = signal<Date | null>(null);
  departureDateToFilter = signal<Date | null>(null);
  bookingDateFromFilter = signal<Date | null>(null);
  bookingDateToFilter = signal<Date | null>(null);
  statusFilter = signal<string>('');

  // Filter form
  filterForm = this.fb.group({
    search: [''],
    otaCodes: [[] as string[]],
    arrivalDateRange: this.fb.group({
      start: [null as Date | null],
      end: [null as Date | null],
    }),
    departureDateRange: this.fb.group({
      start: [null as Date | null],
      end: [null as Date | null],
    }),
    bookingDateRange: this.fb.group({
      start: [null as Date | null],
      end: [null as Date | null],
    }),
    status: [''],
  });

  filterParams = computed(() => {
    const currentStore = this.storeStore.selectedStore();
    if (!currentStore?._id) {
      return {};
    }

    const arrivalRange = (this.filterForm.get('arrivalDateRange') as FormGroup)?.value;
    const departureRange = (this.filterForm.get('departureDateRange') as FormGroup)?.value;
    const bookingRange = (this.filterForm.get('bookingDateRange') as FormGroup)?.value;

    const searchValue = this.filterForm.get('search')?.value;
    const statusValue = this.filterForm.get('status')?.value;
    const otaCodesValue = this.filterForm.get('otaCodes')?.value;

    const filters: LiveBookingFilters = {
      page: this.currentPage(),
      limit: this.pageSize(),
      search: searchValue && searchValue.trim() ? searchValue.trim() : undefined,
      otaCodes: otaCodesValue && otaCodesValue.length > 0 ? otaCodesValue : undefined,
      status: statusValue && statusValue.length > 0 ? statusValue : undefined,
      arrivalDateFrom: arrivalRange?.start ? this.formatDate(arrivalRange.start) : undefined,
      arrivalDateTo: arrivalRange?.end ? this.formatDate(arrivalRange.end) : undefined,
      departureDateFrom: departureRange?.start ? this.formatDate(departureRange.start) : undefined,
      departureDateTo: departureRange?.end ? this.formatDate(departureRange.end) : undefined,
      bookingDateFrom: bookingRange?.start ? this.formatDate(bookingRange.start) : undefined,
      bookingDateTo: bookingRange?.end ? this.formatDate(bookingRange.end) : undefined,
    };

    return filters;
  });

  // OTA options
  otaOptions = [
    { value: 'BookingCom', label: 'Booking.com' },
    { value: 'Airbnb', label: 'Airbnb' },
    { value: 'Expedia', label: 'Expedia' },
    { value: 'Hotels.com', label: 'Hotels.com' },
    { value: 'VRBO', label: 'VRBO' },
  ];

  // Status options
  statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'new', label: 'New' },
    { value: 'modified', label: 'Modified' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  // rxResource for loading bookings
  liveBookings = rxResource({
    params: () => {
      const storeId = this.storeStore.selectedStore()?._id;
      const filters = this.filterParams();
      return { storeId, filters };
    },
    stream: ({ params }) => {
      if (!params.storeId) {
        throw new Error('Store ID not available');
      }
      console.log(params.filters)
      return this.liveBookingService.getLiveBookings(params.storeId, params.filters);
    },
  });

  // Table configuration
  displayedColumns = [
    'status',
    'uniqueId',
    'source',
    'customerName',
    'dates',
    'roomsCount',
    'total',
    'actions',
  ];

  // Helper methods to get FormGroups for date ranges
  get arrivalDateRange(): FormGroup {
    return this.filterForm.get('arrivalDateRange') as FormGroup;
  }

  get departureDateRange(): FormGroup {
    return this.filterForm.get('departureDateRange') as FormGroup;
  }

  get bookingDateRange(): FormGroup {
    return this.filterForm.get('bookingDateRange') as FormGroup;
  }

  // Get bookings list from resource
  get bookingsList() {
    return this.liveBookings.value()?.bookings || [];
  }

  get pagination() {
    return this.liveBookings.value()?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };
  }

  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
  }

  clearFilters() {
    this.searchFilter.set('');
    this.otaFilter.set([]);
    this.statusFilter.set('');
    this.arrivalDateFromFilter.set(null);
    this.arrivalDateToFilter.set(null);
    this.departureDateFromFilter.set(null);
    this.departureDateToFilter.set(null);
    this.bookingDateFromFilter.set(null);
    this.bookingDateToFilter.set(null);
    this.currentPage.set(1);
    this.filterForm.reset();
  }

  refreshBookings() {
    this.liveBookings.reload();
  }

  exportToCSV() {
    const bookings = this.bookingsList;
    if (!bookings.length) return;

    const headers = [
      'Unique ID',
      'Property',
      'Customer',
      'Arrival Date',
      'Departure Date',
      'Rooms',
      'Status',
      'Total',
      'Currency',
    ];

    const rows = bookings.map(b => [
      b.uniqueId,
      b.property,
      b.customerName,
      b.arrivalDate,
      b.departureDate,
      b.roomsCount,
      b.status,
      b.amount,
      b.currency,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `live-bookings-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  getStatusChip(status: string) {
    const statusMap: { [key: string]: { icon: string; color: string } } = {
      new: { icon: 'add_circle', color: 'accent' },
      modified: { icon: 'edit', color: 'warn' },
      cancelled: { icon: 'cancel', color: 'warn' },
    };
    return statusMap[status] || { icon: 'info', color: 'primary' };
  }

  getDateRange(startDate: string, endDate: string): string {
    return `${new Date(startDate).toLocaleDateString()} → ${new Date(endDate).toLocaleDateString()}`;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  viewBookingDetails(booking: LiveBookingModel) {
    // Navigate to booking details page with the booking ID
    this.router.navigate(['../../live-booking', booking.id, 'details'],  { relativeTo: this.route} ).catch(err => {
      console.error('Navigation error:', err);
    });
  }
}

