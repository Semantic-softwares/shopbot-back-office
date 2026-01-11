import { inject } from "@angular/core";
import { Station, Store } from "../models";
import { Category } from "../models/category.model";
import { StoreStore } from "../stores/store.store";



export class _Product {
    _id: string;
    name: string;
    handle: string;
    description: string;
    menu: Category | string | any;
    store: Store | string | any;
    station: Station | string | any;
    categories: Category;
    tags: string[];
    photos: any[];
    priceTaxExcl: number;
    price: number;
    priceTaxIncl: number;
    taxRate: number;
    comparedPrice: number;
    quantity: number;
    sku: string;
    width: string;
    height: string;
    depth: string;
    weight: string;
    extraShippingFee: number;
    active: boolean;
    options: any[];
    category: Category | string | any;
    position: number;
    items: number;
    color: string;
    costPrice: number;
    profit: number;
    initialStock: number;
    criticalStockLevel: number;
    stockLevelAlert: true;
    featured: boolean;
    units: string;
    barcode: string;
    qty: number;
    activityDateTime: Date | string;
    storeStore = inject(StoreStore)
    /**
     * Constructor
     *
     * @param product
     */
    constructor(product?:any)
    {
        product = product || {};
        this._id = product._id;
        this.name = product.name || '';
        this.menu = product.menu;
        this.store = product.store || this.storeStore.selectedStore()?._id;
        this.station = product.station || null;
        this.handle = product.handle;
        this.description = product.description || '';
        this.categories = product.categories || {};
        this.tags = product.tags || [];
        this.photos = product.photos || [];
        this.priceTaxExcl = product.priceTaxExcl || 0;
        this.priceTaxIncl = product.priceTaxIncl || 0;
        this.taxRate = product.taxRate || 0;
        this.costPrice = product.costPrice;
        this.profit = product.costPrice || 0;
        this.initialStock = product.initialStock || 0;
        this.stockLevelAlert = product.stockLevelAlert || true;
        this.comparedPrice = product.comparedPrice || 0;
        this.price =  product.price || 0;
        this.quantity = product.quantity || 0;
        this.sku = product.sku || 0;
        this.width = product.width || 0;
        this.height = product.height || 0;
        this.depth = product.depth || 0;
        this.weight = product.weight || 0;
        this.extraShippingFee = product.extraShippingFee || 0;
        this.active = product.active || true;
        this.options = product.options || [];
        this.category = product.category || null;
        this.position = product.position || 0;
        this.items = product.items || 0;
        this.color = product.color || '';
        this.criticalStockLevel = product.criticalStockLevel || 0;
        this.featured = product.featured || 0;
        this.units = product.units;
        this.barcode = product.barcode;
        this.qty = product.qty || 0;
        this.activityDateTime = product.activityDateTime || '';
    }

}