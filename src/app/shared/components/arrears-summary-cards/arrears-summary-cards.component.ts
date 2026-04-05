import { ChangeDetectionStrategy, Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ArrearsSummary } from '../../models/arrears.model';
import { CurrencyPipe } from '@angular/common';
import { StoreStore } from '../../stores/store.store';

@Component({
  selector: 'app-arrears-summary-cards',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, CurrencyPipe],
  templateUrl: './arrears-summary-cards.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArrearsSummaryCardsComponent {
  @Input() summary: ArrearsSummary | null = null;

  private readonly storeStore = inject(StoreStore);

  protected readonly currencyCode = computed(() => this.storeStore.selectedStore()?.currencyCode || 'NGN');
}
