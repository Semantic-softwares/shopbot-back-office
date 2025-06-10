import { Store } from "./store.model";

export interface Station {
    _id: string;
    name: string;
    description: string;
    icon: string;
    color?: string; // Optional, since it has a default
    store: Store | string;
    createdAt?: Date;
    updatedAt?: Date;
}
