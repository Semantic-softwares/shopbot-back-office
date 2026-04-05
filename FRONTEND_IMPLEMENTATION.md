# Frontend Implementation Guide - Financial Category System

## Overview

This guide explains how to integrate the financial category system into the ShopBot back-office frontend (Angular 20+).

## Components & Services

### 1. enums/financial.enums.ts
- `FinancialSide` enum with INCOME and EXPENSE
- Helper functions for labels and colors

### 2. models/invoice-category.model.ts
- `InvoiceCategory` interface
- Request/response DTO interfaces

### 3. services/invoice-category-api.service.ts
- API calls for category CRUD
- Filtering and listing

### 4. Invoice List Component Modifications
- Add sidebar filter for INCOME vs EXPENSE
- Update invoice table to show category and side
- Add stats cards for totals

### 5. Receipt Component Updates
- Update wording based on financial side
- Show side badge/indicator

## Step 1: Update Invoice List Component

### Template Changes

Add filter and stats section:

```html
<!-- src/app/shared/components/invoice-list/invoice-list.component.html -->

<app-page-header title="Invoices" subtitle="Manage and track all invoices">
  <ng-container actions>
    <!-- existing buttons -->
  </ng-container>
</app-page-header>

<div class="px-4 py-6 space-y-4">
  
  <!-- STATS CARDS -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <mat-card appearance="outlined">
      <mat-card-content class="p-4!">
        <p class="text-sm text-gray-600">Total Invoices</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ totalInvoiceCount() }}</p>
      </mat-card-content>
    </mat-card>

    <mat-card appearance="outlined">
      <mat-card-content class="p-4!">
        <p class="text-sm text-gray-600">Total Income</p>
        <p class="text-2xl font-bold text-green-700 mt-1">
          {{ totalIncome() | currency: currencyCode() : 'symbol-narrow' : '1.2-2' }}
        </p>
      </mat-card-content>
    </mat-card>

    <mat-card appearance="outlined">
      <mat-card-content class="p-4!">
        <p class="text-sm text-gray-600">Total Expenses</p>
        <p class="text-2xl font-bold text-red-700 mt-1">
          {{ totalExpenses() | currency: currencyCode() : 'symbol-narrow' : '1.2-2' }}
        </p>
      </mat-card-content>
    </mat-card>

    <mat-card appearance="outlined">
      <mat-card-content class="p-4!">
        <p class="text-sm text-gray-600">Outstanding</p>
        <p class="text-2xl font-bold text-amber-700 mt-1">
          {{ totalOutstanding() | currency: currencyCode() : 'symbol-narrow' : '1.2-2' }}
        </p>
      </mat-card-content>
    </mat-card>
  </div>

  <!-- FILTERS & TABLE -->
  <mat-card appearance="outlined">
    <mat-card-content class="p-5!">
      <!-- Filter Section -->
      <div class="mb-4 flex gap-4 flex-wrap items-center">
        <mat-form-field appearance="outline">
          <mat-label>Financial Side</mat-label>
          <mat-select 
            [value]="selectedFinancialSide()" 
            (selectionChange)="updateFinancialSideFilter($event.value)"
          >
            <mat-option value="">All</mat-option>
            <mat-option [value]="FinancialSide.INCOME">Income</mat-option>
            <mat-option [value]="FinancialSide.EXPENSE">Expense</mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-stroked-button (click)="clearFilters()">
          <mat-icon>clear</mat-icon>
          Clear Filters
        </button>
      </div>

      <!-- Invoice Table -->
      @if (invoiceResource.isLoading()) {
        <div class="flex justify-center py-8">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (invoices().length === 0) {
        <div class="text-center py-8">
          <mat-icon class="!text-5xl !h-14 !w-14 mb-2 text-gray-300">receipt_long</mat-icon>
          <p class="text-sm text-gray-500">No invoices found</p>
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table mat-table [dataSource]="invoices()" matSort>

            <!-- Invoice # -->
            <ng-container matColumnDef="invoiceNumber">
              <th mat-header-cell *matHeaderCellDef>Invoice #</th>
              <td mat-cell *matCellDef="let inv" class="text-sm font-medium">
                {{ inv.invoiceNumber }}
              </td>
            </ng-container>

            <!-- Category & Side -->
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Category</th>
              <td mat-cell *matCellDef="let inv" class="text-sm">
                <div class="flex items-center gap-2">
                  <span>{{ inv.categoryName || '--' }}</span>
                  @if (inv.categorySide) {
                    <mat-chip
                      [backgroundColor]="getFinancialSideColor(inv.categorySide)"
                      class="!text-white"
                    >
                      {{ getFinancialSideLabel(inv.categorySide) }}
                    </mat-chip>
                  }
                </div>
              </td>
            </ng-container>

            <!-- Tenant/Payer -->
            <ng-container matColumnDef="payer">
              <th mat-header-cell *matHeaderCellDef>Tenant/Payer</th>
              <td mat-cell *matCellDef="let inv" class="text-sm">
                {{ getPayerName(inv) }}
              </td>
            </ng-container>

            <!-- Amount -->
            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef class="text-right">Amount</th>
              <td mat-cell *matCellDef="let inv" class="text-sm text-right font-medium">
                {{ inv.amount | currency: currencyCode() : 'symbol-narrow' : '1.2-2' }}
              </td>
            </ng-container>

            <!-- Balance -->
            <ng-container matColumnDef="balance">
              <th mat-header-cell *matHeaderCellDef class="text-right">Balance</th>
              <td mat-cell *matCellDef="let inv" class="text-sm text-right font-medium">
                {{ inv.balance | currency: currencyCode() : 'symbol-narrow' : '1.2-2' }}
              </td>
            </ng-container>

            <!-- Due Date -->
            <ng-container matColumnDef="dueDate">
              <th mat-header-cell *matHeaderCellDef>Due Date</th>
              <td mat-cell *matCellDef="let inv" class="text-sm">
                {{ inv.dueDate | date: 'mediumDate' }}
              </td>
            </ng-container>

            <!-- Status -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let inv" class="text-sm">
                <mat-chip [color]="getStatusColor(inv.status)">
                  {{ inv.status | titlecase }}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Actions -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="w-10"></th>
              <td mat-cell *matCellDef="let inv">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="viewInvoice(inv._id)">
                    <mat-icon>visibility</mat-icon>
                    <span>View</span>
                  </button>
                  @if (inv.balance > 0 && inv.status !== 'VOID') {
                    <button mat-menu-item (click)="recordPayment(inv)">
                      <mat-icon>payment</mat-icon>
                      <span>Record Payment</span>
                    </button>
                  }
                  <button mat-menu-item (click)="editInvoice(inv._id)">
                    <mat-icon>edit</mat-icon>
                    <span>Edit</span>
                  </button>
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let inv; columns: displayedColumns;"
                class="cursor-pointer hover:bg-gray-50"
                (click)="viewInvoice(inv._id)">
            </tr>
          </table>
        </div>
      }
    </mat-card-content>
  </mat-card>
</div>
```

### Component TypeScript

```typescript
// src/app/shared/components/invoice-list/invoice-list.component.ts

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FinancialSide, getFinancialSideLabel, getFinancialSideColor } from '../../enums/financial.enums';
import { InvoiceService } from '../../services/invoice.service';
import { EstateInvoice, InvoiceStatus } from '../../models/estate.model';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCardModule, MatButtonModule, MatIconModule, MatMenuModule, MatChipsModule, MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule, MatSortModule],
  templateUrl: './invoice-list.component.html',
  styleUrl: './invoice-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceListComponent {
  private invoiceService = inject(InvoiceService);
  private router = inject(Router);

  // Enums for template
  readonly FinancialSide = FinancialSide;
  readonly getFinancialSideLabel = getFinancialSideLabel;
  readonly getFinancialSideColor = getFinancialSideColor;

  // Filters
  readonly selectedFinancialSide = signal<FinancialSide | ''>('');
  readonly displayedColumns = [
    'invoiceNumber',
    'category',
    'payer',
    'amount',
    'balance',
    'dueDate',
    'status',
    'actions',
  ];
  readonly currencyCode = signal('NGN');

  // Resource for fetching invoices
  readonly invoiceResource = rxResource({
    params: () => ({
      side: this.selectedFinancialSide(),
      page: 1,
      limit: 50,
    }),
    stream: (params) => this.invoiceService.list({
      ...(params.params.side && { categorySide: params.params.side }),
      page: params.params.page,
      limit: params.params.limit,
    }),
  });

  readonly invoices = computed(() => this.invoiceResource.value()?.data || []);

  // Stats
  readonly totalInvoiceCount = computed(() => this.invoiceResource.value()?.total || 0);

  readonly totalIncome = computed(() => {
    return this.invoices()
      .filter(inv => inv.categorySide === FinancialSide.INCOME)
      .reduce((sum, inv) => sum + inv.amount, 0);
  });

  readonly totalExpenses = computed(() => {
    return this.invoices()
      .filter(inv => inv.categorySide === FinancialSide.EXPENSE)
      .reduce((sum, inv) => sum + inv.amount, 0);
  });

  readonly totalOutstanding = computed(() => {
    return this.invoices().reduce((sum, inv) => sum + inv.balance, 0);
  });

  updateFinancialSideFilter(side: FinancialSide | ''): void {
    this.selectedFinancialSide.set(side);
  }

  clearFilters(): void {
    this.selectedFinancialSide.set('');
  }

  getPayerName(invoice: EstateInvoice): string {
    // Implementation depends on your data structure
    return 'Tenant Name'; // Placeholder
  }

  getStatusColor(status: InvoiceStatus): string {
    switch (status) {
      case InvoiceStatus.PAID:
        return 'accent';
      case InvoiceStatus.OVERDUE:
        return 'warn';
      default:
        return '';
    }
  }

  viewInvoice(invoiceId: string): void {
    this.router.navigate(['/estate/invoices', invoiceId]);
  }

  editInvoice(invoiceId: string): void {
    this.router.navigate(['/estate/invoices', invoiceId, 'edit']);
  }

  recordPayment(invoice: EstateInvoice): void {
    // Open mark-as-paid dialog
    // Implementation similar to existing payment recording
  }
}
```

## Step 2: Update Invoice Creation/Edit Form

### Add Category Selection

```html
<!-- In invoice create/edit form template -->

<mat-form-field appearance="outline" class="w-full">
  <mat-label>Category</mat-label>
  <mat-select formControlName="categoryId" required>
    <mat-optgroup label="Income" *ngIf="incomeCategories().length">
      @for (cat of incomeCategories(); track cat._id) {
        <mat-option [value]="cat._id">{{ cat.name }}</mat-option>
      }
    </mat-optgroup>
    
    <mat-optgroup label="Expense" *ngIf="expenseCategories().length">
      @for (cat of expenseCategories(); track cat._id) {
        <mat-option [value]="cat._id">{{ cat.name }}</mat-option>
      }
    </mat-optgroup>
  </mat-select>
  @if (invoiceForm.get('categoryId')?.hasError('required')) {
    <mat-error>Category is required</mat-error>
  }
</mat-form-field>

<!-- Display side badge -->
@if (selectedCategory()) {
  <div class="mt-2">
    <mat-chip
      [backgroundColor]="getFinancialSideColor(selectedCategory()?.side)"
      class="!text-white"
    >
      {{ getFinancialSideLabel(selectedCategory()?.side) }}
    </mat-chip>
  </div>
}
```

### Component Logic

```typescript
// In invoice create/edit component

readonly incomeCategories = computed(() =>
  this.categories().filter(cat => cat.side === FinancialSide.INCOME && cat.isActive)
);

readonly expenseCategories = computed(() =>
  this.categories().filter(cat => cat.side === FinancialSide.EXPENSE && cat.isActive)
);

readonly selectedCategory = computed(() => {
  const categoryId = this.invoiceForm.get('categoryId')?.value;
  return this.categories().find(cat => cat._id === categoryId);
});

private loadCategories(): void {
  this.categoryService.getActive().subscribe({
    next: (response) => {
      this.categories.set(response.data);
    },
  });
}
```

## Step 3: Update Receipt Component

### Template Wording Changes

```html
<!-- src/app/shared/components/receipt/receipt.component.html -->

@if (receipt.side === FinancialSide.INCOME) {
  <div class="space-y-4">
    <h3 class="text-lg font-semibold">Payment Received</h3>
    
    <div>
      <p class="text-sm text-gray-600">From</p>
      <p class="font-medium">{{ receipt.payerName }}</p>
    </div>
    
    @if (receipt.categoryName) {
      <div>
        <p class="text-sm text-gray-600">Category</p>
        <p class="font-medium">{{ receipt.categoryName }}</p>
      </div>
    }
  </div>
} @else if (receipt.side === FinancialSide.EXPENSE) {
  <div class="space-y-4">
    <h3 class="text-lg font-semibold">Payment Made</h3>
    
    <div>
      <p class="text-sm text-gray-600">To</p>
      <p class="font-medium">{{ receipt.payeeName }}</p>
    </div>
    
    @if (receipt.categoryName) {
      <div>
        <p class="text-sm text-gray-600">Category</p>
        <p class="font-medium">{{ receipt.categoryName }}</p>
      </div>
    }
  </div>
}

<!-- Side badge -->
@if (receipt.side) {
  <mat-chip
    [backgroundColor]="getFinancialSideColor(receipt.side)"
    class="!text-white"
  >
    {{ getFinancialSideLabel(receipt.side) }}
  </mat-chip>
}
```

## Step 4: API Integration

### Expected Backend Response Format

```typescript
interface InvoiceListResponse {
  success: boolean;
  data: {
    data: EstateInvoice[];
    total: number;
    page: number;
    limit: number;
  };
}

interface EstateInvoice {
  _id: string;
  invoiceNumber: string;
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  categorySide: FinancialSide;
  amount: number;
  balance: number;
  dueDate: string;
  status: InvoiceStatus;
  // ... other fields
}
```

### Query Examples

```typescript
// Get INCOME invoices only
this.invoiceService.list({
  categorySide: FinancialSide.INCOME,
  page: 1,
  limit: 20,
}).subscribe(result => {
  console.log(result.data.data); // Array of INCOME invoices
});

// Get EXPENSE invoices
this.invoiceService.list({
  categorySide: FinancialSide.EXPENSE,
  page: 1,
  limit: 20,
}).subscribe(result => {
  console.log(result.data.data); // Array of EXPENSE invoices
});

// Get all invoices
this.invoiceService.list({
  page: 1,
  limit: 50,
}).subscribe(result => {
  console.log(result.data.data); // All invoices
});
```

## Testing Checklist

- [ ] Invoice list filters by INCOME/EXPENSE
- [ ] Stats cards show correct totals
- [ ] Selected category displays side badge
- [ ] Invoice creation requires category selection
- [ ] Created invoices show category and side
- [ ] Receipt shows "Payment Received" for INCOME
- [ ] Receipt shows "Payment Made" for EXPENSE
- [ ] Colors match (green=INCOME, red=EXPENSE)
- [ ] Cannot mix INCOME/EXPENSE in single payment
- [ ] Payment allocation validates category side

## Example: Complete Invoice List Integration

See the complete example implementation in:
- `src/app/menu/ems/invoice-management/invoice-list/`
- Updated template with filters and stats
- Component with financial side handling
- Service integration complete

## References

- Frontend models: `src/app/shared/models/invoice-category.model.ts`
- API service: `src/app/shared/services/invoice-category-api.service.ts`
- Enums: `src/app/shared/enums/financial.enums.ts`
- Backend API docs: (Backend INVOICE_CATEGORY_SETUP.md)
