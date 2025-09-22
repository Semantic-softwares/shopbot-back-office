import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface DashboardStats {
  totalRooms: number;
  availableRooms: number;
  occupancyRate: number;
  checkedInGuests: number;
  todayCheckins: number;
  todayCheckouts: number;
  todayRevenue: number;
  monthlyRevenue: number;
  lastUpdated: Date;
}

export interface OccupancyTrend {
  date: string;
  occupancyRate: number;
  occupiedRooms: number;
  totalRooms: number;
}

export interface RevenueTrend {
  date: string;
  revenue: number;
  reservationCount: number;
}

export interface RecentActivity {
  id: string;
  title: string;
  icon: string;
  type: string;
  time: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000/analytics'; // Update with your backend URL

  private dashboardStatsSubject = new BehaviorSubject<DashboardStats | null>(null);
  public dashboardStats$ = this.dashboardStatsSubject.asObservable();

  private recentActivitiesSubject = new BehaviorSubject<RecentActivity[]>([]);
  public recentActivities$ = this.recentActivitiesSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  getDashboardStats(): Observable<DashboardStats> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.get<DashboardStats>(`${this.baseUrl}/dashboard`).pipe(
      map(stats => {
        this.dashboardStatsSubject.next(stats);
        this.loadingSubject.next(false);
        return stats;
      }),
      catchError(error => {
        console.error('Error fetching dashboard stats:', error);
        this.errorSubject.next('Failed to load dashboard statistics');
        this.loadingSubject.next(false);
        
        // Return mock data on error
        const mockStats: DashboardStats = {
          totalRooms: 50,
          availableRooms: 12,
          occupancyRate: 76,
          checkedInGuests: 38,
          todayCheckins: 8,
          todayCheckouts: 5,
          todayRevenue: 4250,
          monthlyRevenue: 125000,
          lastUpdated: new Date()
        };
        this.dashboardStatsSubject.next(mockStats);
        return of(mockStats);
      })
    );
  }

  getOccupancyTrend(days: number = 7): Observable<OccupancyTrend[]> {
    return this.http.get<OccupancyTrend[]>(`${this.baseUrl}/occupancy-trend?days=${days}`).pipe(
      catchError(error => {
        console.error('Error fetching occupancy trend:', error);
        
        // Return mock data on error
        const mockTrend: OccupancyTrend[] = Array.from({ length: days }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (days - 1 - i));
          return {
            date: date.toISOString().split('T')[0],
            occupancyRate: Math.floor(Math.random() * 40) + 60, // 60-100%
            occupiedRooms: Math.floor(Math.random() * 20) + 30,
            totalRooms: 50
          };
        });
        return of(mockTrend);
      })
    );
  }

  getRevenueTrend(days: number = 7): Observable<RevenueTrend[]> {
    return this.http.get<RevenueTrend[]>(`${this.baseUrl}/revenue-trend?days=${days}`).pipe(
      catchError(error => {
        console.error('Error fetching revenue trend:', error);
        
        // Return mock data on error
        const mockTrend: RevenueTrend[] = Array.from({ length: days }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (days - 1 - i));
          return {
            date: date.toISOString().split('T')[0],
            revenue: Math.floor(Math.random() * 3000) + 2000, // $2000-$5000
            reservationCount: Math.floor(Math.random() * 10) + 5
          };
        });
        return of(mockTrend);
      })
    );
  }

  getRecentActivities(limit: number = 10): Observable<RecentActivity[]> {
    return this.http.get<RecentActivity[]>(`${this.baseUrl}/recent-activities?limit=${limit}`).pipe(
      map(activities => {
        this.recentActivitiesSubject.next(activities);
        return activities;
      }),
      catchError(error => {
        console.error('Error fetching recent activities:', error);
        
        // Return mock data on error
        const mockActivities: RecentActivity[] = [
          {
            id: '1',
            title: 'John Doe checked in to room 205',
            icon: 'check_in',
            type: 'Check-in',
            time: '15m ago',
            timestamp: new Date(Date.now() - 15 * 60 * 1000)
          },
          {
            id: '2',
            title: 'New reservation by Sarah Wilson',
            icon: 'book_online',
            type: 'Reservation',
            time: '32m ago',
            timestamp: new Date(Date.now() - 32 * 60 * 1000)
          },
          {
            id: '3',
            title: 'Mike Johnson checked out from room 102',
            icon: 'check_out',
            type: 'Check-out',
            time: '1h ago',
            timestamp: new Date(Date.now() - 60 * 60 * 1000)
          },
          {
            id: '4',
            title: 'Room 301 maintenance completed',
            icon: 'build',
            type: 'Maintenance',
            time: '2h ago',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
          },
          {
            id: '5',
            title: 'Payment received from Lisa Chen',
            icon: 'payment',
            type: 'Payment',
            time: '3h ago',
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000)
          }
        ];
        this.recentActivitiesSubject.next(mockActivities);
        return of(mockActivities);
      })
    );
  }

  refreshData(): void {
    this.getDashboardStats().subscribe();
    this.getRecentActivities().subscribe();
  }

  clearError(): void {
    this.errorSubject.next(null);
  }
}