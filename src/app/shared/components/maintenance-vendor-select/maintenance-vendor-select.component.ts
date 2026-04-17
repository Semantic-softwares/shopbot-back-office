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
import { MaintenanceVendorService } from '../../services/maintenance-vendor.service';

@Component({
  selector: 'app-maintenance-vendor-select',
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
        @if (vendorsResource.isLoading()) {
          <mat-option disabled>Loading...</mat-option>
        } @else {
          @if (showNone) {
            <mat-option value="">None</mat-option>
          }
          @for (vendor of options(); track vendor._id) {
            <mat-option [value]="vendor._id">{{ vendor.name }}</mat-option>
          }
        }
      </mat-select>
      @if (showAdd) {
        <mat-hint align="end">
          <a class="text-blue-600 cursor-pointer text-xs hover:underline" role="button" tabindex="0"
            (click)="createVendor()" (keydown.enter)="createVendor()">
            Add vendor
          </a>
        </mat-hint>
      }
    </mat-form-field>
  `,
})
export class MaintenanceVendorSelectComponent {
  private dialog = inject(MatDialog);
  private storeStore = inject(StoreStore);
  private vendorService = inject(MaintenanceVendorService);

  @Input({ required: true }) control!: FormControl<string | null>;
  @Input() label = 'Vendor';
  @Input() showNone = false;
  @Input() showAdd = true;

  vendorsResource = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id ?? '' }),
    stream: ({ params }) =>
      params.storeId
        ? this.vendorService.getAll(params.storeId, { isActive: 'true', limit: 300 })
        : of(undefined),
  });

  options = computed(() => this.vendorsResource.value()?.data?.items ?? []);

  async createVendor(): Promise<void> {
    const { MaintenanceVendorCreateDialogComponent } = await import(
      '../maintenance-vendor-create-dialog/maintenance-vendor-create-dialog.component'
    );
    const ref = this.dialog.open(MaintenanceVendorCreateDialogComponent, {
      width: '640px',
      maxWidth: '96vw',
    });

    ref.afterClosed().subscribe((created) => {
      if (!created) return;
      this.vendorsResource.reload();
      if (created._id) {
        this.control.setValue(created._id);
      }
    });
  }
}
