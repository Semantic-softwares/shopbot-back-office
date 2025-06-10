
export enum UserRole {
  Owner = 'Owner',
  Admin = 'Admin',
  Waiter = 'Waiter',
  Cashier = 'Cashier',
  Courier = 'Courier'
}

export interface User {
  _id:string;
  photo: string;
  name: string;
  email: string;
  phoneNumber: string;
  gender: string;
  language: string;
  country: string;
  deleteAccount: boolean;
  address: string;
  password: string;
  phoneToken: string;
  loginCount: number;
  verifyPhoneNumber: boolean;
  allowNotifications:boolean;
  allowSalesNotifications: boolean;
  registered: string;
  notes: string;
  totalAmountSpent: number;
  avgAmountSpent: number;
  totalOrders: number;
  shipping: Shipping;
  pin: number;
  role?: string;
  ban?: boolean;
  store: string;
  phoneCredentials?: PhoneCredentials[]
}

export interface Shipping {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  isoCountryCode: string;
  locality: string;
  postalCode: string;
  administrativeArea: string;
  subAdministrativeArea: string;
  subLocality: string;
  subThoroughfare: string;
  thoroughfare: string;
}

export interface PhoneCredentials {
  token: string;
  os: string;
  make: string;
  model: string;
  deviceType: string;
  osVersion: string;
  sdkVersion: string;
  device: string;
  uuid: string;
  region: string;
  currentAppVersion: string;
}

