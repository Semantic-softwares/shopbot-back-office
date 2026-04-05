export enum AgingBucket {
  BUCKET_0_30 = '0_30',
  BUCKET_31_60 = '31_60',
  BUCKET_61_90 = '61_90',
  BUCKET_90_PLUS = '90_PLUS',
}

export enum SortByField {
  TOTAL_OVERDUE_AMOUNT = 'totalOverdueAmount',
  OLDEST_INVOICE_DAYS = 'oldestInvoiceDays',
  OVERDUE_INVOICE_COUNT = 'overdueInvoiceCount',
  PROPERTY_NAME = 'propertyName',
  TENANT_NAME = 'tenantName',
  LEASE_NUMBER = 'leaseNumber',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export interface AgingBucketSummary {
  current0to30: number;
  days31to60: number;
  days61to90: number;
  days90Plus: number;
}

export interface ArrearsRow {
  leaseId: string;
  leaseNumber: string;
  tenantIds: string[];
  tenantNames: string[];
  propertyId: string;
  propertyName: string;
  unitId?: string;
  unitName?: string;
  totalOverdueAmount: number;
  overdueInvoiceCount: number;
  oldestInvoiceDate: Date;
  oldestInvoiceDays: number;
  agingBucketSummary: AgingBucketSummary;
  leaseStatus: string;
  propertyCategory: string;
  nextRecommendedAction?: string;
}

export interface PropertyWithHighestArrears {
  propertyId: string;
  propertyName: string;
  totalArrears: number;
}

export interface ArrearsSummary {
  totalOverdueAmount: number;
  overdueTenantCount: number;
  overdueLeaseCount: number;
  overdueInvoiceCount: number;
  oldestUnpaidInvoiceDate?: Date;
  oldestUnpaidInvoiceDays: number;
  propertyWithHighestArrears: PropertyWithHighestArrears;
}

export interface ArrearsAgingSummary {
  bucket0to30: number;
  bucket31to60: number;
  bucket61to90: number;
  bucket90Plus: number;
  total: number;
}

export interface TopArrearsProperty {
  propertyId: string;
  propertyName: string;
  totalArrears: number;
  overdueLeaseCount: number;
  overdueInvoiceCount: number;
}

export interface TopArrearsTenant {
  tenantId: string;
  tenantName: string;
  totalArrears: number;
  overdueLeaseCount: number;
  overdueInvoiceCount: number;
}

export interface ArrearsRowsResponse {
  items: ArrearsRow[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface ArrearsQueryParams {
  propertyId?: string;
  unitId?: string;
  tenantId?: string;
  leaseId?: string;
  minAmount?: number;
  maxAmount?: number;
  agingBucket?: AgingBucket;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: SortByField;
  sortOrder?: SortOrder;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
