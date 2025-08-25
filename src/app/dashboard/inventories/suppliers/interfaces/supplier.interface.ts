export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface Supplier {
  _id?: string;
  name: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  address?: Address;
  website?: string;
  description?: string;
  taxId?: string;
  paymentTerms?: string;
  creditLimit?: number;
  active: boolean;
  notes?: string;
  store: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSupplierDto {
  name: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  address?: Address;
  website?: string;
  description?: string;
  taxId?: string;
  paymentTerms?: string;
  creditLimit?: number;
  active?: boolean;
  notes?: string;
  store: string;
  createdBy: string;
}

export interface UpdateSupplierDto {
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: Address;
  website?: string;
  description?: string;
  taxId?: string;
  paymentTerms?: string;
  creditLimit?: number;
  active?: boolean;
  notes?: string;
}

export interface SuppliersResponse {
  suppliers: Supplier[];
  total: number;
  page: number;
  totalPages: number;
}
