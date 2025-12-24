import { Role } from './role.model';

export type EmployeeRole = 'Owner' | 'Cashier' | 'Waiter' | 'Admin' | 'Courier' | 'Kitchen';

export interface Employee {
  _id?: string;
  name: string;
  gender?: 'male' | 'female' | 'other' | 'Male' | 'Female';
  email: string;
  phoneNumber: string;
  pin?: string;
  role?: Role | string; // Can be Role object (populated) or string (ObjectId)
  deactivate?: boolean;
  verified?: boolean;
  store?: string;
  additionalPermissions?: string[];
  deniedPermissions?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
