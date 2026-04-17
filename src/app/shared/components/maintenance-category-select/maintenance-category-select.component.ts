import { ChangeDetectionStrategy, Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { StoreStore } from '../../stores/store.store';
import { MaintenanceCategoryService } from '../../services/maintenance-category.service';

@Component({
  selector: 'app-maintenance-category-select',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>{{ label }}</mat-label>
      <mat-select [formControl]="control">
        @if (categoriesResource.isLoading()) {
          <mat-option disabled>Loading...</mat-option>
        } @else {
          @if (showNone) {
            <mat-option value="">None</mat-option>
          }
          @for (item of options(); track item.name) {
            <mat-option [value]="item.name">{{ item.name }}</mat-option>
          }
        }
      </mat-select>
      @if (showAdd) {
        <mat-hint align="end">
          <a class="text-blue-600 cursor-pointer text-xs hover:underline" role="button" tabindex="0"
            (click)="createCategory()" (keydown.enter)="createCategory()">
            Add category
          </a>
        </mat-hint>
      }
    </mat-form-field>
  `,
})
export class MaintenanceCategorySelectComponent {
  private dialog = inject(MatDialog);
  private storeStore = inject(StoreStore);
  private categoryService = inject(MaintenanceCategoryService);

  @Input({ required: true }) control!: FormControl<string | null>;
  @Input() label = 'Category';
  @Input() showNone = true;
  @Input() showAdd = true;

  categoriesResource = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id ?? '' }),
    stream: ({ params }) =>
      params.storeId ? this.categoryService.getAllActive(params.storeId) : of(undefined),
  });

  options = computed(() => this.categoriesResource.value()?.data ?? []);

  async createCategory(): Promise<void> {
    const { MaintenanceCategoryCreateDialogComponent } = await import(
      '../maintenance-category-create-dialog/maintenance-category-create-dialog.component'
    );
    const ref = this.dialog.open(MaintenanceCategoryCreateDialogComponent, {
      width: '480px',
      maxWidth: '96vw',
    });

    ref.afterClosed().subscribe((created) => {
      if (!created) return;
      this.categoriesResource.reload();
      if (created.name) {
        this.control.setValue(created.name);
      }
    });
  }
}
