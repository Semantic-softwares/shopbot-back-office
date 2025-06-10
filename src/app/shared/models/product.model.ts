import { Store } from './store.model';
import { Category } from './category.model';
import { Station } from './station.model';

export interface Product {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  photos?: string[];
  category: string | Category | any;
  menu?: string | Category | any;
  price: number;
  quantity: number;
  activate?: boolean;
  active?: boolean;
  created?: string;
  update?: string;
  position?: number;
  items?: number;
  color?: string;
  options?: Option[];
  store?: Store | string | any;
  featured: boolean;
  location?: any;
  units?: string;
  sku?: string;
  barcode?: string;
  costPrice?: number;
  profit?: number;
  initialStock?: number;
  criticalStockLevel?: number;
  stockLevelAlert?: boolean;
  qty?: number;
  station?: Station | string | any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Option {
  _id: string;
  name: string;
  atLeast: number;
  atMost: number;
  enabled: boolean;
  options: OptionItem[];
  store?: string;
  invalid?: boolean;
  products: string[];
}

export interface OptionItem {
  _id: string;
  name: string;
  price: number;
  inStock: boolean;
  option?: Option;
  quantity: number;
  selected: boolean;
  store?: any;
  createdAt?: Date;
  updatedAt?: Date;
}
