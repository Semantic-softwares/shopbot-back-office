import { ChangeDetectionStrategy, Component, computed, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { TrPipe } from '../../../../shared/i18n/tr.pipe';
import { HotelDashboardService } from '../../../../shared/services/hotel-dashboard.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { REPORT_CATEGORIES, REPORTS, ReportMeta, reportById, reportLink } from '../report-registry';

const FAV_KEY = 'shopbot.reports.favs';
const RECENT_KEY = 'shopbot.reports.recent';

const load = (key: string): string[] => {
  try { return (JSON.parse(localStorage.getItem(key) ?? '[]') as string[]).filter((id) => !!reportById(id)); } catch { return []; }
};

/** One accent per category, written out in full so Tailwind can see every class. */
const ACCENTS: Record<string, { tile: string; text: string }> = {
  guests: { tile: 'bg-blue-100 text-blue-700', text: 'text-blue-700' },
  reservations: { tile: 'bg-orange-100 text-orange-700', text: 'text-orange-700' },
  orders: { tile: 'bg-purple-100 text-purple-700', text: 'text-purple-700' },
  housekeeping: { tile: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-700' },
  financial: { tile: 'bg-amber-100 text-amber-700', text: 'text-amber-700' },
  performance: { tile: 'bg-teal-100 text-teal-700', text: 'text-teal-700' },
};
const FALLBACK = { tile: 'bg-slate-100 text-slate-700', text: 'text-slate-700' };

/** The four lists a front desk opens every day, shown first with a live number. */
const DAILY = ['arrivals', 'in-house', 'departures', 'room-status'] as const;

/**
 * The front door of the reports. A hotel has a handful of daily lists and a long tail of occasional ones, so the page leads with
 * the daily four (with live counts), offers search first (press "/"), and lists the rest compactly by category.
 */
@Component({
  selector: 'app-reports-hub',
  imports: [TrPipe, RouterLink, PageHeaderComponent, MatButtonModule, MatChipsModule, MatFormFieldModule, MatIconModule, MatInputModule, MatListModule, MatTooltipModule],
  templateUrl: './reports-hub.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ReportsHubComponent {
  private readonly router = inject(Router);
  private readonly storeStore = inject(StoreStore);
  private readonly dashboard = inject(HotelDashboardService);
  private readonly searchBox = viewChild<ElementRef<HTMLInputElement>>('searchBox');

  readonly search = signal('');
  readonly category = signal<string>('all');
  readonly favourites = signal<string[]>(load(FAV_KEY));
  readonly recent = signal<string[]>(load(RECENT_KEY));
  readonly link = reportLink;
  readonly categories = REPORT_CATEGORIES;

  /** Live counts for the daily four. A failure just leaves the numbers out; the links still work. */
  private readonly live = rxResource({
    params: () => this.storeStore.selectedStore()?._id ?? '',
    stream: ({ params }) => (params ? this.dashboard.get(params).pipe(catchError(() => of(null))) : of(null)),
  });

  readonly daily = computed(() => {
    const k = this.live.hasValue() ? this.live.value()?.kpis : null;
    const rooms = this.live.hasValue() ? this.live.value()?.rooms : null;
    const figures: Record<string, { value: number | null; unit: string }> = {
      arrivals: { value: k ? k.arrivals.expected : null, unit: $localize`arriving today` },
      'in-house': { value: k ? k.inHouse.guests : null, unit: $localize`guests in the house` },
      departures: { value: k ? k.departures.due : null, unit: $localize`leaving today` },
      'room-status': { value: rooms ? rooms.dirty : null, unit: $localize`rooms need cleaning` },
    };
    return DAILY.map((id) => ({ meta: reportById(id)!, ...figures[id] }));
  });

  private match = (r: ReportMeta, needle: string) => !needle || (r.title + ' ' + r.description).toLowerCase().includes(needle);

  /** Everything that matches the search, before the category filter (so the rail can show honest counts). */
  private readonly searched = computed(() => {
    const needle = this.search().trim().toLowerCase();
    return REPORTS.filter((r) => this.match(r, needle));
  });
  readonly counts = computed(() => {
    const all = this.searched();
    return Object.fromEntries([['all', all.length], ...REPORT_CATEGORIES.map((c) => [c.id, all.filter((r) => r.category === c.id).length])]) as Record<string, number>;
  });
  readonly groups = computed(() => {
    const cat = this.category();
    return REPORT_CATEGORIES.filter((c) => cat === 'all' || c.id === cat)
      .map((c) => ({ ...c, reports: this.searched().filter((r) => r.category === c.id) }))
      .filter((g) => g.reports.length > 0);
  });
  readonly empty = computed(() => this.groups().length === 0);
  readonly shortcuts = computed(() => {
    const pinned = this.favourites().map((id) => ({ meta: reportById(id)!, pinned: true }));
    const recents = this.recent().filter((id) => !this.favourites().includes(id)).slice(0, 4).map((id) => ({ meta: reportById(id)!, pinned: false }));
    return [...pinned, ...recents].filter((s) => !!s.meta);
  });

  accent = (category: string) => ACCENTS[category] ?? FALLBACK;
  /** How a report behaves, so people know what they are opening. */
  kind(r: ReportMeta): string {
    return r.legacyLink ? $localize`Charts` : r.filters.includes('dateRange') ? $localize`By date` : $localize`Live`;
  }
  isFavourite(id: string) { return this.favourites().includes(id); }

  toggleFavourite(event: Event, id: string) {
    event.preventDefault();
    event.stopPropagation();
    const next = this.isFavourite(id) ? this.favourites().filter((f) => f !== id) : [...this.favourites(), id];
    this.favourites.set(next);
    try { localStorage.setItem(FAV_KEY, JSON.stringify(next)); } catch { /* private mode: it just will not be remembered */ }
  }

  onSearch(value: string) {
    this.search.set(value);
    if (value.trim() && this.category() !== 'all') this.category.set('all'); // searching looks everywhere
  }
  /** Enter opens the first match, so finding a report is type-and-go. */
  openFirst() {
    const first = this.groups()[0]?.reports[0];
    if (first) this.router.navigate(this.link(first));
  }

  /** "/" jumps to the search box from anywhere on the page, like every good command search. */
  @HostListener('document:keydown', ['$event'])
  focusOnSlash(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null;
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
    event.preventDefault();
    this.searchBox()?.nativeElement.focus();
  }
}
