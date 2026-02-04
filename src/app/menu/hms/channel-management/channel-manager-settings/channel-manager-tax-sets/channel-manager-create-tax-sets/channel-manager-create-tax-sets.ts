import { ChangeDetectionStrategy, Component, OnInit, inject, signal, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PageHeaderComponent } from '../../../../../../shared/components/page-header/page-header.component';
import { TaxSet, TaxSetService } from '../../../../../../shared/services/tax-set.service';
import { RoomTypeRatePlanService, RoomTypeWithRatePlans } from '../../../../../../shared/services/room-type-rate-plan.service';
import { Tax } from '../../../../../../shared/services/tax.service';
import { StoreStore } from '../../../../../../shared/stores/store.store';
import { TaxSelectionModalComponent, TaxSelectionDialogData } from './tax-selection-modal/tax-selection-modal';

@Component({
  selector: 'app-channel-manager-create-tax-sets',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    DragDropModule,
    PageHeaderComponent,
  ],
  templateUrl: './channel-manager-create-tax-sets.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChannelManagerCreateTaxSets implements OnInit {
  private fb = inject(FormBuilder);
  private taxSetService = inject(TaxSetService);
  private roomTypeRatePlanService = inject(RoomTypeRatePlanService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private storeStore = inject(StoreStore);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  taxSetForm!: FormGroup;
  isSaving = false;
  isEditing = false;
  taxSetId: string | null = null;
  availableTaxes: any[] = [];
  roomTypesWithPlans = signal<RoomTypeWithRatePlans[]>([]);
  isLoadingRoomTypes = signal(false);

  ngOnInit() {
    this.initializeForm();
    this.loadRoomTypesAndRatePlans();
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if (params['id']) {
          this.isEditing = true;
          this.taxSetId = params['id'];
          this.loadTaxSet(params['id']);
        }
      });
  }

  private initializeForm() {
    const today = new Date();
    this.taxSetForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      currency: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
      taxes: this.fb.array([]),
      sell_date: [today],
      net_prices: this.fb.array([this.fb.control(100, [Validators.required, Validators.min(0)])]),
      associated_rate_plan_ids: [],
    });
  }

  private loadRoomTypesAndRatePlans() {
    const propertyId = this.storeStore.selectedStore()?.channex?.propertyId;
    if (!propertyId) {
      this.snackBar.open('Property ID not found', 'Close', { duration: 3000 });
      return;
    }

    this.isLoadingRoomTypes.set(true);
    this.roomTypeRatePlanService
      .getRoomTypesWithRatePlans(propertyId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.roomTypesWithPlans.set(data);
          this.isLoadingRoomTypes.set(false);
        },
        error: (error) => {
          this.isLoadingRoomTypes.set(false);
          const errorMessage = error.error?.message || 'Failed to load room types';
          this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
          console.error('Error loading room types:', error);
        },
      });
  }

  private loadTaxSet(id: string) {
    this.taxSetService
      .getTaxSet(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const taxSet = response.data?.attributes;
          if (taxSet) {
            this.taxSetForm.patchValue({
              title: taxSet.title,
              currency: taxSet.currency,
              associated_rate_plan_ids: taxSet.associated_rate_plan_ids || [],
            });
            
            // Populate taxes array
            const taxesArray = this.taxSetForm.get('taxes') as FormArray;
            if (taxSet.taxes && Array.isArray(taxSet.taxes)) {
              taxSet.taxes.forEach((tax: any, index: number) => {
                taxesArray.push(
                  this.fb.group({
                    id: [tax.id || tax, Validators.required],
                    level: [index, Validators.required],
                    title: [tax.title || '', Validators.required],
                    rate: [tax.rate || '0.00', Validators.required],
                  })
                );
              });
            }
          }
        },
        error: (error) => {
          const errorMessage = error.error?.message || 'Failed to load tax set';
          this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
          console.error('Error loading tax set:', error);
        },
      });
  }

  get taxesArray(): FormArray {
    return this.taxSetForm.get('taxes') as FormArray;
  }

  get taxesLength(): number {
    return this.taxesArray?.length ?? 0;
  }

  getTaxFormGroup(index: number): FormGroup | null {
    const control = this.taxesArray?.at(index);
    return control ? (control as FormGroup) : null;
  }

  getLevelControl(index: number) {
    const group = this.getTaxFormGroup(index);
    return group?.get('level') ?? null;
  }

  getTaxTitle(index: number): string {
    return this.getTaxFormGroup(index)?.get('title')?.value || '';
  }

  getTaxId(index: number): string {
    return this.getTaxFormGroup(index)?.get('id')?.value || '';
  }

  getTaxLevel(index: number): number {
    return this.getTaxFormGroup(index)?.get('level')?.value || 0;
  }

  addTax() {
    const selectedTaxIds = this.taxesArray.value.map((tax: any) => tax.id);
    const dialogData: TaxSelectionDialogData = {
      propertyId: this.storeStore.selectedStore()?.channex?.propertyId || '',
      selectedTaxIds,
    };

    this.dialog
      .open(TaxSelectionModalComponent, {
        data: dialogData,
        width: '400px',
        disableClose: false,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((selectedTax: Tax | null) => {
        if (selectedTax) {
          this.taxesArray.push(
            this.fb.group({
              id: [selectedTax.id, Validators.required],
              level: [this.taxesArray.length, Validators.required],
              title: [selectedTax.title, Validators.required],
              rate: [selectedTax.rate || '0.00', Validators.required],
            })
          );
          // Trigger change detection for OnPush strategy
          this.cdr.markForCheck();
          this.snackBar.open(`Tax "${selectedTax.title}" added successfully`, 'Close', {
            duration: 3000,
          });
        }
      });
  }

  removeTax(index: number) {
    this.taxesArray.removeAt(index);
    // Update levels for remaining taxes
    this.taxesArray.controls.forEach((control, idx) => {
      const group = control as FormGroup;
      group.get('level')?.setValue(idx);
    });
    this.cdr.markForCheck();
  }

  // Net Prices management
  get netPricesArray(): FormArray {
    return this.taxSetForm.get('net_prices') as FormArray;
  }

  addNetPrice() {
    this.netPricesArray.push(
      this.fb.control('', [Validators.required, Validators.min(0)])
    );
    this.cdr.markForCheck();
  }

  removeNetPrice(index: number) {
    this.netPricesArray.removeAt(index);
    this.cdr.markForCheck();
  }

  // Drag and drop sorting
  dropTax(event: CdkDragDrop<any[]>) {
    if (event.previousIndex !== event.currentIndex) {
      const taxes = this.taxesArray.value;
      const [movedTax] = taxes.splice(event.previousIndex, 1);
      taxes.splice(event.currentIndex, 0, movedTax);
      
      // Rebuild the form array with the new order and update levels
      this.taxesArray.clear();
      taxes.forEach((tax: any, index: number) => {
        this.taxesArray.push(
          this.fb.group({
            id: [tax.id, Validators.required],
            level: [index, Validators.required],
            title: [tax.title, Validators.required],
            rate: [tax.rate, Validators.required],
          })
        );
      });
      this.cdr.markForCheck();
    }
  }

  // Get tax rate by index
  getTaxRate(index: number): string {
    const id = this.getTaxId(index);
    // This will be populated when user selects the tax
    // For now, we need to store the rate when the tax is added
    return this.getTaxFormGroup(index)?.get('rate')?.value || '-';
  }

  // Handle rate plan checkbox changes
  onRatePlanCheckboxChange(ratePlanId: string, event: any) {
    const currentValue = this.taxSetForm.get('associated_rate_plan_ids')?.value || [];
    let updatedValue: string[];

    if (event.checked) {
      updatedValue = [...currentValue, ratePlanId];
    } else {
      updatedValue = currentValue.filter((id: string) => id !== ratePlanId);
    }

    this.taxSetForm.patchValue({ associated_rate_plan_ids: updatedValue });
  }

  // Check if a rate plan is selected
  isRatePlanSelected(ratePlanId: string): boolean {
    const selectedIds = this.taxSetForm.get('associated_rate_plan_ids')?.value || [];
    return selectedIds.includes(ratePlanId);
  }

  // Select/deselect all rate plans for a room type
  toggleRoomTypeRatePlans(roomType: RoomTypeWithRatePlans, selectAll: boolean) {
    const currentValue = this.taxSetForm.get('associated_rate_plan_ids')?.value || [];
    let updatedValue = [...currentValue];

    roomType.ratePlans.forEach((plan) => {
      if (selectAll) {
        if (!updatedValue.includes(plan.id)) {
          updatedValue.push(plan.id);
        }
      } else {
        updatedValue = updatedValue.filter((id) => id !== plan.id);
      }
    });

    this.taxSetForm.patchValue({ associated_rate_plan_ids: updatedValue });
  }

  // Check if all rate plans for a room type are selected
  isRoomTypeFullySelected(roomType: RoomTypeWithRatePlans): boolean {
    const selectedIds = this.taxSetForm.get('associated_rate_plan_ids')?.value || [];
    return roomType.ratePlans.length > 0 && roomType.ratePlans.every((plan) => selectedIds.includes(plan.id));
  }

  // Check if some rate plans for a room type are selected
  isRoomTypePartiallySelected(roomType: RoomTypeWithRatePlans): boolean {
    const selectedIds = this.taxSetForm.get('associated_rate_plan_ids')?.value || [];
    const selectedCount = roomType.ratePlans.filter((plan) => selectedIds.includes(plan.id)).length;
    return selectedCount > 0 && selectedCount < roomType.ratePlans.length;
  }

  // Check if all room types are fully selected
  areAllRoomTypesSelected(): boolean {
    return this.roomTypesWithPlans().every(rt => this.isRoomTypeFullySelected(rt));
  }

  // Check if some room types are partially selected
  areSomeRoomTypesPartiallySelected(): boolean {
    return this.roomTypesWithPlans().some(rt => this.isRoomTypePartiallySelected(rt)) && 
           !this.areAllRoomTypesSelected();
  }

  // Toggle all room types
  toggleAllRoomTypes(selectAll: boolean) {
    this.roomTypesWithPlans().forEach(rt => this.toggleRoomTypeRatePlans(rt, selectAll));
  }

  saveTaxSet() {
    if (!this.taxSetForm.valid) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.isSaving = true;
    const formValue = this.taxSetForm.getRawValue();
    const propertyId = this.storeStore.selectedStore()?.channex?.propertyId;

    const taxSetData: TaxSet = {
      ...formValue,
      property_id: propertyId,
      taxes: formValue.taxes.filter((tax: any) => tax.id), // Filter out empty entries
      associated_rate_plan_ids: formValue.associated_rate_plan_ids || [], // Already an array of IDs
    };

    const request = this.isEditing && this.taxSetId
      ? this.taxSetService.updateTaxSet(this.taxSetId, taxSetData)
      : this.taxSetService.createTaxSet(taxSetData);

    request
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSaving = false;
          const message = this.isEditing ? 'Tax set updated successfully' : 'Tax set created successfully';
          this.snackBar.open(message, 'Close', { duration: 3000 });
          this.cancel();
        },
        error: (error) => {
          this.isSaving = false;
          const errorMessage = error.error?.message || 'Failed to save tax set';
          this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
          console.error('Error saving tax set:', error);
        },
      });
  }

  cancel() {
    this.router.navigate(['../../list'], { relativeTo: this.route });
  }
}
