export enum PropertyCategory {
  SINGLE_UNIT = 'SINGLE_UNIT',
  MULTI_UNIT = 'MULTI_UNIT',
}

export enum PropertyType {
  ESTATE = 'ESTATE',
  APARTMENT_BUILDING = 'APARTMENT_BUILDING',
  VILLA = 'VILLA',
  OFFICE_BUILDING = 'OFFICE_BUILDING',
  COMMERCIAL = 'COMMERCIAL',
  HOUSE = 'HOUSE',
  OTHER = 'OTHER',
}

export enum PropertyStatus {
  ACTIVE = 'ACTIVE',
  OCCUPIED = 'OCCUPIED',
  INACTIVE = 'INACTIVE',
}

export enum UnitType {
  APARTMENT = 'APARTMENT',
  ROOM = 'ROOM',
  SHOP = 'SHOP',
  OFFICE = 'OFFICE',
  HOUSE = 'HOUSE',
  STUDIO = 'STUDIO',
  WAREHOUSE = 'WAREHOUSE',
  PARKING_SPACE = 'PARKING_SPACE',
  STORAGE = 'STORAGE',
  GARAGE = 'GARAGE',
  OTHER = 'OTHER',
}

/** Unit types that are non-livable — no beds/baths/size fields */
export const NON_LIVABLE_UNIT_TYPES: UnitType[] = [
  UnitType.PARKING_SPACE,
  UnitType.STORAGE,
  UnitType.GARAGE,
  UnitType.WAREHOUSE,
  UnitType.SHOP,
];

export enum UnitStatus {
  VACANT = 'VACANT',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  INACTIVE = 'INACTIVE',
}

export enum FurnishingStatus {
  FURNISHED = 'FURNISHED',
  SEMI_FURNISHED = 'SEMI_FURNISHED',
  UNFURNISHED = 'UNFURNISHED',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
}

export enum SizeUnit {
  SQM = 'SQM',
  SQFT = 'SQFT',
}

export interface PropertyAddress {
  country: string;
  state: string;
  city: string;
  area?: string;
  street?: string;
  postalCode?: string;
  formattedAddress?: string;
}

export interface GeoLocation {
  type?: string;
  coordinates?: number[]; // [longitude, latitude]
}

export interface PropertyOwner {
  owner: string | RentalOwner;
  ownershipPercentage: number;
}

export interface Property {
  _id: string;
  name: string;
  code?: string;
  category: PropertyCategory;
  type: PropertyType;
  description?: string;
  address: PropertyAddress;
  location?: GeoLocation;
  totalUnits: number;
  status: PropertyStatus;
  coverPhoto?: string;
  gallery: string[];
  amenities: string[];
  features: string[];
  photos: string[];
  attachments: string[];
  // Single-unit fields
  bedrooms?: number;
  bathrooms?: number;
  sizeValue?: number;
  sizeUnit?: string;
  marketRent?: number;
  deposit?: number;
  currency?: string;
  yearBuilt?: number;
  store: string;
  propertyManager?: string | { _id: string; name: string };
  owners?: PropertyOwner[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface InlineUnit {
  name: string;
  type: UnitType;
  bedrooms?: number;
  bathrooms?: number;
  sizeValue?: number;
  sizeUnit?: SizeUnit;
  rentAmount: number;
  deposit?: number;
  isAffordableHousing?: boolean;
  furnishingStatus?: FurnishingStatus;
}

export interface Unit {
  _id: string;
  property: string | Property;
  name: string;
  code?: string;
  type: UnitType;
  description?: string;
  floor?: string;
  bedrooms?: number;
  bathrooms?: number;
  sizeValue?: number;
  sizeUnit?: SizeUnit;
  rentAmount: number;
  deposit?: number;
  currency: string;
  status: UnitStatus;
  furnishingStatus: FurnishingStatus;
  isAffordableHousing?: boolean;
  amenities: string[];
  features: string[];
  coverPhoto?: string;
  gallery: string[];
  photos: string[];
  attachments: string[];
  store: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: {
    items: T[];
    meta: PaginationMeta;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PropertySummary {
  total: number;
  active: number;
  inactive: number;
}

export interface UnitSummary {
  total: number;
  vacant: number;
  occupied: number;
  reserved: number;
  inactive: number;
}

export enum RentalOwnerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface RentalOwner {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  isCompany: boolean;
  companyName?: string;
  taxId?: string;
  notes?: string;
  coverPhoto?: string;
  attachments: string[];
  status: RentalOwnerStatus;
  store: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface RentalOwnerSummary {
  total: number;
  active: number;
  inactive: number;
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum LeasePropertyCategory {
  SINGLE_UNIT = 'SINGLE_UNIT',
  MULTI_UNIT = 'MULTI_UNIT',
}

export enum LeaseType {
  FIXED_TERM = 'FIXED_TERM',
  MONTH_TO_MONTH = 'MONTH_TO_MONTH',
}

export enum BillingFrequency {
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export enum LeaseStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  TERMINATED = 'TERMINATED',
  CANCELLED = 'CANCELLED',
}

export enum UtilityResponsibleParty {
  LANDLORD = 'LANDLORD',
  TENANT = 'TENANT',
}

export enum UtilityType {
  ELECTRICITY = 'ELECTRICITY',
  WATER = 'WATER',
  GAS = 'GAS',
  INTERNET = 'INTERNET',
  CABLE_SATELLITE = 'CABLE_SATELLITE',
  WASTE = 'WASTE',
  SEWER = 'SEWER',
  SECURITY = 'SECURITY',
  OTHER = 'OTHER',
}

export enum VehicleType {
  CAR = 'CAR',
  MOTORCYCLE = 'MOTORCYCLE',
  TRUCK = 'TRUCK',
  VAN = 'VAN',
  SUV = 'SUV',
  BUS = 'BUS',
  OTHER = 'OTHER',
}

export enum PetType {
  DOG = 'DOG',
  CAT = 'CAT',
  BIRD = 'BIRD',
  FISH = 'FISH',
  RABBIT = 'RABBIT',
  REPTILE = 'REPTILE',
  OTHER = 'OTHER',
}

export interface Vehicle {
  _id: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  licensePlate?: string;
  stateOfRegistration?: string;
  vin?: string;
  type: VehicleType;
  notes?: string;
  tenant?: string;
  store: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pet {
  _id: string;
  name: string;
  type: PetType;
  breed?: string;
  color?: string;
  weight?: number;
  age?: number;
  vaccinated: boolean;
  licensed: boolean;
  licenseNumber?: string;
  notes?: string;
  tenant?: string;
  store: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyContact {
  name: string;
  email?: string;
  phoneNumber: string;
  relationship?: string;
}

export interface Tenant {
  _id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  /** Multiple phone numbers; first entry is the primary phone */
  phoneNumbers: string[];
  dateOfBirth?: string;
  forwardingAddress?: string;
  emergencyContacts: EmergencyContact[];
  pets: Pet[] | string[];
  vehicles: Vehicle[] | string[];
  isCompany: boolean;
  companyName?: string;
  notes?: string;
  coverPhoto?: string;
  attachments: string[];
  status: TenantStatus;
  store: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface TenantSummary {
  total: number;
  active: number;
  inactive: number;
}

export interface LeaseUtilityResponsibility {
  utilityType: UtilityType;
  customUtilityName?: string;
  responsibleParty: UtilityResponsibleParty;
}

// ── New Lease Transaction types ──────────────────────────────────

export enum LeaseInvoicingType {
  INDIVIDUAL = 'INDIVIDUAL',
  JOINT = 'JOINT',
}

export enum RentDueDateRule {
  SAME_DAY_AS_FIRST_RENT_DATE = 'SAME_DAY_AS_FIRST_RENT_DATE',
  FIRST_DAY_OF_MONTH = 'FIRST_DAY_OF_MONTH',
  LAST_DAY_OF_MONTH = 'LAST_DAY_OF_MONTH',
  CUSTOM_DAY_OF_MONTH = 'CUSTOM_DAY_OF_MONTH',
}

export enum DepositCategory {
  DEPOSIT = 'DEPOSIT',
  LAST_MONTHS_RENT = 'LAST_MONTHS_RENT',
  PET_DEPOSIT = 'PET_DEPOSIT',
  KEY_DEPOSIT = 'KEY_DEPOSIT',
  OTHER = 'OTHER',
}

export enum LateFeeType {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
}

export interface TenantShare {
  tenantId: string;
  amount: number;
}

export interface RecurringRentConfig {
  enabled: boolean;
  accountCode?: string;
  firstRentDate?: string;
  dueDateRule?: RentDueDateRule;
  frequency?: BillingFrequency;
  totalAmount: number;
  markPastInvoicesAsPaid?: boolean;
  tenantShares: TenantShare[];
}

export interface DepositConfig {
  category: DepositCategory;
  accountCode?: string;
  invoiceDate: string;
  totalAmount: number;
  tenantShares: TenantShare[];
  memo?: string;
}

export interface OtherLeaseTransaction {
  title: string;
  account: string;
  amount: number;
  dueDate: string;
  frequency?: BillingFrequency | null;
  memo?: string;
}

export interface LateFeeRule {
  enabled: boolean;
  feeType: LateFeeType;
  value: number;
}

export interface LateFeeSettings {
  enabled: boolean;
  gracePeriodDays: number;
  gracePeriodTime?: string;
  oneTimeLateFee?: LateFeeRule;
  dailyLateFee?: LateFeeRule;
}

export interface LeaseTransactions {
  invoicingType?: LeaseInvoicingType;
  recurringRent: RecurringRentConfig;
  deposits: DepositConfig[];
  otherTransactions: OtherLeaseTransaction[];
  lateFeeSettings?: LateFeeSettings;
}

export interface Lease {
  _id: string;
  leaseNumber: string;
  tenantIds: Array<string | Tenant>;
  propertyId: string | Property;
  unitId?: string | Unit | null;
  propertyCategory: LeasePropertyCategory;
  leaseType: LeaseType;
  startDate: string;
  endDate?: string | null;
  currency: string;
  notes?: string;
  status: LeaseStatus;
  endedAt?: string | null;
  endReason?: string;
  moveOutDate?: string | null;
  utilityResponsibilities: LeaseUtilityResponsibility[];
  leaseTransactions: LeaseTransactions;
  store: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface EndLeasePayload {
  effectiveEndDate: string;
  reason?: string;
  moveOutDate?: string;
  notes?: string;
}

export interface LeaseCloseoutInvoice {
  id: string;
  invoiceNumber: string;
  category: string;
  payerName: string;
  dueDate: string;
  total: number;
  paid: number;
  balance: number;
  status: InvoiceStatus;
}

export interface LeaseDepositSummary {
  totalDepositCollected: number;
  totalDepositExpected?: number;
  totalDepositRefunded?: number;
  isFullyCollected?: boolean;
  availableDepositAmount: number;
}

export interface LeaseCloseoutLeaseSummary {
  id: string;
  leaseNumber: string;
  propertyName: string;
  unitName: string;
  leaseType: LeaseType;
  invoicingType?: LeaseInvoicingType;
  startDate: string;
  endDate?: string | null;
  tenants: Array<{
    id: string;
    name: string;
  }>;
}

export interface LeaseCloseoutSummary {
  lease: LeaseCloseoutLeaseSummary;
  unpaidInvoices: LeaseCloseoutInvoice[];
  totalOutstanding: number;
  depositSummary: LeaseDepositSummary;
}

// ── Invoice types ──────────────────────────────────────────────────

export enum InvoiceType {
  RENT = 'RENT',
  DEPOSIT = 'DEPOSIT',
  RECURRING_CHARGE = 'RECURRING_CHARGE',
  ONE_TIME_CHARGE = 'ONE_TIME_CHARGE',
  LATE_FEE = 'LATE_FEE',
}

export enum InvoiceStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  VOID = 'VOID',
}

export enum InvoiceSource {
  LEASE_CREATION = 'LEASE_CREATION',
  ACTIVATION = 'ACTIVATION',
  SCHEDULER = 'SCHEDULER',
  MANUAL = 'MANUAL',
}

export interface EstateInvoice {
  _id: string;
  invoiceNumber: string;
  leaseId: string | Lease;
  tenantIds: Array<string | Tenant>;
  tenantId?: string | Tenant | null;
  propertyId: string | Property;
  unitId?: string | Unit | null;
  title: string;
  description?: string;
  type: InvoiceType;
  issueDate: string;
  dueDate: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  amount: number;
  amountPaid: number;
  balance: number;
  currency: string;
  status: InvoiceStatus;
  source: InvoiceSource;
  metadata?: Record<string, any>;
  categoryCode?: string | null;
  categorySide?: 'INCOME' | 'EXPENSE' | null;
  store: string;
  createdBy?:
    | string
    | {
        _id?: string;
        name?: string;
        email?: string;
      };
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateManualInvoiceRequest {
  leaseId: string;
  tenantId?: string;
  title: string;
  description?: string;
  type?: InvoiceType;
  dueDate: string;
  amount: number;
  categoryCode?: string;
  categorySide?: 'INCOME' | 'EXPENSE';
  metadata?: Record<string, unknown>;
}

export interface InvoiceSummary {
  outstanding: number;
  paid: number;
  overdue: number;
}

export interface InvoiceFilters {
  page?: number;
  limit?: number;
  search?: string;
  leaseId?: string;
  propertyId?: string;
  unitId?: string;
  tenantId?: string;
  type?: InvoiceType;
  status?: InvoiceStatus;
  dueDateFrom?: string;
  dueDateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export enum PaymentStatus {
  UNALLOCATED = 'UNALLOCATED',
  PARTIALLY_ALLOCATED = 'PARTIALLY_ALLOCATED',
  COMPLETED = 'COMPLETED',
  REVERSED = 'REVERSED',
}

export enum EstatePaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CARD = 'CARD',
  ONLINE = 'ONLINE',
  OTHER = 'OTHER',
}

export enum PaymentSource {
  MANUAL = 'MANUAL',
  IMPORTED = 'IMPORTED',
  ONLINE = 'ONLINE',
}

export interface PaymentAllocation {
  _id: string;
  paymentId: string;
  invoiceId: string | EstateInvoice;
  allocatedAmount: number;
  allocationDate: string;
  store: string;
  createdAt: string;
  updatedAt: string;
}

export interface EstatePayment {
  _id: string;
  paymentNumber: string;
  leaseId: string | Lease;
  tenantIds: Array<string | Tenant>;
  tenantId?: string | Tenant | null;
  propertyId: string | Property;
  unitId?: string | Unit | null;
  totalAmount: number;
  allocatedAmount: number;
  unallocatedAmount: number;
  currency: string;
  paymentDate: string;
  paymentMethod: EstatePaymentMethod;
  reference?: string;
  note?: string;
  status: PaymentStatus;
  source: PaymentSource;
  financialSide?: 'INCOME' | 'EXPENSE' | 'MIXED' | null;
  store: string;
  createdBy?:
    | string
    | {
        _id?: string;
        name?: string;
        email?: string;
      };
  allocations?: PaymentAllocation[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreatePaymentRequest {
  leaseId: string;
  tenantId?: string;
  totalAmount: number;
  paymentDate: string;
  paymentMethod: EstatePaymentMethod;
  reference?: string;
  note?: string;
  source?: PaymentSource;
  allocations?: Array<{
    invoiceId: string;
    allocatedAmount: number;
  }>;
}

export interface ReceiptAllocation {
  invoiceId: string | EstateInvoice;
  invoiceNumber: string;
  allocatedAmount: number;
}

export interface Receipt {
  _id: string;
  receiptNumber: string;
  paymentId: string | EstatePayment;
  leaseId: string | Lease;
  tenantIds: Array<string | Tenant>;
  tenantId?: string | Tenant | null;
  propertyId: string | Property;
  unitId?: string | Unit | null;
  amountReceived: number;
  currency: string;
  receiptDate: string;
  paymentMethod: EstatePaymentMethod;
  reference?: string;
  note?: string;
  allocations: ReceiptAllocation[];
  store: string;
  createdBy?:
    | string
    | {
        _id?: string;
        name?: string;
        email?: string;
      };
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface ReceiptFilters {
  page?: number;
  limit?: number;
  leaseId?: string;
  tenantId?: string;
  paymentId?: string;
  dateFrom?: string;
  dateTo?: string;
  paymentMethod?: EstatePaymentMethod;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export enum LedgerEntryType {
  INVOICE = 'INVOICE',
  PAYMENT = 'PAYMENT',
  LATE_FEE = 'LATE_FEE',
  VOID = 'VOID',
  REVERSAL = 'REVERSAL',
}

export interface LedgerEntryView {
  date: string;
  type: LedgerEntryType;
  referenceNumber: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  leaseId: string;
  tenantId?: string | null;
  invoiceId?: string | null;
  paymentId?: string | null;
  metadata?: Record<string, any>;
}

export interface LedgerResponse<T> {
  entries: T[];
  summary: {
    totalDebit: number;
    totalCredit: number;
    closingBalance: number;
    entryCount: number;
  };
}

export interface LedgerQueryFilters {
  tenantId?: string;
  propertyId?: string;
  leaseId?: string;
  dateFrom?: string;
  dateTo?: string;
  type?: string;
  search?: string;
  includeVoids?: boolean;
  includeReversals?: boolean;
}
