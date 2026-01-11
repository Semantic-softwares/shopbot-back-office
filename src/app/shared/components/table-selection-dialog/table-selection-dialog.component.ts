import { Component, inject, signal, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { TableService } from '../../services/table.service';
import { StoreStore } from '../../stores/store.store';
import { Table } from '../../models';
import { TableCardComponent } from '../table-card/table-card.component';
import { rxResource } from '@angular/core/rxjs-interop';
import { NoRecordComponent } from "../no-record/no-record.component";

export interface TableSelectionDialogData {
  selectedTable?: Table | null;
}

export interface TableSelectionDialogResult {
  action: 'select' | 'remove';
  table?: Table;
}

@Component({
  selector: 'app-table-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    FormsModule,
    TableCardComponent,
    NoRecordComponent
],
  templateUrl: './table-selection-dialog.component.html',
  styleUrl: './table-selection-dialog.component.scss',
})
export class TableSelectionDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<TableSelectionDialogComponent>);
  private readonly data = inject<TableSelectionDialogData>(MAT_DIALOG_DATA);
  private readonly tableService = inject(TableService);
  private readonly storeStore = inject(StoreStore);

  searchQuery = signal('');
  selectedTable = signal<Table | null>(this.data?.selectedTable || null);

  // Load tables using rxResource
  tablesResource = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()!._id }),
    stream: ( {params} ) => this.tableService.getStoreTables(params.storeId)
  });

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
  }

  // Computed property to filter and sort tables
  get filteredTables(): Table[] {
    const tables = this.tablesResource.value() || [];
    const query = this.searchQuery().toLowerCase();

    // Filter by search query
    const filtered = query 
      ? tables.filter(table => table.name.toLowerCase().includes(query))
      : tables;

    // Sort: free tables (no orderId) first, then occupied tables
    return filtered.sort((a, b) => {
      const aOccupied = !!a.orderId;
      const bOccupied = !!b.orderId;
      
      if (aOccupied === bOccupied) return 0;
      return aOccupied ? 1 : -1; // Free tables (no orderId) come first
    });
  }

  onTableSelect(table: Table): void {
    // Prevent selecting occupied tables
    if (table.orderId) {
      return;
    }
    
    const result: TableSelectionDialogResult = {
      action: 'select',
      table: table
    };
    this.dialogRef.close(result);
  }

  onRemoveSelection(): void {
    const result: TableSelectionDialogResult = {
      action: 'remove'
    };
    this.dialogRef.close(result);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
