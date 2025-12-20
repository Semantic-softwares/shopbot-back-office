/**
 * Reservation Status Enum
 * Mirrors the backend schema status values
 * 
 * Status Flow:
 * PENDING/RESERVED → CONFIRMED → CHECKED_IN → CHECKED_OUT
 *                 ↘ CANCELLED (at any point)
 *                 ↘ NO_SHOW (if guest doesn't arrive)
 * 
 * PENDING: Legacy status (older data), treated same as RESERVED
 */
export enum ReservationStatus {
  PENDING = 'pending',         // Legacy status for backward compatibility
  RESERVED = 'reserved',       // Initial booking created
  CONFIRMED = 'confirmed',     // Booking confirmed by staff
  CHECKED_IN = 'checked_in',   // Guest has arrived
  CHECKED_OUT = 'checked_out', // Guest has departed
  CANCELLED = 'cancelled',     // Booking cancelled
  NO_SHOW = 'no_show',         // Guest didn't show up
}

/**
 * Helper to get readable status label
 */
export function getReservationStatusLabel(status: ReservationStatus | string): string {
  const labels: Record<string, string> = {
    [ReservationStatus.PENDING]: 'Pending',
    [ReservationStatus.RESERVED]: 'Reserved',
    [ReservationStatus.CONFIRMED]: 'Confirmed',
    [ReservationStatus.CHECKED_IN]: 'Checked In',
    [ReservationStatus.CHECKED_OUT]: 'Checked Out',
    [ReservationStatus.CANCELLED]: 'Cancelled',
    [ReservationStatus.NO_SHOW]: 'No Show',
  };
  return labels[status] || 'Unknown';
}

/**
 * Helper to get status color for UI display
 */
export function getReservationStatusColor(status: ReservationStatus | string): string {
  const colors: Record<string, string> = {
    [ReservationStatus.PENDING]: '#FFA500',    // Orange (same as reserved for legacy data)
    [ReservationStatus.RESERVED]: '#FFA500',   // Orange
    [ReservationStatus.CONFIRMED]: '#4CAF50',  // Green
    [ReservationStatus.CHECKED_IN]: '#2196F3', // Blue
    [ReservationStatus.CHECKED_OUT]: '#757575', // Gray
    [ReservationStatus.CANCELLED]: '#F44336',  // Red
    [ReservationStatus.NO_SHOW]: '#E91E63',    // Pink
  };
  return colors[status] || '#9E9E9E'; // Default gray
}
