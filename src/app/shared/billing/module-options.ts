import { ModuleKey } from '../models';

export interface ModuleOption {
  id: ModuleKey;
  label: string;
  description: string;
  icon: string;
}

/** The modules a person can switch on when creating a store. Every plan includes all of them; this only picks what starts switched on. */
export const MODULE_OPTIONS: ModuleOption[] = [
  { id: 'PMS', label: $localize`Hotel (HMS)`, description: $localize`Reservations, rooms, housekeeping and guest tracking`, icon: 'hotel' },
  { id: 'POS', label: $localize`Point of sale`, description: $localize`Sell at the counter, restaurant or bar, online or offline`, icon: 'point_of_sale' },
  { id: 'ERP', label: $localize`ERP and inventory`, description: $localize`Stock, suppliers, purchasing, receipts and reports`, icon: 'inventory_2' },
  { id: 'EMS', label: $localize`Estates (EMS)`, description: $localize`Leases, tenants, units and property invoicing`, icon: 'apartment' },
];
