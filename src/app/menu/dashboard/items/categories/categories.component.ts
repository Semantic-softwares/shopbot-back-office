import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { CategoryDialogComponent } from './category-dialog/category-dialog.component';
import { rxResource } from '@angular/core/rxjs-interop';
import { CategoryService } from '../../../../shared/services/category.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { forkJoin } from 'rxjs';
import { Category } from '../../../../shared/models';
import { flatTree } from '../../../../shared/category-tree';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NoRecordComponent } from '../../../../shared/components/no-record/no-record.component';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    MatTableModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    NoRecordComponent,
    FormsModule,
    DragDropModule,
    PageHeaderComponent
]
})
export class CategoriesComponent {
  displayedColumns: string[] = ['drag', 'name', 'color', 'icon', 'items', 'actions'];
  readonly search = signal('');
  /** Top-level categories whose sub-categories are folded away. */
  readonly collapsed = signal<ReadonlySet<string>>(new Set());
  private dialog: MatDialog = inject(MatDialog);
  private categoryService = inject(CategoryService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);
  public categories = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id,
    }),
    stream: ({ params }) => this.categoryService.getStoreMenus(params.storeId!),
  });

  /** What the table shows: each category with its sub-categories under it, narrowed by the search and the folded groups. */
  readonly rows = computed(() => {
    const all = this.categories.hasValue() ? this.categories.value() : [];
    const q = this.search().trim().toLowerCase();
    const tree = flatTree(all);
    const byId = new Map(all.map((c) => [c._id, c]));
    const matches = (c: Category) => (c.name ?? '').toLowerCase().includes(q);
    if (q) {
      // A sub-category that matches shows under its parent; a parent that matches shows all of its sub-categories.
      return tree.filter(({ category: c, depth }) => {
        if (depth === 1) return matches(c) || matches(byId.get(c.parent!) ?? c);
        return matches(c) || all.some((k) => k.parent === c._id && matches(k));
      });
    }
    const folded = this.collapsed();
    return tree.filter(({ category: c, depth }) => depth === 0 || !folded.has(c.parent!));
  });

  applyFilter(event: Event) {
    this.search.set((event.target as HTMLInputElement).value);
  }

  toggle(category: Category) {
    this.collapsed.update((set) => {
      const next = new Set(set);
      if (!next.delete(category._id!)) next.add(category._id!);
      return next;
    });
  }

  addCategory() {
    this.openDialog({ isEdit: false });
  }

  /** The dialog opens with the parent already chosen. */
  addSubCategory(parent: Category) {
    this.openDialog({ isEdit: false, parent: parent._id });
  }

  onEditCategory(category: any) {
    this.openDialog({ isEdit: true, category });
  }

  private openDialog(data: any) {
    const dialogRef = this.dialog.open(CategoryDialogComponent, { width: '500px', data: { ...data, all: this.categories.hasValue() ? this.categories.value() : [] } });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.categories.reload();
    });
  }

  deleteCategory(category: Category) {
    if ((category.childCount ?? 0) > 0) {
      this.snackBar.open($localize`${category.name} has sub-categories. Move or delete them first.`, $localize`Close`, { duration: 5000 });
      return;
    }
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
      data: { message: $localize`Are you sure you want to delete ${category.name}?` }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.categoryService.deleteMenu(category._id!).subscribe({
          next: () => this.categories.reload(),
          error: (e) => this.snackBar.open(e?.error?.message || $localize`Could not delete the category.`, $localize`Close`, { duration: 5000 }),
        });
      }
    });
  }

  reloadCategories() {
    this.categories.reload();
  }

  /** Sorting happens among siblings only: top-level among top-level, a sub-category among its own parent's. */
  onDrop(event: CdkDragDrop<any[]>) {
    if (event.previousIndex === event.currentIndex) return;
    const shown = this.rows();
    const moved = shown[event.previousIndex]?.category;
    const target = shown[event.currentIndex]?.category;
    if (!moved || !target) return;
    const level = (c: Category) => c.parent ?? null;
    if (level(moved) !== level(target)) {
      this.snackBar.open($localize`Drag a category within its own level.`, $localize`Close`, { duration: 3000 });
      return;
    }
    const all = this.categories.value() ?? [];
    const siblings = all.filter((c) => level(c) === level(moved));
    const at = siblings.findIndex((c) => c._id === target._id);
    const reordered = siblings.filter((c) => c._id !== moved._id);
    reordered.splice(at, 0, moved);

    const changed = reordered.map((c, index) => ({ c, index })).filter(({ c, index }) => c.position !== index);
    const positions = new Map(reordered.map((c, index) => [c._id, index]));
    // Instant feedback: the list in its new order, then saved.
    this.categories.set(all.map((c) => (positions.has(c._id) ? { ...c, position: positions.get(c._id) } : c)).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)));
    if (!changed.length) return;
    forkJoin(changed.map(({ c, index }) => this.categoryService.updateMenu(c._id!, { position: index }))).subscribe({
      next: () => this.snackBar.open($localize`Categories sorted successfully`, $localize`Close`, { duration: 3000 }),
      error: () => {
        this.snackBar.open($localize`Failed to sort categories`, $localize`Close`, { duration: 3000 });
        this.categories.reload();
      },
    });
  }
}
