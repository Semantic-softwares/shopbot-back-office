import { Permission } from "./permission.model";

export interface Role {
  _id?: string;
  name: string;
  description?: string;
  permissions: Permission[]; // Array of permission IDs
}
