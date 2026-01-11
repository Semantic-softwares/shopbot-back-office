import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { User } from '../../models';
import { CustomerService } from '../../services/customer.service';
import { StoreStore } from '../../stores/store.store';
import { CustomerDialogComponent } from '../../../menu/dashboard/customers/modals/customer-dialog.component';
import { debounceTime, Subject, switchMap, of, catchError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface CustomerSelectionDialogData {
  selectedCustomer: User | null;
}

export interface CustomerSelectionDialogResult {
  customer: User | null;
  action: 'select' | 'remove' | 'cancel';
}

@Component({
  selector: 'app-customer-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    FormsModule,
  ],
  templateUrl: './customer-selection-dialog.component.html',
  styleUrl: './customer-selection-dialog.component.scss'
})
export class CustomerSelectionDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<CustomerSelectionDialogComponent>);
  private dialogData: CustomerSelectionDialogData = inject(MAT_DIALOG_DATA);
  private customerService = inject(CustomerService);
  private storeStore = inject(StoreStore);
  private dialog = inject(MatDialog);

  selectedCustomer = signal<User | null>(this.dialogData?.selectedCustomer || null);
  
  // Search state
  searchQuery = signal('');
  customers = signal<User[]>([]);
  filteredCustomers = signal<User[]>([]);
  loading = signal(false);
  searchPerformed = signal(false);

  private searchSubject = new Subject<string>();

  constructor() {
    // Setup debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      switchMap(query => {
        if (!query || query.length < 2) {
          this.filteredCustomers.set([]);
          this.searchPerformed.set(false);
          return of([]);
        }
        
        this.loading.set(true);
        this.searchPerformed.set(true);
        const allCustomers = this.customers();
        
        // Filter locally if we have customers loaded
        if (allCustomers.length > 0) {
          const filtered = allCustomers.filter(c => 
            c.name?.toLowerCase().includes(query.toLowerCase()) ||
            c.email?.toLowerCase().includes(query.toLowerCase()) ||
            c.phoneNumber?.includes(query)
          );
          this.filteredCustomers.set(filtered);
          this.loading.set(false);
          return of(filtered);
        }
        
        return of([]);
      }),
      takeUntilDestroyed()
    ).subscribe();
  }

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    this.loading.set(true);
    this.customerService.getStoreCustomers(storeId).subscribe({
      next: (customers) => {
        this.customers.set(customers);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  onCustomerSelected(customer: User): void {
    this.selectedCustomer.set(customer);
  }

  removeCustomer(): void {
    this.selectedCustomer.set(null);
    this.dialogRef.close({ customer: null, action: 'remove' } as CustomerSelectionDialogResult);
  }

  confirmSelection(): void {
    this.dialogRef.close({ customer: this.selectedCustomer(), action: 'select' } as CustomerSelectionDialogResult);
  }

  openCreateCustomerDialog(): void {
    const dialogRef = this.dialog.open(CustomerDialogComponent, {
      width: '500px',
      data: { isEdit: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Reload customers after creation
        this.loadCustomers();
      }
    });
  }

  getCustomerDisplayName(customer: User | null): string {
    if (!customer) return '';
    return customer.name || customer.email || 'Unknown Customer';
  }

  getCustomerContact(customer: User | null): string {
    if (!customer) return '';
    return customer.email || customer.phoneNumber || 'No contact info';
  }
}
