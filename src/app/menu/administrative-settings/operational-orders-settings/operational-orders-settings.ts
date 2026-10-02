import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StoreService } from '../../../shared/services/store.service';
import { StoreStore } from '../../../shared/stores/store.store';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

interface DayRow {
  key: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  label: string;
  open: boolean;
  opensAt: Date;
  closesAt: Date;
}

const DAY_DEFS: { key: DayRow['key']; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const JS_DAY_INDEX: Record<DayRow['key'], number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function defaultTime(hours: number): Date {
  return new Date(1970, 0, 1, hours, 0);
}

// Store hours are stored as Date objects whose UTC hour/minute ARE the
// literal time-of-day (not a real timezone conversion) — see
// shopbot-server/src/shared/store-hours.util.ts for the matching backend
// read. MatTimepicker (via the app's NativeDateAdapter) reads/writes a Date
// using the BROWSER's LOCAL hour/minute, so the conversion here deliberately
// maps "stored UTC hour/minute" <-> "picker's local hour/minute" directly
// (same numbers, different field) rather than doing a real timezone
// conversion — that's what keeps this round-tripping exactly what the
// backend already expects, unchanged by this UI swap.
function isoToPickerDate(isoDate: string | undefined, fallbackHour: number): Date {
  if (!isoDate) return defaultTime(fallbackHour);
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return defaultTime(fallbackHour);
  return new Date(1970, 0, 1, d.getUTCHours(), d.getUTCMinutes());
}

function pickerDateToIso(date: Date): string {
  return new Date(Date.UTC(1970, 0, 1, date.getHours(), date.getMinutes())).toISOString();
}

// Edits Store.businessHours (no UI edited this anywhere before) and the new
// Store.operationalHours.enforceForOrders switch. Enforcement is OFF by
// default — businessHours defaults every day to `open: false` for any store
// that's never configured it (every store today), so defaulting enforcement
// on would instantly block ordering everywhere the moment this ships.
@Component({
  selector: 'app-operational-orders-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatTimepickerModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
  ],
  templateUrl: './operational-orders-settings.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class OperationalOrdersSettings implements OnInit {
  private storeService = inject(StoreService);
  private snackBar = inject(MatSnackBar);
  public storeStore = inject(StoreStore);

  loading = signal(true);
  saving = signal(false);

  enforceForOrders = signal(false);
  days = signal<DayRow[]>(DAY_DEFS.map((d) => ({ ...d, open: false, opensAt: defaultTime(9), closesAt: defaultTime(21) })));

  // Live "currently open" preview, computed from the in-progress form values
  // (not the last-saved ones) — same window logic as the backend's
  // isStoreOpenNow, ported here for immediate feedback while editing.
  isOpenNow = computed(() => {
    const now = new Date();
    const todayKey = (Object.keys(JS_DAY_INDEX) as DayRow['key'][]).find((k) => JS_DAY_INDEX[k] === now.getDay());
    const today = this.days().find((d) => d.key === todayKey);
    if (!today?.open) return false;

    const nowUTC = new Date(now.toUTCString());
    const currentMinutes = nowUTC.getUTCHours() * 60 + nowUTC.getUTCMinutes();
    const openMinutes = today.opensAt.getHours() * 60 + today.opensAt.getMinutes();
    const closeMinutes = today.closesAt.getHours() * 60 + today.closesAt.getMinutes();

    if (openMinutes > closeMinutes) {
      return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
    }
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  });

  ngOnInit(): void {
    this.loadSettings();
    this.loading.set(false);
  }

  private loadSettings(): void {
    const store = this.storeStore.selectedStore();
    this.enforceForOrders.set(!!store?.operationalHours?.enforceForOrders);

    const hours = store?.businessHours;
    if (!hours) return;
    this.days.set(
      DAY_DEFS.map((d) => {
        const dayHours = hours[d.key];
        return {
          ...d,
          open: !!dayHours?.open,
          opensAt: isoToPickerDate(dayHours?.openingTime, 9),
          closesAt: isoToPickerDate(dayHours?.closingTime, 21),
        };
      }),
    );
  }

  toggleDayOpen(key: DayRow['key'], open: boolean): void {
    this.days.update((rows) => rows.map((r) => (r.key === key ? { ...r, open } : r)));
  }

  setOpensAt(key: DayRow['key'], value: Date | null): void {
    if (!value) return;
    this.days.update((rows) => rows.map((r) => (r.key === key ? { ...r, opensAt: value } : r)));
  }

  setClosesAt(key: DayRow['key'], value: Date | null): void {
    if (!value) return;
    this.days.update((rows) => rows.map((r) => (r.key === key ? { ...r, closesAt: value } : r)));
  }

  save(): void {
    const store = this.storeStore.selectedStore();
    if (!store) return;

    this.saving.set(true);

    const businessHours: Record<string, any> = {};
    for (const row of this.days()) {
      businessHours[row.key] = {
        name: row.key,
        open: row.open,
        closed: !row.open,
        openingTime: pickerDateToIso(row.opensAt),
        closingTime: pickerDateToIso(row.closesAt),
      };
    }

    const payload = {
      businessHours,
      operationalHours: { enforceForOrders: this.enforceForOrders() },
    };

    this.storeService.updateStore(store._id, payload).subscribe({
      next: () => {
        this.storeService.getStore(store._id).subscribe({
          next: (updatedStore) => {
            this.storeStore.updateStore(updatedStore);
            this.storeService.saveStoreLocally(updatedStore);
            this.saving.set(false);
            this.snackBar.open('Operational hours saved.', 'Close', { duration: 3000 });
          },
          error: () => {
            this.saving.set(false);
            this.snackBar.open('Saved, but failed to refresh local data.', 'Close', { duration: 4000 });
          },
        });
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Failed to save operational hours.', 'Close', { duration: 4000 });
      },
    });
  }
}
