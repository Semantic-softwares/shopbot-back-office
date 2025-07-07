import { User } from './user.model';
import { Store } from './store.model';

export interface BreakRecord {
  _id?: string;
  breakType: 'lunch' | 'short' | 'other';
  breakStart: Date;
  breakEnd?: Date;
  breakDuration?: number; // in minutes
  notes?: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Timesheet {
  _id: string;
  employee: User | string;
  store: Store | string;
  clockInTime: Date;
  clockOutTime?: Date;
  clockInLocation?: LocationData;
  clockOutLocation?: LocationData;
  breaks: BreakRecord[];
  totalWorkTime?: number; // in minutes
  totalBreakTime?: number; // in minutes
  status: 'clocked-in' | 'clocked-out' | 'incomplete';
  approvedBy?: User | string;
  approvedAt?: Date;
  notes?: string;
  overtime?: number; // in minutes
  regularHours?: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}

export interface TimesheetStatus {
  isActive: boolean;
  currentTimesheet?: Timesheet;
  currentBreak?: BreakRecord;
}

export interface TimesheetSummary {
  totalEmployees: number;
  totalHoursWorked: number;
  totalOvertimeHours: number;
  totalBreakTime: number;
  averageWorkHours: number;
  pendingApprovals: number;
  activeTimesheets: number;
}

export interface TimesheetFilters {
  employeeId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  approved?: boolean;
}
