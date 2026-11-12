import { Component, Inject, OnInit, computed, inject, ChangeDetectionStrategy } from '@angular/core';

import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { forkJoin, of } from 'rxjs';
import { Category } from '../../../../../shared/models';
import { topLevel } from '../../../../../shared/category-tree';
import { MatIconModule } from '@angular/material/icon';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  MtxColorpickerModule,
  ColorFormat,
} from '@ng-matero/extensions/colorpicker';
import { MtxSelectModule } from '@ng-matero/extensions/select';
import { signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoryService } from '../../../../../shared/services/category.service';
import { StoreStore } from '../../../../../shared/stores/store.store';

@Component({
  selector: 'app-category-dialog',
  templateUrl: './category-dialog.component.html',
  styleUrls: ['./category-dialog.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    ReactiveFormsModule,
    FormsModule,
    MatSlideToggleModule,
    MtxColorpickerModule,
    MtxSelectModule,
    MatProgressSpinnerModule
],
})
export class CategoryDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  public storeStore = inject(StoreStore);
  public categoryForm = this.fb.group({
    _id: [''],
    name: ['', Validators.required],
    icon: ['Restaurant', Validators.required],
    color: ['', Validators.required],
    store: [this.storeStore.selectedStore()?._id, Validators.required],
    // The top-level category this one sits under; empty = a top-level category.
    parent: [null as string | null],
    published: [true],
  });
  private dialogRef = inject(MatDialogRef<CategoryDialogComponent>);
  public data: any = inject(MAT_DIALOG_DATA);
  public format: ColorFormat = 'hex';
  public icons = [
    { name: 'Smartphone', value: 'smartphone' },
    { name: 'Laptop', value: 'laptop' },
    { name: 'T-shirt', value: 'checkroom' },
    { name: 'Restaurant', value: 'restaurant' },
    { name: 'Shopping Bag', value: 'shopping_bag' },
    { name: 'Jewelry', value: 'diamond' },
    { name: 'Sports', value: 'sports_soccer' },
    { name: 'Books', value: 'menu_book' },
    { name: 'Home', value: 'home' },
    { name: 'Beauty', value: 'spa' },
  ];
  public isSubmitting = signal(false);
  /** Every category of the store, to offer as parents. */
  private readonly all = signal<Category[]>([]);
  /** Top-level categories this one may go under: never itself. */
  public readonly parentOptions = computed(() => topLevel(this.all()).filter((c) => c._id !== this.data?.category?._id));
  /** A category that has sub-categories cannot itself become a sub-category (two levels only). */
  public readonly hasChildren = (this.data?.category?.childCount ?? 0) > 0;
  /** Names typed in the "Add sub-categories" box, created together with this category. */
  public readonly subNames = signal<string[]>([]);
  public subDraft = '';
  private categoryService = inject(CategoryService);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    if (this.data.isEdit && this.data.category) {
      this.categoryForm.patchValue(this.data.category);
    }
    if (this.hasChildren) this.categoryForm.controls.parent.disable();
    if (this.data.asSub) this.categoryForm.controls.parent.addValidators(Validators.required);
    if (Array.isArray(this.data.all)) this.all.set(this.data.all);
    else this.categoryService.getStoreMenus(this.storeStore.selectedStore()?._id ?? '').subscribe({ next: (c) => this.all.set(c), error: () => undefined });
    // Opened from "Add sub-category" (or the product form): the parent is already chosen.
    if (!this.data.isEdit && this.data.parent) this.setParent(this.data.parent);
    this.categoryForm.controls.parent.valueChanges.subscribe((id) => this.setParent(id, false));
  }

  /** A new sub-category starts with its parent's colour and icon, until the user picks their own. */
  private setParent(id: string | null, patch = true): void {
    if (patch) this.categoryForm.controls.parent.setValue(id, { emitEvent: false });
    const parent = this.all().find((c) => c._id === id);
    if (parent && !this.data.isEdit && !this.categoryForm.controls.color.dirty) {
      this.categoryForm.patchValue({ color: parent.color ?? '', icon: parent.icon ?? 'restaurant' }, { emitEvent: false });
    }
    if (id) this.subNames.set([]); // only a top-level category takes sub-categories here
  }

  addSubName(event?: Event): void {
    event?.preventDefault();
    const names = this.subDraft.split(',').map((n) => n.trim()).filter(Boolean);
    if (!names.length) return;
    this.subNames.update((list) => [...list, ...names.filter((n) => !list.some((x) => x.toLowerCase() === n.toLowerCase()))]);
    this.subDraft = '';
  }

  removeSubName(name: string): void {
    this.subNames.update((list) => list.filter((n) => n !== name));
  }

  onSubmit(): void {
    if (this.categoryForm.valid) {
      this.isSubmitting.set(true);
      const formValue:any = this.categoryForm.getRawValue();
      if (!this.data.isEdit) {
        delete formValue?._id; // Remove _id for update
      }
      const request = this.data.isEdit
        ? this.categoryService.updateMenu(this.data.category._id, formValue)
        : this.categoryService.createMenu(formValue);

      request.subscribe({
        next: (category: any) => {
          this.createSubCategories(category, formValue).subscribe({
            next: () => {
              this.dialogRef.close(category);
              this.isSubmitting.set(false);
            },
            error: () => {
              // The category itself was saved; say which part failed so nothing is created twice by retrying.
              this.snackBar.open($localize`The category was saved, but some sub-categories could not be created. Add them from its row menu.`, $localize`Close`, { duration: 6000 });
              this.dialogRef.close(category);
              this.isSubmitting.set(false);
            },
          });
        },
        error: () => {
          this.snackBar.open($localize`Error saving category`, $localize`Close`, {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
          this.isSubmitting.set(false);
        },
      });
    }
  }

  /** Creates the sub-categories typed in the dialog under the category that was just saved. */
  private createSubCategories(parent: any, form: any) {
    this.addSubName();
    const names = this.subNames();
    const parentId = parent?._id ?? this.data?.category?._id;
    if (!names.length || !parentId) return of([]);
    return forkJoin(names.map((name, i) => this.categoryService.createMenu({ name, store: form.store, parent: parentId, color: form.color, icon: form.icon, activate: true, position: i } as any)));
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
