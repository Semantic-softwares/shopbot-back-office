import { Component, input, output, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  Subject,
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  of,
  startWith,
} from 'rxjs';
import { RentalOwner } from '../../models/estate.model';
import { RentalOwnerService } from '../../services/rental-owner.service';
import { StoreStore } from '../../stores/store.store';

@Component({
  selector: 'app-rental-owner-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './rental-owner-search.component.html',
})
export class RentalOwnerSearchComponent implements OnInit, OnDestroy {
  placeholder = input<string>('Search by name, email or company...');
  label = input<string>('Search Rental Owner');
  initialValue = input<string>('');

  ownerSelected = output<RentalOwner>();
  searchCleared = output<void>();

  private rentalOwnerService = inject(RentalOwnerService);
  private storeStore = inject(StoreStore);
  private destroy$ = new Subject<void>();

  searchControl = new FormControl('');
  filteredOwners = signal<RentalOwner[]>([]);
  isLoading = signal<boolean>(false);

  ngOnInit(): void {
    this.initializeSearchControl();
  }

  private initializeSearchControl(): void {
    this.searchControl.valueChanges
      .pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((searchTerm) => {
          if (!searchTerm || searchTerm.length < 2) {
            this.filteredOwners.set([]);
            return of({ success: true, message: '', data: { items: [], meta: { page: 1, limit: 10, totalItems: 0, totalPages: 0 } } });
          }

          this.isLoading.set(true);
          const storeId = this.storeStore.selectedStore()?._id || '';
          return this.rentalOwnerService.getRentalOwners(storeId, {
            search: searchTerm,
            limit: 10,
          });
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (response) => {
          this.filteredOwners.set(response?.data?.items || []);
          this.isLoading.set(false);
        },
        error: () => {
          this.filteredOwners.set([]);
          this.isLoading.set(false);
        },
      });

    if (this.initialValue()) {
      this.searchControl.setValue(this.initialValue());
    }
  }

  getOwnerDisplayName(owner: RentalOwner): string {
    if (owner.isCompany && owner.companyName) {
      return owner.companyName;
    }
    return `${owner.firstName} ${owner.lastName}`;
  }

  onOwnerSelected(owner: RentalOwner): void {
    this.searchControl.setValue(this.getOwnerDisplayName(owner));
    this.ownerSelected.emit(owner);
  }

  onClear(): void {
    this.searchControl.setValue('');
    this.filteredOwners.set([]);
    this.searchCleared.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
