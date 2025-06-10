export interface PermissionCategory {
  _id: string;
  name: string;
  description: string;
}

export interface Permission {
  _id: string;
  name: string;
  description: string;
  categoryId: PermissionCategory;
  action: string;
  resource: string;
}