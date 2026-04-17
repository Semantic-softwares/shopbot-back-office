export type { PaginatedResponse } from './estate.model';

export enum MaintenanceStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum MaintenancePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum MaintenanceCategory {
  PLUMBING = 'PLUMBING',
  ELECTRICAL = 'ELECTRICAL',
  HVAC = 'HVAC',
  APPLIANCE = 'APPLIANCE',
  DOORS_WINDOWS = 'DOORS_WINDOWS',
  PAINTING = 'PAINTING',
  CLEANING = 'CLEANING',
  STRUCTURAL = 'STRUCTURAL',
  PEST_CONTROL = 'PEST_CONTROL',
  GENERAL = 'GENERAL',
}

export enum MaintenanceAssigneeType {
  STAFF = 'STAFF',
  VENDOR = 'VENDOR',
}

export enum MaintenanceReportedByType {
  TENANT = 'TENANT',
  STAFF = 'STAFF',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
}

export enum MaintenanceActivityType {
  CREATED = 'CREATED',
  ASSIGNED = 'ASSIGNED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  COST_UPDATED = 'COST_UPDATED',
  PHOTO_ADDED = 'PHOTO_ADDED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface MaintenancePropertyRef {
  _id: string;
  name: string;
  code: string;
  type?: string;
  address?: { street?: string; city?: string };
}

export interface MaintenanceUnitRef {
  _id: string;
  name: string;
  code: string;
  type?: string;
  status?: string;
}

export interface MaintenanceTenantRef {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email?: string;
  phoneNumbers?: string[];
}

export interface MaintenanceLeaseRef {
  _id: string;
  leaseNumber: string;
  status: string;
  startDate: string;
  endDate: string;
}

export interface MaintenanceUserRef {
  _id: string;
  name: string;
  email?: string;
}

export interface MaintenanceVendorRef {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  specialty?: string;
}

export interface PartsAndLaborItem {
  quantity: number;
  category: string;
  description?: string;
  price: number;
  total: number;
}

export interface MaintenanceRequest {
  _id: string;
  requestNumber: string;
  propertyId: MaintenancePropertyRef | string;
  unitId?: MaintenanceUnitRef | string | null;
  tenantId?: MaintenanceTenantRef | string | null;
  leaseId?: MaintenanceLeaseRef | string | null;
  title: string;
  description?: string;
  category: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  reportedByUserId?: MaintenanceUserRef | string | null;
  reportedByType?: MaintenanceReportedByType | null;
  assigneeType?: MaintenanceAssigneeType | null;
  assigneeId?: string | null;
  vendorId?: MaintenanceVendorRef | string | null;
  assignedTo?: MaintenanceUserRef | string | null;
  dueDate?: string | null;
  estimatedCost?: number | null;
  actualCost?: number | null;
  partsAndLabor?: PartsAndLaborItem[];
  photos: string[];
  completedAt?: string | null;
  cancelledAt?: string | null;
  expenseInvoiceId?: string | null;
  store: string;
  createdBy?: MaintenanceUserRef | string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface MaintenanceActivity {
  _id: string;
  maintenanceRequestId: string;
  type: MaintenanceActivityType;
  message: string;
  metadata?: Record<string, any> | null;
  createdBy?: MaintenanceUserRef | null;
  store: string;
  createdAt: string;
}

export interface MaintenanceSummary {
  open: number;
  assigned: number;
  inProgress: number;
  onHold: number;
  completed: number;
  cancelled: number;
  total: number;
}

export interface MaintenanceRequestDetail {
  request: MaintenanceRequest;
  activities: MaintenanceActivity[];
}

export interface CreateMaintenanceRequestPayload {
  propertyId: string;
  unitId?: string;
  tenantId?: string;
  leaseId?: string;
  title: string;
  description?: string;
  category: string;
  priority: MaintenancePriority;
  status?: MaintenanceStatus;
  reportedByType?: MaintenanceReportedByType;
  reportedByUserId?: string;
  createdBy?: string;
  estimatedCost?: number;
  partsAndLabor?: PartsAndLaborItem[];
  photos?: string[];
  vendorId?: string;
  assignedTo?: string;
  dueDate?: string;
}

export interface UpdateMaintenanceRequestPayload {
  propertyId?: string;
  unitId?: string;
  tenantId?: string;
  leaseId?: string;
  title?: string;
  description?: string;
  category?: string;
  priority?: MaintenancePriority;
  status?: MaintenanceStatus;
  reportedByType?: MaintenanceReportedByType;
  reportedByUserId?: string;
  vendorId?: string;
  assignedTo?: string;
  estimatedCost?: number;
  dueDate?: string;
  partsAndLabor?: PartsAndLaborItem[];
  photos?: string[];
}

export interface AssignMaintenanceRequestPayload {
  assigneeType: MaintenanceAssigneeType;
  assigneeId: string;
  note?: string;
}

export interface UpdateMaintenanceStatusPayload {
  status: MaintenanceStatus;
  note?: string;
}

export interface AddMaintenanceCommentPayload {
  comment: string;
}

export interface UpdateMaintenanceCostPayload {
  estimatedCost?: number;
  actualCost?: number;
  note?: string;
}

export interface MaintenanceFilters {
  propertyId?: string;
  unitId?: string;
  tenantId?: string;
  leaseId?: string;
  status?: MaintenanceStatus | '';
  priority?: MaintenancePriority | '';
  category?: string;
  assigneeType?: MaintenanceAssigneeType | '';
  assigneeId?: string;
  vendorId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const STATUS_LABEL: Record<MaintenanceStatus, string> = {
  [MaintenanceStatus.OPEN]: 'Open',
  [MaintenanceStatus.ASSIGNED]: 'Assigned',
  [MaintenanceStatus.IN_PROGRESS]: 'In Progress',
  [MaintenanceStatus.ON_HOLD]: 'On Hold',
  [MaintenanceStatus.COMPLETED]: 'Completed',
  [MaintenanceStatus.CANCELLED]: 'Cancelled',
};

export const STATUS_COLOR: Record<MaintenanceStatus, string> = {
  [MaintenanceStatus.OPEN]: 'bg-blue-100 text-blue-700',
  [MaintenanceStatus.ASSIGNED]: 'bg-purple-100 text-purple-700',
  [MaintenanceStatus.IN_PROGRESS]: 'bg-amber-100 text-amber-700',
  [MaintenanceStatus.ON_HOLD]: 'bg-gray-100 text-gray-600',
  [MaintenanceStatus.COMPLETED]: 'bg-green-100 text-green-700',
  [MaintenanceStatus.CANCELLED]: 'bg-red-100 text-red-600',
};

export const PRIORITY_LABEL: Record<MaintenancePriority, string> = {
  [MaintenancePriority.LOW]: 'Low',
  [MaintenancePriority.MEDIUM]: 'Medium',
  [MaintenancePriority.HIGH]: 'High',
  [MaintenancePriority.URGENT]: 'Urgent',
};

export const PRIORITY_COLOR: Record<MaintenancePriority, string> = {
  [MaintenancePriority.LOW]: 'bg-gray-100 text-gray-600',
  [MaintenancePriority.MEDIUM]: 'bg-blue-100 text-blue-700',
  [MaintenancePriority.HIGH]: 'bg-orange-100 text-orange-700',
  [MaintenancePriority.URGENT]: 'bg-red-100 text-red-700',
};

export const CATEGORY_LABEL: Record<MaintenanceCategory, string> = {
  [MaintenanceCategory.PLUMBING]: 'Plumbing',
  [MaintenanceCategory.ELECTRICAL]: 'Electrical',
  [MaintenanceCategory.HVAC]: 'HVAC',
  [MaintenanceCategory.APPLIANCE]: 'Appliance',
  [MaintenanceCategory.DOORS_WINDOWS]: 'Doors & Windows',
  [MaintenanceCategory.PAINTING]: 'Painting',
  [MaintenanceCategory.CLEANING]: 'Cleaning',
  [MaintenanceCategory.STRUCTURAL]: 'Structural',
  [MaintenanceCategory.PEST_CONTROL]: 'Pest Control',
  [MaintenanceCategory.GENERAL]: 'General',
};

export const CATEGORY_ICON: Record<MaintenanceCategory, string> = {
  [MaintenanceCategory.PLUMBING]: 'plumbing',
  [MaintenanceCategory.ELECTRICAL]: 'electrical_services',
  [MaintenanceCategory.HVAC]: 'air',
  [MaintenanceCategory.APPLIANCE]: 'kitchen',
  [MaintenanceCategory.DOORS_WINDOWS]: 'door_front',
  [MaintenanceCategory.PAINTING]: 'format_paint',
  [MaintenanceCategory.CLEANING]: 'cleaning_services',
  [MaintenanceCategory.STRUCTURAL]: 'foundation',
  [MaintenanceCategory.PEST_CONTROL]: 'pest_control',
  [MaintenanceCategory.GENERAL]: 'build',
};

export const ACTIVITY_ICON: Record<MaintenanceActivityType, string> = {
  [MaintenanceActivityType.CREATED]: 'add_circle_outline',
  [MaintenanceActivityType.ASSIGNED]: 'person_add',
  [MaintenanceActivityType.STATUS_CHANGED]: 'sync_alt',
  [MaintenanceActivityType.COMMENT_ADDED]: 'chat_bubble_outline',
  [MaintenanceActivityType.COST_UPDATED]: 'payments',
  [MaintenanceActivityType.PHOTO_ADDED]: 'photo_camera',
  [MaintenanceActivityType.COMPLETED]: 'check_circle_outline',
  [MaintenanceActivityType.CANCELLED]: 'cancel',
};

export const STATUS_TRANSITIONS: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  [MaintenanceStatus.OPEN]: [MaintenanceStatus.ASSIGNED, MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.ON_HOLD, MaintenanceStatus.CANCELLED],
  [MaintenanceStatus.ASSIGNED]: [
    MaintenanceStatus.IN_PROGRESS,
    MaintenanceStatus.ON_HOLD,
    MaintenanceStatus.COMPLETED,
    MaintenanceStatus.CANCELLED,
  ],
  [MaintenanceStatus.IN_PROGRESS]: [
    MaintenanceStatus.COMPLETED,
    MaintenanceStatus.ON_HOLD,
    MaintenanceStatus.CANCELLED,
  ],
  [MaintenanceStatus.ON_HOLD]: [MaintenanceStatus.OPEN, MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.CANCELLED],
  [MaintenanceStatus.COMPLETED]: [MaintenanceStatus.OPEN],
  [MaintenanceStatus.CANCELLED]: [MaintenanceStatus.OPEN],
};
