import { Store } from "./store.model";

export interface TableCategory {
  _id: string;
  name: string;
  active: boolean;
  store: Store | string;
  }