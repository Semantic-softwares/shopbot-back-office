import { Store } from "./store.model";

export interface Printer {
    id: string;
    name: string;
    ipAddress: string;
    port: number;
    enabled: boolean;
    status?: 'online' | 'offline' | 'error';
    lastSeen?: Date;
}

export interface StationSettings {
    autoPrint: boolean;
    paperSize: '80mm' | '58mm';
    copiesPerOrder: number;
}

export interface Station {
    _id: string;
    name: string;
    description?: string;
    type: 'preparation' | 'bar' | 'pastry' | 'grill' | 'other';
    icon?: string;
    color?: string;
    store: Store | string;
    active: boolean;
    printers?: Printer[];
    settings?: StationSettings;
    createdAt?: Date;
    updatedAt?: Date;
}
