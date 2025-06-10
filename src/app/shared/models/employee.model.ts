export type EmployeeRole = 'Owner' | 'Cashier' | 'Waiter' | 'Admin' | 'Courier' | 'Kitchen';

export interface Employee {
  _id?: string;
  name: string;
  gender: 'Male' | 'Female';
  email: string;
  phoneNumber: string;
  pin: string;
  role: EmployeeRole;
}
