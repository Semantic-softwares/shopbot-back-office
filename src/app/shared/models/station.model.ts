import { Store } from "./store.model";

export interface PrinterConnection {
    ip?: string;
    port?: number;
    deviceName?: string;
    vendorId?: string;
    productId?: string;
    macAddress?: string;
}

export interface PrinterCapabilities {
    paperWidth: '58' | '80';
    supportsQr: boolean;
    supportsLogo: boolean;
    supportsCut: boolean;
}

export interface Printer {
    _id: string;
    name: string;
    store: string;
    connectionType: 'network' | 'usb-os' | 'usb-raw' | 'bluetooth';
    connection: PrinterConnection;
    role: 'station' | 'master' | 'backup';
    capabilities: PrinterCapabilities;
    status: 'online' | 'offline' | 'unknown';
    createdAt?: Date;
    updatedAt?: Date;
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
