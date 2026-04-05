import { ChangeDetectionStrategy, Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { InvoiceCategoryApiService } from '../../services/invoice-category-api.service';
import { FinancialSide } from '../../enums/financial.enums';
import { InvoiceCategoryCreateDialogComponent } from '../invoice-category-create-dialog/invoice-category-create-dialog.component';

@Component({
  selector: 'app-invoice-category-select',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './invoice-category-select.component.html',
  styleUrl: './invoice-category-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceCategorySelectComponent {
  private categoryApi = inject(InvoiceCategoryApiService);
  private dialog = inject(MatDialog);

  @Input({ required: true }) control!: FormControl<string | null>;
  @Input({ required: true }) label!: string;
  @Input() side?: FinancialSide;
  @Input() showAddCategory = true;
  @Input() lockSelection = false;
  @Input() allowAdd = true;
  @Input() allowLeaseOnly = true;

  canShowAdd = computed(() => this.allowAdd && this.showAddCategory);

  categoriesResource = rxResource({
    stream: () => this.categoryApi.getActive(),
  });

  options = computed(() => {
    const categories = this.categoriesResource.value()?.data || [];
    return categories.filter((item) => {
      if (this.allowLeaseOnly && !item.allowOnLeaseTransactions) return false;
      if (this.side && item.side !== this.side) return false;
      return true;
    });
  });

  createCategory(): void {
    if (!this.canShowAdd()) return;

    const ref = this.dialog.open(InvoiceCategoryCreateDialogComponent, {
      width: '560px',
      maxWidth: '96vw',
    });

    ref.afterClosed().subscribe((created) => {
      if (!created) return;
      this.categoriesResource.reload();
      if (created.code) {
        this.control.setValue(created.code);
      }
    });
  }
}
