import { computed, signal } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';

/** Sorting and paging for a report table whose rows arrive as a plain array. */
export class ReportTable<T extends Record<string, any>> {
  readonly sortKey = signal('');
  readonly sortDir = signal<'asc' | 'desc'>('desc');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  constructor(private readonly data: () => T[], defaultSort = '') {
    this.sortKey.set(defaultSort);
  }

  readonly sorted = computed(() => {
    const rows = [...this.data()];
    const key = this.sortKey();
    if (!key) return rows;
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    return rows.sort((a, b) => {
      const [x, y] = [a[key], b[key]];
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir;
      return String(x ?? '').localeCompare(String(y ?? '')) * dir;
    });
  });
  readonly rows = computed(() => {
    const last = Math.max(0, Math.ceil(this.sorted().length / this.pageSize()) - 1);
    const start = Math.min(this.pageIndex(), last) * this.pageSize();
    return this.sorted().slice(start, start + this.pageSize());
  });
  readonly total = computed(() => this.data().length);

  onSort(s: Sort) {
    this.sortKey.set(s.direction ? s.active : '');
    this.sortDir.set((s.direction || 'desc') as 'asc' | 'desc');
    this.pageIndex.set(0);
  }
  onPage(e: PageEvent) {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
  }
  /** Column totals for the footer row. */
  sum(key: string): number {
    return this.data().reduce((s, r) => s + (Number(r[key]) || 0), 0);
  }
}
