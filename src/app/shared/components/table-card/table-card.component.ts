import { Component, input, output, computed, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { Table, OrderCategoryType } from '../../models';
import { StoreStore } from '../../stores/store.store';

@Component({
  selector: 'app-table-card',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatChipsModule
  ],
  templateUrl: './table-card.component.html',
  styleUrl: './table-card.component.scss',
})
export class TableCardComponent {
  private readonly storeStore = inject(StoreStore);
  
  table = input.required<Table>();
  hideActions = input<boolean>(false);
  tableClick = output<Table>();
  addNewOrder = output<Table>();
  completeOrder = output<Table>();
  clearOrder = output<Table>();

  currency = computed(() => this.storeStore.selectedStore()?.currency || '₦');

  get isOrderCompleted(): boolean {
    return this.table().orderId?.category === OrderCategoryType.COMPLETE;
  }

  onTableClick(): void {
    this.tableClick.emit(this.table());
  }

  onAddNewOrder(): void {
    this.addNewOrder.emit(this.table());
  }

  onCompleteOrder(event: Event): void {
    event.stopPropagation();
    this.completeOrder.emit(this.table());
  }

  onClearOrder(event: Event): void {
    event.stopPropagation();
    this.clearOrder.emit(this.table());
  }
}
