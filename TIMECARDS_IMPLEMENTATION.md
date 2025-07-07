# Timecards Feature Implementation

## Overview
Successfully implemented a comprehensive timecards feature in the employees directory of the Angular application. This feature allows back-office management to view, create, edit, approve, and export employee timesheets.

## Features Implemented

### 1. List Timecards Component (`/employees/timecards/list`)
- **Location**: `src/app/dashboard/employees/timecards/list-timecards/`
- **Features**:
  - Summary cards showing total employees, hours worked, overtime, and pending approvals
  - Advanced filtering by date range, status, and employee
  - Search functionality by employee name
  - Data table with columns: employee, date, clock in/out times, total hours, breaks, overtime, status, actions
  - Export functionality (CSV and Excel)
  - CRUD operations (Create, Edit, Approve, Delete)

### 2. Create/Edit Timecard Modal
- **Location**: `src/app/dashboard/employees/timecards/modals/create-timecard/`
- **Features**:
  - Employee selection dropdown
  - Clock in/out time inputs with datetime-local support
  - Location tracking (latitude, longitude, address) for both clock in and clock out
  - Dynamic breaks management (add/remove multiple breaks with type, start/end times, notes)
  - Status selection (active, completed, approved, rejected)
  - Notes field for additional information
  - Current location capture using browser geolocation API
  - Form validation with error messages

### 3. Service Integration
- **Enhanced TimesheetService**: Added `createManualTimecard` method for admin-created timecards
- **UserService Integration**: Leveraged existing `getStoreMerchants` for employee data

### 4. Navigation Integration
- Added "Timecards" navigation item to the Employees section in the main dashboard sidebar
- Proper routing structure: `/dashboard/employees/timecards/list`

## API Endpoints Used

Based on the provided endpoints, the implementation utilizes:

- `GET /timesheets/store/:storeId` - Get all timesheets for a store
- `GET /timesheets/summary/:storeId` - Get aggregated analytics/summary  
- `GET /timesheets/:id` - Get single timesheet details
- `PUT /timesheets/:id/approve` - Approve a timesheet record
- `PUT /timesheets/:id` - Update timesheet details
- `DELETE /timesheets/:id` - Delete a timesheet record
- `POST /timesheets/manual` - Create manual timecard (custom endpoint for admin creation)
- Export endpoint (custom implementation for CSV/Excel export)

## Key Components Structure

```
src/app/dashboard/employees/timecards/
├── list-timecards/
│   ├── list-timecards.component.ts
│   ├── list-timecards.component.html
│   └── list-timecards.component.scss
├── modals/
│   └── create-timecard/
│       ├── create-timecard.component.ts
│       ├── create-timecard.component.html
│       └── create-timecard.component.scss
├── timecards.component.ts
└── timecards.routes.ts
```

## Models Used

- `Timesheet` - Main timesheet interface
- `BreakRecord` - Break tracking within timesheets
- `LocationData` - GPS coordinates and address
- `TimesheetSummary` - Analytics data
- `TimesheetFilters` - Filtering parameters
- `Employee` - Employee information

## UI/UX Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Material Design**: Consistent with existing app design using Angular Material
- **Real-time Validation**: Form validation with immediate feedback
- **Loading States**: Proper loading indicators and error handling
- **Export Functionality**: Multiple export formats
- **Search & Filter**: Comprehensive filtering options
- **Modern UI**: Cards, chips, and clean typography

## Technical Implementation

- **Standalone Components**: All components are standalone for better tree-shaking
- **RxJS Integration**: Reactive programming with rxResource for data management
- **Signal-based State**: Modern Angular signals for reactive state management
- **Form Handling**: Reactive forms with FormBuilder and validation
- **Error Handling**: Comprehensive error handling with user-friendly messages

## Usage

1. Navigate to `/dashboard/employees/timecards/list` from the sidebar
2. View summary statistics at the top
3. Use filters to narrow down timecard data
4. Click "CREATE TIMECARD" to manually create a new timecard
5. Use action buttons on each row to edit, approve, or delete timecards
6. Export data using the Export button (CSV or Excel)

## Notes

- The create timecard functionality is designed for back-office management
- For actual employee time tracking, the clock-in/clock-out API endpoints should be used
- The manual creation endpoint (`POST /timesheets/manual`) may need to be implemented on the backend
- Location capture uses the browser's geolocation API with proper error handling
- All components follow the existing project patterns and conventions
