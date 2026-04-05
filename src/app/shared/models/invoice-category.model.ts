import { FinancialSide } from '../enums/financial.enums';

export interface InvoiceCategory {
  _id: string;
  name: string;
  code: string;
  side: FinancialSide;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  allowOnLeaseTransactions: boolean;
  allowManualInvoiceCreation: boolean;
  store?: string | null;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateInvoiceCategoryParams {
  name: string;
  code: string;
  side: FinancialSide;
  description?: string;
  allowOnLeaseTransactions?: boolean;
  allowManualInvoiceCreation?: boolean;
}

export interface UpdateInvoiceCategoryParams {
  name?: string;
  side?: FinancialSide;
  description?: string;
  isActive?: boolean;
  allowOnLeaseTransactions?: boolean;
  allowManualInvoiceCreation?: boolean;
}

export interface ListInvoiceCategoriesParams {
  side?: FinancialSide;
  isSystem?: boolean;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface InvoiceCategoryListResponse {
  data: InvoiceCategory[];
  total: number;
  page: number;
  limit: number;
}
