import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { StorefrontStore } from '../../data-access/storefront.store';
import { CartLineOption, StorefrontOptionGroup, StorefrontProduct } from '../../data-access/storefront.models';

export interface ProductDetailSheetData {
  product: StorefrontProduct;
  currency: string;
}

// groupId -> { optionItemId -> selected quantity }. A key's *presence* is
// what counts toward the group's atLeast/atMost (how many distinct choices
// were made — matches the POS's ProductOptionsComponent semantics); the
// quantity is a separate per-choice multiplier (e.g. "extra cheese x2"),
// only adjustable for multi-select groups.
type SelectionState = Record<string, Record<string, number>>;
const MAX_OPTION_QUANTITY = 10;

@Component({
  selector: 'app-storefront-product-detail-sheet',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, MatIconModule],
  templateUrl: './product-detail-sheet.component.html',
})
export class ProductDetailSheetComponent {
  private readonly sheetRef = inject(MatBottomSheetRef<ProductDetailSheetComponent>);
  private readonly store = inject(StorefrontStore);
  protected readonly data: ProductDetailSheetData = inject(MAT_BOTTOM_SHEET_DATA);

  protected readonly product = this.data.product;
  protected readonly quantity = signal(1);
  protected readonly notes = signal('');
  protected readonly selections = signal<SelectionState>({});

  protected readonly groupValidity = computed(() => {
    const sel = this.selections();
    const result: Record<string, boolean> = {};
    for (const group of this.product.options) {
      const count = Object.keys(sel[group._id] || {}).length;
      result[group._id] = count >= group.atLeast && count <= group.atMost;
    }
    return result;
  });

  protected readonly canAdd = computed(() => Object.values(this.groupValidity()).every(Boolean));

  protected readonly optionsTotal = computed(() => {
    const sel = this.selections();
    let total = 0;
    for (const group of this.product.options) {
      const groupSel = sel[group._id] || {};
      for (const item of group.options) {
        const qty = groupSel[item._id] || 0;
        total += item.price * qty;
      }
    }
    return total;
  });

  protected readonly unitPrice = computed(() => this.product.price + this.optionsTotal());
  protected readonly lineTotal = computed(() => this.unitPrice() * this.quantity());

  increment(): void {
    this.quantity.update((q) => q + 1);
  }

  decrement(): void {
    this.quantity.update((q) => Math.max(1, q - 1));
  }

  isSingleSelect(group: StorefrontOptionGroup): boolean {
    return group.atMost <= 1;
  }

  // Built from a dynamic combination of static text + numbers, so it can't
  // live as template markup an i18n attribute could wrap — $localize here is
  // the TS-side equivalent, still picked up by loadTranslations().
  groupBadgeLabel(group: StorefrontOptionGroup): string {
    if (group.atLeast === 0) {
      return $localize`:@@storefront.option.optional:Optional`;
    }
    if (this.isSingleSelect(group)) {
      return $localize`:@@storefront.option.required:Required`;
    }
    return $localize`:@@storefront.option.chooseRange:Choose ${group.atLeast}:min: to ${group.atMost}:max:`;
  }

  isSelected(group: StorefrontOptionGroup, itemId: string): boolean {
    return !!this.selections()[group._id]?.[itemId];
  }

  optionQuantity(group: StorefrontOptionGroup, itemId: string): number {
    return this.selections()[group._id]?.[itemId] || 0;
  }

  selectSingle(group: StorefrontOptionGroup, itemId: string): void {
    this.selections.update((sel) => ({ ...sel, [group._id]: { [itemId]: 1 } }));
  }

  /** Multi-select groups: tapping the row toggles it on/off at quantity 1 — the +/- stepper adjusts quantity once selected. */
  toggleMulti(group: StorefrontOptionGroup, itemId: string): void {
    this.selections.update((sel) => {
      const groupSel = { ...(sel[group._id] || {}) };
      if (groupSel[itemId]) {
        delete groupSel[itemId];
      } else {
        if (Object.keys(groupSel).length >= group.atMost) {
          return sel; // already at the group's limit on distinct choices
        }
        groupSel[itemId] = 1;
      }
      return { ...sel, [group._id]: groupSel };
    });
  }

  incrementOption(group: StorefrontOptionGroup, itemId: string, event: Event): void {
    event.stopPropagation();
    this.selections.update((sel) => {
      const groupSel = { ...(sel[group._id] || {}) };
      const current = groupSel[itemId] || 0;
      if (current === 0 && Object.keys(groupSel).length >= group.atMost) {
        return sel; // selecting this would exceed the group's distinct-choice limit
      }
      groupSel[itemId] = Math.min(MAX_OPTION_QUANTITY, current + 1);
      return { ...sel, [group._id]: groupSel };
    });
  }

  decrementOption(group: StorefrontOptionGroup, itemId: string, event: Event): void {
    event.stopPropagation();
    this.selections.update((sel) => {
      const groupSel = { ...(sel[group._id] || {}) };
      const current = groupSel[itemId] || 0;
      if (current <= 1) {
        delete groupSel[itemId]; // back to zero = deselected
      } else {
        groupSel[itemId] = current - 1;
      }
      return { ...sel, [group._id]: groupSel };
    });
  }

  addToOrder(): void {
    if (!this.canAdd()) return;

    const options: CartLineOption[] = [];
    const sel = this.selections();
    for (const group of this.product.options) {
      const groupSel = sel[group._id] || {};
      for (const item of group.options) {
        const qty = groupSel[item._id] || 0;
        if (qty > 0) {
          options.push({
            groupId: group._id,
            groupName: group.name,
            optionItemId: item._id,
            optionItemName: item.name,
            price: item.price,
            quantity: qty,
          });
        }
      }
    }

    this.store.addDetailedToCart(this.product, this.quantity(), options, this.notes());
    this.sheetRef.dismiss();
  }

  close(): void {
    this.sheetRef.dismiss();
  }
}
