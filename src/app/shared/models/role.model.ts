import { Permission } from "./permission.model";

export interface Role {
  _id?: string;
  name: string;
  description?: string;
  permissions: Permission[]; // Array of populated permission objects
  isAdministrative: boolean; // Global roles not tied to any store
  store?: string; // Store ID - only for non-administrative roles
  isDefault?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissions?: string[]; // Array of permission IDs
  permissionCodes?: string[]; // Array of permission codes (alternative)
  store?: string; // Required for non-administrative roles
}

export interface CreateAdministrativeRoleDto {
  name: string;
  description?: string;
  permissions?: string[]; // Array of permission IDs
  permissionCodes?: string[]; // Array of permission codes (alternative)
}
