import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  OnInit,
  effect,
  inject,
  Output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { AgingBucket, ArrearsQueryParams, SortByField, SortOrder } from '../../models/arrears.model';
import { Property, Unit } from '../../models/estate.model';
import { StoreStore } from '../../stores/store.store';
import { EstatePropertyService } from '../../services/estate-property.service';
import { EstateUnitService } from '../../services/estate-unit.service';
import { startWith } from 'rxjs';

@Component({
  selector: 'app-arrears-filters',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatExpansionModule,
    MatIconModule,
  ],
  templateUrl: './arrears-filters.component.html',
})
export class ArrearsFiltersComponent implements OnInit {
  @Output() filterChange = new EventEmitter<Partial<ArrearsQueryParams>>();

  protected readonly agingBucket = AgingBucket;
  protected readonly sortByField = SortByField;
  protected readonly sortOrder = SortOrder;

  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private propertyService = inject(EstatePropertyService);
  private unitService = inject(EstateUnitService);
  private storeStore = inject(StoreStore);

  private readonly reloadFilterDataOnStoreChange = effect(() => {
    const storeId = this.storeStore.selectedStore()?._id;
    if (storeId) {
      this.loadFilterData(storeId);
    }
  });

  protected properties = signal<Property[]>([]);
  protected units = signal<Unit[]>([]);
  protected isExpanded = signal<boolean>(false);

  protected selectedPropertyName = signal<string>('All Properties');
  protected selectedUnitName = signal<string>('All Units');

  filterForm!: FormGroup;

  ngOnInit(): void {
    this.initializeForm();
    this.setupFormValueChanges();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      search: [''],
      propertyId: [''],
      unitId: [''],
      agingBucket: [''],
      minAmount: [''],
      maxAmount: [''],
      dateFrom: [''],
      dateTo: [''],
      sortBy: [SortByField.OLDEST_INVOICE_DAYS],
      sortOrder: [SortOrder.DESC],
      limit: [20],
      page: [1],
    });
  }

  private loadFilterData(storeId: string): void {
    this.propertyService.getProperties(storeId).subscribe({
      next: (response) => this.properties.set(response.data.items),
    });

    this.unitService.getUnits(storeId).subscribe({
      next: (response) => this.units.set(response.data.items),
    });
  }

  private setupFormValueChanges(): void {
    this.filterForm
      .get('propertyId')
      ?.valueChanges.pipe(
        startWith(this.filterForm.get('propertyId')?.value),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((selectedId) => {
        const property = this.properties().find((item) => item._id === selectedId);
        this.selectedPropertyName.set(property?.name || 'All Properties');
      });

    this.filterForm
      .get('unitId')
      ?.valueChanges.pipe(
        startWith(this.filterForm.get('unitId')?.value),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((selectedId) => {
        const unit = this.units().find((item) => item._id === selectedId);
        this.selectedUnitName.set(unit?.name || 'All Units');
      });
  }

  applyFilters(): void {
    const formValue = this.filterForm.value;
    const filters: Partial<ArrearsQueryParams> = {
      search: formValue.search || undefined,
      propertyId: formValue.propertyId || undefined,
      unitId: formValue.unitId || undefined,
      agingBucket: formValue.agingBucket || undefined,
      minAmount: formValue.minAmount ? Number(formValue.minAmount) : undefined,
      maxAmount: formValue.maxAmount ? Number(formValue.maxAmount) : undefined,
      dateFrom: formValue.dateFrom,
      dateTo: formValue.dateTo,
      sortBy: formValue.sortBy,
      sortOrder: formValue.sortOrder,
      page: 1,
      limit: Number(formValue.limit),
    };

    this.filterChange.emit(filters);
    this.isExpanded.set(false);
  }

  resetFilters(): void {
    this.filterForm.reset({
      search: '',
      propertyId: '',
      unitId: '',
      agingBucket: '',
      minAmount: '',
      maxAmount: '',
      dateFrom: '',
      dateTo: '',
      sortBy: SortByField.OLDEST_INVOICE_DAYS,
      sortOrder: SortOrder.DESC,
      limit: 20,
      page: 1,
    });

    this.filterChange.emit({
      page: 1,
      limit: 20,
      sortBy: SortByField.OLDEST_INVOICE_DAYS,
      sortOrder: SortOrder.DESC,
    });

    this.isExpanded.set(false);
  }
}
