import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, forkJoin } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reservation, CreateReservationDto, UpdateReservationDto } from '../models/reservation.model';
import { RoomsService } from './rooms.service';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private http = inject(HttpClient);
  private roomsService = inject(RoomsService);
  private baseUrl = `${environment.apiUrl}/reservations`;

  private reservationsSubject = new BehaviorSubject<Reservation[]>([]);
  public reservations$ = this.reservationsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  // Get all reservations with optional filters
  getReservations(params?: {
    storeId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    guestId?: string;
    roomId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Observable<{reservations: Reservation[], total: number}> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const fullUrl = `${this.baseUrl}?${queryParams.toString()}`;
    console.log('Fetching reservations from:', fullUrl);
    console.log('Query params object:', params);

    return this.http.get<{reservations: Reservation[], total: number}>(fullUrl).pipe(
      map(response => {
        console.log('Raw API response:', response);
        // Handle both array response (old) and paginated response (new)
        if (Array.isArray(response)) {
          const paginatedResponse = { reservations: response, total: response.length };
          this.reservationsSubject.next(response);
          this.loadingSubject.next(false);
          return paginatedResponse;
        } else {
          this.reservationsSubject.next(response.reservations || []);
          this.loadingSubject.next(false);
          return response;
        }
      }),
      catchError(error => {
        console.error('Error fetching reservations:', error);
        this.errorSubject.next('Failed to load reservations');
        this.loadingSubject.next(false);
        
        // Return empty paginated response on error
        return of({ reservations: [], total: 0 });
      })
    );
  }

  // Get reservation by ID
  getReservationById(id: string): Observable<Reservation | null> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.get<Reservation>(`${this.baseUrl}/${id}`).pipe(
      map(reservation => {
        this.loadingSubject.next(false);
        return reservation;
      }),
      catchError(error => {
        console.error('Error fetching reservation:', error);
        this.errorSubject.next('Failed to load reservation');
        this.loadingSubject.next(false);
        return of(null);
      })
    );
  }

  // Create new reservation
  createReservation(reservationData: CreateReservationDto): Observable<Reservation> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.post<Reservation>(this.baseUrl, reservationData).pipe(
      map(reservation => {
        this.loadingSubject.next(false);
        // Update local reservations list
        const currentReservations = this.reservationsSubject.value;
        this.reservationsSubject.next([reservation, ...currentReservations]);
        return reservation;
      }),
      catchError(error => {
        console.error('Error creating reservation:', error);
        this.errorSubject.next('Failed to create reservation');
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  // Update reservation
  updateReservation(id: string, reservationData: any): Observable<Reservation> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.put<Reservation>(`${this.baseUrl}/${id}`, reservationData).pipe(
      map(reservation => {
        this.loadingSubject.next(false);
        // Update local reservations list
        const currentReservations = this.reservationsSubject.value;
        const updatedReservations = currentReservations.map(r => 
          r._id === id ? reservation : r
        );
        this.reservationsSubject.next(updatedReservations);
        return reservation;
      }),
      catchError(error => {
        console.error('Error updating reservation:', error);
        this.errorSubject.next('Failed to update reservation');
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  // Change rooms for a reservation
  changeRooms(reservationId: string, changeRoomData: any): Observable<any> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.put<any>(`${this.baseUrl}/${reservationId}/change-room`, changeRoomData).pipe(
      map(response => {
        this.loadingSubject.next(false);
        // Update local reservations list if needed
        if (response.data) {
          const currentReservations = this.reservationsSubject.value;
          const updatedReservations = currentReservations.map(r => 
            r._id === reservationId ? response.data : r
          );
          this.reservationsSubject.next(updatedReservations);
        }
        return response;
      }),
      catchError(error => {
        console.error('Error changing rooms:', error);
        this.errorSubject.next('Failed to change rooms');
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  // Delete reservation
  deleteReservation(id: string): Observable<boolean> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.delete(`${this.baseUrl}/${id}`).pipe(
      map(() => {
        this.loadingSubject.next(false);
        // Remove from local reservations list
        const currentReservations = this.reservationsSubject.value;
        const updatedReservations = currentReservations.filter(r => r._id !== id);
        this.reservationsSubject.next(updatedReservations);
        return true;
      }),
      catchError(error => {
        console.error('Error deleting reservation:', error);
        this.errorSubject.next('Failed to delete reservation');
        this.loadingSubject.next(false);
        return of(false);
      })
    );
  }

  // Check-in guest 
  checkInReservation(id: string): Observable<Reservation> {
    return this.updateReservation(id, { 
      status: 'checked_in', 
      actualCheckInDate: new Date() 
    });
  }

  // Check-out guest
  checkOutReservation(id: string): Observable<Reservation> {
    return this.updateReservation(id, { 
      status: 'checked_out', 
      actualCheckOutDate: new Date() 
    });
  }  // Cancel reservation
  cancelReservation(id: string, reason: string): Observable<Reservation> {
    return this.updateReservation(id, { 
      status: 'cancelled',
      cancellation: {
        isCancelled: true,
        cancelledAt: new Date(),
        reason: reason
      }
    });
  }

  // Update reservation status
  updateReservationStatus(id: string, status: string): Observable<Reservation> {
    const updateData: any = { status };
    
    // Add timestamp for specific status changes
    if (status === 'checked_in') {
      updateData.actualCheckInDate = new Date();
    } else if (status === 'checked_out') {
      updateData.actualCheckOutDate = new Date();
    }

    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.put<Reservation>(`${this.baseUrl}/${id}`, updateData).pipe(
      map(reservation => {
        this.loadingSubject.next(false);
        // Update local reservations list
        const currentReservations = this.reservationsSubject.value;
        const updatedReservations = currentReservations.map(r => r._id === id ? reservation : r);
        this.reservationsSubject.next(updatedReservations);
        return reservation;
      }),
      catchError(error => {
        console.error('Error updating reservation status:', error);
        this.loadingSubject.next(false);
        
        // Extract meaningful error message from backend
        let errorMessage = 'Failed to update reservation status';
        if (error.error?.error) {
          errorMessage = error.error.error;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.errorSubject.next(errorMessage);
        throw new Error(errorMessage);
      })
    );
  }

  // Reopen cancelled reservation with PIN authorization
  reopenReservation(id: string, pin: string, reason?: string): Observable<Reservation> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    const requestData = {
      pin: pin,
      reason: reason || 'Reopened with owner authorization'
    };

    return this.http.put<any>(`${this.baseUrl}/${id}/reopen`, requestData).pipe(
      map(response => {
        this.loadingSubject.next(false);
        const reservation = response.reservation || response;
        
        // Update local reservations list
        const currentReservations = this.reservationsSubject.value;
        const updatedReservations = currentReservations.map(r => r._id === id ? reservation : r);
        this.reservationsSubject.next(updatedReservations);
        
        return reservation;
      }),
      catchError(error => {
        console.error('Error reopening reservation:', error);
        this.loadingSubject.next(false);
        
        // Extract meaningful error message from backend
        let errorMessage = 'Failed to reopen reservation';
        if (error.error?.error) {
          errorMessage = error.error.error;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.errorSubject.next(errorMessage);
        throw new Error(errorMessage);
      })
    );
  }

  // Get reservations for calendar view
  getReservationsForCalendar(startDate: Date, endDate: Date, storeId?: string): Observable<Reservation[]> {
    return this.getReservations({
      storeId: storeId,
      dateFrom: startDate.toISOString().split('T')[0],
      dateTo: endDate.toISOString().split('T')[0]
    }).pipe(
      map(response => response.reservations)
    );
  }

  // Clear error
  clearError(): void {
    this.errorSubject.next(null);
  }

  // ===== Front Desk Operations =====

  // Get front desk overview data
  getFrontDeskOverview(storeId: string): Observable<{
    arrivals: Reservation[];
    departures: Reservation[];
    inHouseGuests: Reservation[];
    pendingCheckIns: Reservation[];
    stats: {
      totalArrivals: number;
      totalDepartures: number;
      totalInHouse: number;
      totalPending: number;
    };
  }> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.get<any>(`${this.baseUrl}/front-desk/overview/${storeId}`).pipe(
      map(response => {
        this.loadingSubject.next(false);
        return response;
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        let errorMessage = 'Failed to fetch front desk overview';
        
        if (error.error?.error) {
          errorMessage = error.error.error;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.errorSubject.next(errorMessage);
        throw new Error(errorMessage);
      })
    );
  }

  // Get today's check-ins
  getTodaysCheckIns(storeId: string): Observable<Reservation[]> {
    return this.http.get<{arrivals: Reservation[]}>(`${this.baseUrl}/front-desk/check-in-today/${storeId}`).pipe(
      map(response => response.arrivals),
      catchError(error => {
        this.errorSubject.next('Failed to fetch today\'s check-ins');
        return of([]);
      })
    );
  }

  // Get today's check-outs
  getTodaysCheckOuts(storeId: string): Observable<Reservation[]> {
    return this.http.get<{departures: Reservation[]}>(`${this.baseUrl}/front-desk/check-out-today/${storeId}`).pipe(
      map(response => response.departures),
      catchError(error => {
        this.errorSubject.next('Failed to fetch today\'s check-outs');
        return of([]);
      })
    );
  }

  // Get in-house guests
  getInHouseGuests(storeId: string): Observable<Reservation[]> {
    return this.http.get<{inHouseGuests: Reservation[]}>(`${this.baseUrl}/front-desk/in-house/${storeId}`).pipe(
      map(response => response.inHouseGuests),
      catchError(error => {
        this.errorSubject.next('Failed to fetch in-house guests');
        return of([]);
      })
    );
  }

  // Enhanced check-in with room readiness validation
  checkInReservationWithRooms(
    reservationId: string, 
    checkInData?: {
      actualCheckInTime?: Date;
      notes?: string;
      roomReadiness?: {
        isClean: boolean;
        isMaintained: boolean;
        amenitiesReady: boolean;
      };
    }
  ): Observable<Reservation> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    // Update room statuses in parallel with reservation check-in
    return this.http.put<Reservation>(`${this.baseUrl}/${reservationId}/check-in-with-rooms`, checkInData || {}).pipe(
      switchMap(reservation => {
        // Refresh room statuses to ensure UI is up to date
        const roomUpdates = reservation.rooms.map(roomRes => {
          const roomId = typeof roomRes.room === 'string' ? roomRes.room : roomRes.room._id;
          return this.roomsService.getRoom(roomId);
        });
        
        return forkJoin(roomUpdates).pipe(
          map(() => {
            this.loadingSubject.next(false);
            return reservation;
          })
        );
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        let errorMessage = 'Failed to check in guest';
        
        if (error.error?.error) {
          errorMessage = error.error.error;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.errorSubject.next(errorMessage);
        throw new Error(errorMessage);
      })
    );
  }

  // Enhanced check-out with room condition assessment
  checkOutReservationWithRooms(
    reservationId: string, 
    checkOutData?: {
      actualCheckOutTime?: Date;
      finalBill?: number;
      notes?: string;
      roomCondition?: {
        damageNotes?: string;
        cleaningRequired?: boolean;
      };
    }
  ): Observable<Reservation> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    // Update room statuses in parallel with reservation check-out
    return this.http.put<Reservation>(`${this.baseUrl}/${reservationId}/check-out-with-rooms`, checkOutData || {}).pipe(
      switchMap(reservation => {
        // Refresh room statuses to ensure UI is up to date
        const roomUpdates = reservation.rooms.map(roomRes => {
          const roomId = typeof roomRes.room === 'string' ? roomRes.room : roomRes.room._id;
          return this.roomsService.getRoom(roomId);
        });
        
        return forkJoin(roomUpdates).pipe(
          map(() => {
            this.loadingSubject.next(false);
            return reservation;
          })
        );
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        let errorMessage = 'Failed to check out guest';
        
        if (error.error?.error) {
          errorMessage = error.error.error;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.errorSubject.next(errorMessage);
        throw new Error(errorMessage);
      })
    );
  }

  // ===== Additional Front Desk Features =====

  // Request early check-in
  requestEarlyCheckIn(reservationId: string, requestedTime: string, notes?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${reservationId}/early-checkin-request`, {
      requestedTime,
      notes
    }).pipe(
      catchError(error => {
        this.errorSubject.next('Failed to request early check-in');
        throw error;
      })
    );
  }

  // Request late check-out
  requestLateCheckOut(reservationId: string, requestedTime: string, notes?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${reservationId}/late-checkout-request`, {
      requestedTime,
      notes
    }).pipe(
      catchError(error => {
        this.errorSubject.next('Failed to request late check-out');
        throw error;
      })
    );
  }

  // Change room assignment
  changeRoomAssignment(reservationId: string, oldRoomId: string, newRoomId: string, reason?: string): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.baseUrl}/${reservationId}/change-room`, {
      oldRoomId,
      newRoomId,
      reason
    }).pipe(
      catchError(error => {
        this.errorSubject.next('Failed to change room assignment');
        throw error;
      })
    );
  }

  // Add internal notes
  addInternalNotes(reservationId: string, notes: string): Observable<Reservation> {
    return this.http.patch<Reservation>(`${this.baseUrl}/${reservationId}/notes`, {
      internalNotes: notes
    }).pipe(
      catchError(error => {
        this.errorSubject.next('Failed to add notes');
        throw error;
      })
    );
  }

  // Extend stay
  extendStay(reservationId: string, newCheckOutDate: Date, additionalNights: number): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.baseUrl}/${reservationId}/extend-stay`, {
      newCheckOutDate: newCheckOutDate.toISOString(),
      additionalNights
    }).pipe(
      catchError(error => {
        this.errorSubject.next('Failed to extend stay');
        throw error;
      })
    );
  }

  // Process payment
  processPayment(reservationId: string, paymentData: {
    amount: number;
    method: string;
    reference?: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/${reservationId}/payment`, paymentData).pipe(
      catchError(error => {
        this.errorSubject.next('Failed to process payment');
        throw error;
      })
    );
  }

  // Update payment information (status, method, reference, notes)
  updatePaymentInfo(reservationId: string, paymentInfoData: {
    status: 'pending' | 'partial' | 'paid';
    method: string;
    reference?: string;
    notes?: string;
  }): Observable<any> {
    return this.http.put(`${this.baseUrl}/${reservationId}/payment-info`, paymentInfoData).pipe(
      catchError(error => {
        this.errorSubject.next('Failed to update payment information');
        throw error;
      })
    );
  }

  // Print folio
  printFolio(reservationId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${reservationId}/folio`, {
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        this.errorSubject.next('Failed to generate folio');
        throw error;
      })
    );
  }

  // Request housekeeping
  requestHousekeeping(reservationId: string, request: {
    roomIds: string[];
    serviceType: 'cleaning' | 'maintenance' | 'amenities';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    notes?: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/${reservationId}/housekeeping-request`, request).pipe(
      catchError(error => {
        this.errorSubject.next('Failed to request housekeeping');
        throw error;
      })
    );
  }

  // Send reservation email
  sendReservationEmail(reservationId: string, emailData: {
    emailType?: 'details' | 'confirmation' | 'checkin';
    recipientEmail?: string;
    customMessage?: string;
  }): Observable<{
    success: boolean;
    message: string;
    emailType: string;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      emailType: string;
    }>(`${this.baseUrl}/${reservationId}/send-email`, emailData).pipe(
      catchError(error => {
        console.error('Error sending reservation email:', error);
        let errorMessage = 'Failed to send reservation email';
        
        if (error.error?.error) {
          errorMessage = error.error.error;
        } else if (error.error?.details) {
          errorMessage = error.error.details;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.errorSubject.next(errorMessage);
        throw new Error(errorMessage);
      })
    );
  }

  /**
   * Export reservation details to PDF
   */
  exportReservationToPDF(reservationId: string): Observable<Blob> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.get(`${this.baseUrl}/${reservationId}/export/pdf`, {
      responseType: 'blob'
    }).pipe(
      map((response: Blob) => {
        this.loadingSubject.next(false);
        return response;
      }),
      catchError((error) => {
        this.loadingSubject.next(false);
        
        let errorMessage = 'Failed to export reservation to PDF. Please try again.';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.error) {
          errorMessage = error.error.error;
        } else if (error.error?.details) {
          errorMessage = error.error.details;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.errorSubject.next(errorMessage);
        console.error('Error exporting reservation to PDF:', error);
        throw new Error(errorMessage);
      })
    );
  }

  /**
   * Delete reservation with store owner PIN authorization
   */
  deleteReservationWithPin(reservationId: string, pin: string): Observable<{ message: string, reservation?: Reservation }> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.delete<{ message: string, reservation?: Reservation }>(
      `${this.baseUrl}/${reservationId}/secure`,
      { body: { pin } }
    ).pipe(
      map(response => {
        this.loadingSubject.next(false);
        return response;
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        let errorMessage = 'Failed to delete reservation. Please try again.';
        
        if (error.status === 403) {
          errorMessage = 'Invalid store owner PIN. Please check with the store owner for the correct PIN.';
        } else if (error.status === 404) {
          errorMessage = 'Reservation not found.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.error) {
          errorMessage = error.error.error;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.errorSubject.next(errorMessage);
        console.error('Error deleting reservation with PIN:', error);
        throw new Error(errorMessage);
      })
    );
  }

  /**
   * Request extension for a reservation
   */
  requestExtension(reservationId: string, extensionData: {
    newCheckOutDate: string;
    additionalNights: number;
    notes?: string;
  }): Observable<{ success: boolean; extension: any; message: string }> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.post<{ success: boolean; extension: any; message: string }>(
      `${this.baseUrl}/${reservationId}/extension/request`,
      extensionData
    ).pipe(
      map(response => {
        this.loadingSubject.next(false);
        return response;
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        let errorMessage = 'Failed to request extension. Please try again.';
        
        if (error.status === 400) {
          errorMessage = error.error?.error || 'Invalid extension request.';
        } else if (error.status === 404) {
          errorMessage = 'Reservation not found.';
        } else if (error.status === 409) {
          errorMessage = error.error?.error || 'Extension not available for the selected dates.';
        } else if (error.error?.error) {
          errorMessage = error.error.error;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.errorSubject.next(errorMessage);
        console.error('Error requesting extension:', error);
        throw new Error(errorMessage);
      })
    );
  }

  /**
   * Check extension availability with enhanced pricing breakdown
   */
  checkExtensionAvailability(reservationId: string, newCheckOutDate: string): Observable<{
    isAvailable: boolean;
    availableUntil?: Date;
    conflictingReservations?: any[];
    estimatedCost?: number;
    maxExtensionNights?: number;
    extensionDays?: number;
    roomAvailability?: any[];
    pricingBreakdown?: {
      baseRatePerNight: number;
      finalRatePerNight: number;
      totalCost: number;
      strategy: string;
      appliedModifiers: {
        name: string;
        type: string;
        value: number;
        originalRate: number;
        modifiedRate: number;
        description?: string;
      }[];
    };
    message?: string;
  }> {
    return this.http.get<any>(
      `${this.baseUrl}/${reservationId}/extension/availability`,
      { params: { newCheckOutDate } }
    ).pipe(
      catchError(error => {
        console.error('Error checking extension availability:', error);
        // Return unavailable if there's an error
        return of({
          isAvailable: false,
          conflictingReservations: [],
          estimatedCost: 0,
          maxExtensionNights: 0,
          extensionDays: 0,
          roomAvailability: [],
          message: 'Failed to check availability'
        });
      })
    );
  }

  /**
   * Approve extension request
   */
  approveExtension(reservationId: string, extensionId: string, approvalNotes?: string, paymentInfo?: any): Observable<{
    success: boolean;
    reservation: Reservation;
    message: string;
  }> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.put<{ success: boolean; reservation: Reservation; message: string }>(
      `${this.baseUrl}/${reservationId}/extension/${extensionId}/approve`,
      { extensionId, approvalNotes, paymentInfo }
    ).pipe(
      map(response => {
        this.loadingSubject.next(false);
        return response;
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        let errorMessage = 'Failed to approve extension. Please try again.';
        
        if (error.status === 404) {
          errorMessage = 'Extension or reservation not found.';
        } else if (error.status === 409) {
          errorMessage = error.error?.error || 'Extension has already been processed.';
        } else if (error.error?.error) {
          errorMessage = error.error.error;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.errorSubject.next(errorMessage);
        console.error('Error approving extension:', error);
        throw new Error(errorMessage);
      })
    );
  }

  /**
   * Reject extension request
   */
  rejectExtension(reservationId: string, extensionId: string, rejectionReason: string, rejectionNotes?: string): Observable<{
    success: boolean;
    reservation: Reservation;
    message: string;
  }> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.put<{ success: boolean; reservation: Reservation; message: string }>(
      `${this.baseUrl}/${reservationId}/extension/${extensionId}/reject`,
      { extensionId, rejectionReason, rejectionNotes }
    ).pipe(
      map(response => {
        this.loadingSubject.next(false);
        return response;
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        let errorMessage = 'Failed to reject extension. Please try again.';
        
        if (error.status === 404) {
          errorMessage = 'Extension or reservation not found.';
        } else if (error.status === 409) {
          errorMessage = error.error?.error || 'Extension has already been processed.';
        } else if (error.error?.error) {
          errorMessage = error.error.error;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.errorSubject.next(errorMessage);
        console.error('Error rejecting extension:', error);
        throw new Error(errorMessage);
      })
    );
  }

  /**
   * Get extensions for a reservation
   */
  getReservationExtensions(reservationId: string): Observable<{
    extensions: any[];
    currentExtension: any;
  }> {
    return this.http.get<{ extensions: any[]; currentExtension: any }>(
      `${this.baseUrl}/${reservationId}/extensions`
    ).pipe(
      catchError(error => {
        console.error('Error fetching reservation extensions:', error);
        return of({ extensions: [], currentExtension: null });
      })
    );
  }

  // Private mock data for development
  
}