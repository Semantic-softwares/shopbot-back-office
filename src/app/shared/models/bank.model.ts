import { Store } from "./store.model";

export interface Bank {
    id: any;
    country: any;
    _id: string;

    store?: Store | string;

    bankName: string;

    name?: string;

    accountNumber: string;

    accountName: string;

    code: string;

    type: string;

    currency: string;

    currencyCode: string;

    bankId: string;

    recipient?: string;

}