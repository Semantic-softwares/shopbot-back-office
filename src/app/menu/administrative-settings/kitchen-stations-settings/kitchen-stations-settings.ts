import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StationsService } from '../../../shared/services/station.service';
import { KitchenDisplayService } from '../../../shared/services/kitchen-display.service';
import { StoreStore } from '../../../shared/stores/store.store';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import {
  KdsStatusCatalog,
  KdsStatusOption,
  Station,
  StationStatusStep,
  StationStatusStepInput,
} from '../../../shared/models';

const MIN_STEPS = 2;

interface StepDraft {
  key: string;
  label: string;
  shortcut: string | null;
}

interface StationDraft {
  id: string;
  name: string;
  type: string;
  steps: StepDraft[];
  saving: boolean;
}

// Edits Station.statusFlow via the existing generic PUT /stations/:id. The
// status list, allowed shortcut keys and default flow all come from
// GET /kitchen-display/statuses — nothing is hardcoded here. Admins can only
// reorder, remove/restore predefined statuses and assign F1–F12 shortcuts;
// the last step is always the terminal one (the backend enforces this too).
@Component({
  selector: 'app-kitchen-stations-settings',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
  ],
  templateUrl: './kitchen-stations-settings.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class KitchenStationsSettings implements OnInit {
  private stationsService = inject(StationsService);
  private kitchenDisplayService = inject(KitchenDisplayService);
  private snackBar = inject(MatSnackBar);
  public storeStore = inject(StoreStore);

  readonly minSteps = MIN_STEPS;

  loading = signal(true);
  stationDrafts = signal<StationDraft[]>([]);
  catalog = signal<KdsStatusCatalog | null>(null);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) {
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    forkJoin({
      catalog: this.kitchenDisplayService.getStatusCatalog(),
      stations: this.stationsService.getStations(storeId),
    }).subscribe({
      next: ({ catalog, stations }) => {
        this.catalog.set(catalog);
        this.stationDrafts.set(
          stations.map((s) => ({
            id: s._id,
            name: s.name,
            type: s.type,
            steps: this.toDrafts(s),
            saving: false,
          })),
        );
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Failed to load kitchen stations.', 'Close', { duration: 4000 });
      },
    });
  }

  // ---- mapping -------------------------------------------------------------

  private statusLabel(key: string): string | null {
    return this.catalog()?.statuses.find((s) => s.key === key)?.label ?? null;
  }

  /**
   * Turn a stored flow into editor rows. Keys not in the fixed list are
   * dropped (the backend ignores them too); invalid shortcuts are cleared.
   * An empty flow — or one left with fewer than 2 valid steps — shows the
   * backend default, which is what the KDS board actually uses.
   */
  private toSteps(flow: StationStatusStep[] | undefined | null): StepDraft[] {
    const allowedShortcuts = this.catalog()?.shortcutKeys ?? [];
    const seen = new Set<string>();
    const steps: StepDraft[] = [];
    for (const s of [...(flow ?? [])].sort((a, b) => a.order - b.order)) {
      const label = this.statusLabel(s.key);
      if (!label || seen.has(s.key)) continue;
      seen.add(s.key);
      steps.push({
        key: s.key,
        label,
        shortcut: s.shortcut && allowedShortcuts.includes(s.shortcut) ? s.shortcut : null,
      });
    }
    return steps;
  }

  private defaultSteps(): StepDraft[] {
    return this.toSteps(this.catalog()?.defaultFlow);
  }

  private toDrafts(station: Station): StepDraft[] {
    const steps = this.toSteps(station.statusFlow);
    return steps.length >= MIN_STEPS ? steps : this.defaultSteps();
  }

  // ---- editing -------------------------------------------------------------

  drop(stationId: string, event: CdkDragDrop<StepDraft[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    this.updateDraft(stationId, (draft) => {
      const steps = [...draft.steps];
      moveItemInArray(steps, event.previousIndex, event.currentIndex);
      return { ...draft, steps };
    });
  }

  moveStep(stationId: string, index: number, direction: -1 | 1): void {
    this.updateDraft(stationId, (draft) => {
      const target = index + direction;
      if (target < 0 || target >= draft.steps.length) return draft;
      const steps = [...draft.steps];
      moveItemInArray(steps, index, target);
      return { ...draft, steps };
    });
  }

  removeStep(stationId: string, index: number): void {
    this.updateDraft(stationId, (draft) => {
      if (draft.steps.length <= MIN_STEPS) return draft;
      return { ...draft, steps: draft.steps.filter((_, i) => i !== index) };
    });
  }

  /** Fixed statuses not currently in this station's flow. */
  restorableStatuses(draft: StationDraft): KdsStatusOption[] {
    const used = new Set(draft.steps.map((s) => s.key));
    return (this.catalog()?.statuses ?? []).filter((s) => !used.has(s.key));
  }

  /**
   * Put a removed predefined status back. It's inserted where it sits in the
   * backend's canonical order relative to the steps already present (e.g.
   * restoring "Preparing" lands between "New" and "Ready"), else appended.
   */
  restoreStatus(stationId: string, status: KdsStatusOption): void {
    const order = (this.catalog()?.statuses ?? []).map((s) => s.key);
    const rank = order.indexOf(status.key);
    this.updateDraft(stationId, (draft) => {
      if (draft.steps.some((s) => s.key === status.key)) return draft;
      const steps = [...draft.steps];
      const insertAt = steps.findIndex((s) => order.indexOf(s.key) > rank);
      const step: StepDraft = { key: status.key, label: status.label, shortcut: null };
      if (insertAt === -1) steps.push(step);
      else steps.splice(insertAt, 0, step);
      return { ...draft, steps };
    });
  }

  setShortcut(stationId: string, index: number, shortcut: string | null): void {
    this.updateDraft(stationId, (draft) => ({
      ...draft,
      steps: draft.steps.map((step, i) => (i === index ? { ...step, shortcut: shortcut || null } : step)),
    }));
  }

  /** True when `key` is already assigned to another row of the same station. */
  isShortcutTaken(draft: StationDraft, index: number, key: string): boolean {
    return draft.steps.some((s, i) => i !== index && s.shortcut === key);
  }

  isDuplicateShortcut(draft: StationDraft, index: number): boolean {
    const key = draft.steps[index]?.shortcut;
    return !!key && this.isShortcutTaken(draft, index, key);
  }

  resetToDefault(stationId: string): void {
    this.updateDraft(stationId, (draft) => ({ ...draft, steps: this.defaultSteps() }));
  }

  /** Inline validation message, or null when the flow can be saved. */
  validationError(draft: StationDraft): string | null {
    if (draft.steps.length < MIN_STEPS) {
      return `A status flow needs at least ${MIN_STEPS} steps.`;
    }
    const shortcuts = draft.steps.map((s) => s.shortcut).filter((s): s is string => !!s);
    const dupes = [...new Set(shortcuts.filter((s, i) => shortcuts.indexOf(s) !== i))];
    if (dupes.length) {
      return `Shortcut ${dupes.join(', ')} is used by more than one step. Each shortcut must be unique.`;
    }
    return null;
  }

  // ---- saving --------------------------------------------------------------

  save(stationId: string): void {
    const draft = this.stationDrafts().find((d) => d.id === stationId);
    if (!draft) return;

    const error = this.validationError(draft);
    if (error) {
      this.snackBar.open(error, 'Close', { duration: 4000 });
      return;
    }

    this.setSaving(stationId, true);

    const statusFlow: StationStatusStepInput[] = draft.steps.map((step) =>
      step.shortcut ? { key: step.key, shortcut: step.shortcut } : { key: step.key },
    );

    this.stationsService.updateStationStatusFlow(stationId, statusFlow).subscribe({
      next: (updated) => {
        this.updateDraft(stationId, (d) => ({ ...d, steps: this.toDrafts(updated), saving: false }));
        this.snackBar.open('Status flow saved.', 'Close', { duration: 3000 });
      },
      error: () => {
        this.setSaving(stationId, false);
        this.snackBar.open('Failed to save status flow.', 'Close', { duration: 4000 });
      },
    });
  }

  private setSaving(stationId: string, saving: boolean): void {
    this.updateDraft(stationId, (draft) => ({ ...draft, saving }));
  }

  private updateDraft(stationId: string, fn: (draft: StationDraft) => StationDraft): void {
    this.stationDrafts.update((drafts) => drafts.map((d) => (d.id === stationId ? fn(d) : d)));
  }

  getStationTypeLabel(type: string): string {
    const types: Record<string, string> = {
      preparation: 'Preparation',
      bar: 'Bar',
      pastry: 'Pastry',
      grill: 'Grill',
      other: 'Other',
    };
    return types[type] || type;
  }
}
