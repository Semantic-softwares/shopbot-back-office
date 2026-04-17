export interface MaintenanceVendor {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: boolean;
  specialty?: string;
  category?: string;
  profileImage?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  store: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaintenanceVendorPayload {
  name: string;
  email?: string;
  phone?: string;
  company?: boolean;
  specialty?: string;
  category?: string;
  profileImage?: string;
  address?: string;
  notes?: string;
  createdBy?: string;
}

export interface UpdateMaintenanceVendorPayload {
  name?: string;
  email?: string;
  phone?: string;
  company?: boolean;
  specialty?: string;
  category?: string;
  profileImage?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

export interface MaintenanceVendorFilters {
  search?: string;
  isActive?: string;
  category?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MaintenanceCategoryItem {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  store: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaintenanceCategoryPayload {
  name: string;
  description?: string;
  icon?: string;
  createdBy?: string;
}

export interface UpdateMaintenanceCategoryPayload {
  name?: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
}

export interface MaintenanceCategoryFilters {
  search?: string;
  isActive?: string;
  page?: number;
  limit?: number;
}
