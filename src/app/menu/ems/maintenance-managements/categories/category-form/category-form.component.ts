import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { MaintenanceCategoryService } from '../../../../../shared/services/maintenance-category.service';

@Component({
  selector: 'app-category-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
  ],
  templateUrl: './category-form.component.html',
})
export class CategoryFormComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private storeStore = inject(StoreStore);
  private categoryService = inject(MaintenanceCategoryService);

  private categoryId = this.route.snapshot.paramMap.get('id');
  readonly isEditMode = computed(() => !!this.categoryId);
  readonly submitting = signal<boolean>(false);

  form = this.fb.group({
    name: ['', [Validators.required]],
    description: [''],
    icon: [''],
  });

  constructor() {
    this.loadEditData();
  }

  private loadEditData(): void {
    if (!this.categoryId) return;
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    this.categoryService.getById(storeId, this.categoryId).subscribe({
      next: (res) => {
        const c = res.data;
        this.form.patchValue({
          name: c.name,
          description: c.description ?? '',
          icon: c.icon ?? '',
        });
      },
      error: () => {
        this.snackBar.open('Failed to load category', 'Close', { duration: 4000 });
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/menu/ems/maintenance/categories']);
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    this.submitting.set(true);
    const raw = this.form.getRawValue();
    const payload = {
      name: raw.name ?? '',
      description: raw.description || undefined,
      icon: raw.icon || undefined,
    };

    const request$ = this.categoryId
      ? this.categoryService.update(storeId, this.categoryId, payload)
      : this.categoryService.create(storeId, payload);

    request$.subscribe({
      next: () => {
        const msg = this.categoryId ? 'Category updated' : 'Category created';
        this.snackBar.open(msg, 'Close', { duration: 3000 });
        this.goBack();
      },
      error: (error) => {
        const message = error?.error?.message || 'Failed to save category';
        this.snackBar.open(message, 'Close', { duration: 4000 });
        this.submitting.set(false);
      },
    });
  }
}
