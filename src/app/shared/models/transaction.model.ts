import { Bank } from "./bank.model";
import { Order } from "./order.model";
import { Store } from "./store.model";
import { User } from "./user.model";


export interface Transaction {
    _id: string;

    store: Partial<Store>;

    orders: Order | string[];

    customer?: User | string;

    account?: Bank;

    totalAmount: number;

    type?: string;

    currency?: string;

    status: string;

    createdAt: string;

    reference?: string;

    remark: string;

    transactionType: string;

    updatedAt: string;


}

