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

import { Guest } from '../../models/reservation.model';
import { GuestService } from '../../services/guest.service';
import { StoreStore } from '../../stores/store.store';

@Component({
  selector: 'app-guest-search',
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
  templateUrl: './guest-search.component.html',
  styleUrls: ['./guest-search.component.scss'],
})
export class GuestSearchComponent implements OnInit, OnDestroy {
  placeholder = input('Search for guest by name or email...');
  label = input('Select Guest');
  initialValue = input('');
  guestType = input<'single' | 'group' | null | undefined>(undefined);
  
  guestSelected = output<Guest>();
  searchCleared = output<void>();

  private guestService = inject(GuestService);
  private storeStore = inject(StoreStore);
  private destroy$ = new Subject<void>();

  // Component state
  guestSearchControl = new FormControl('');
  filteredGuests = signal<Guest[]>([]);
  isLoading = signal(false);

  ngOnInit() {
    this.initializeSearchControl();
  }

  private initializeSearchControl() {
    this.guestSearchControl.valueChanges
      .pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((searchTerm) => {
          if (!searchTerm || searchTerm.length < 2) {
            this.filteredGuests.set([]);
            return of({ guests: [], total: 0, page: 1, totalPages: 0 });
          }

          this.isLoading.set(true);
           const storeId = this.storeStore.selectedStore()?._id;
          return this.guestService.searchGuests(
            searchTerm,
            1,
            10,
            storeId,
            this.guestType()
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(
        (response) => {
          this.filteredGuests.set(response?.guests || []);
          this.isLoading.set(false);
        },
        (error) => {
          console.error('Error searching guests:', error);
          this.filteredGuests.set([]);
          this.isLoading.set(false);
        }
      );

    // Set initial value if provided
    if (this.initialValue()) {
      this.guestSearchControl.setValue(this.initialValue());
    }
  }

  onGuestSelected(guest: Guest) {
    this.guestSearchControl.setValue(`${guest?.firstName || guest?.companyName} ${guest?.lastName || guest?.contactPersonLastName}`);
    this.guestSelected.emit(guest);
  }

  displayGuestFn(guest: Guest): string {
    return guest ? `${guest.firstName} ${guest.lastName}` : '';
  }

  getGuestDisplayText(guest: Guest): string {
    return `${guest.firstName} ${guest.lastName} • ${guest.phone || 'No phone'}`;
  }

  onClear() {
    this.guestSearchControl.setValue('');
    this.filteredGuests.set([]);
    this.searchCleared.emit();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
