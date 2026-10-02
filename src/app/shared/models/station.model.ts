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

/**
 * One step in a station's Kitchen Display status flow. Steps come from a
 * fixed, backend-defined list (GET /kitchen-display/statuses) — admins can
 * only reorder, remove/restore, and assign an optional F1–F12 `shortcut`.
 * `order` is the step's position; the backend always marks the last step
 * `isTerminal` (reaching it clears the ticket off the KDS board). An
 * empty/missing statusFlow on a station means "use the backend's defaultFlow".
 */
export interface StationStatusStep {
    key: string;
    label: string;
    order: number;
    isTerminal: boolean;
    shortcut?: string;
}

/** A status admins may place in a flow (from the backend's fixed list). */
export interface KdsStatusOption {
    key: string;
    label: string;
}

/** Response of GET /kitchen-display/statuses. */
export interface KdsStatusCatalog {
    statuses: KdsStatusOption[];
    shortcutKeys: string[];
    defaultFlow: StationStatusStep[];
}

/** Body item for PUT /stations/:id { statusFlow } — backend derives the rest. */
export interface StationStatusStepInput {
    key: string;
    shortcut?: string;
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
    statusFlow?: StationStatusStep[];
    createdAt?: Date;
    updatedAt?: Date;
}
