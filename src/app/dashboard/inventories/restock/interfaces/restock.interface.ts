export interface RestockItem {
  productId: string;
  productName: string;
  currentQuantity: number;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  expiryDate?: Date;
  usesPricesAcrossStores?: boolean;
}

export interface RestockFormData {
  supplierId: string;
  invoiceReceiptNumber: string;
  orderNumber: string;
  invoiceReceiptDate: Date;
  items: RestockItem[];
}

export interface RestockResult {
  productId: string;
  success: boolean;
  updatedQuantity?: number;
  error?: string;
}
