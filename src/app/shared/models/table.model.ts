import { Store } from "./store.model";
import { TableCategory } from "./table-category.model";
import { Order } from "./order.model";

export interface Table  {
    _id: string;
    name: string;
    category: TableCategory | string | any;
    active: boolean;
    numberOfGuest: number;
    orderId?: string;
    store?: Store | null | string;
    order?: Order | null;
    storeId: string;
}