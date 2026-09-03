import { Store } from "./store.model";
import { TableCategory } from "./table-category.model";
import { Order } from "./order.model";

export interface Table  {
    _id: string;
    name: string;
    category: TableCategory | string | any;
    active: boolean;
    numberOfGuest: number;
    orderId?: string | Order | null | any;
    store?: Store | null | string;
    order?: Order | null;
    storeId: string;
    // Guest Wi-Fi shown on this table's self-order menu. Per-table because
    // larger venues run separate networks per area; a blank ssid means the
    // menu shows no Wi-Fi card at all.
    wifi?: {
        ssid?: string;
        password?: string;
    };
}