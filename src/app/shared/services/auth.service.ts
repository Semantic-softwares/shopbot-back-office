import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, timer } from 'rxjs';
import { map, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { SessionStorageService } from './session-storage.service';
import { Role } from '../models/role.model';
import { Permission } from '../models/permission.model';
import { RolesService } from './roles.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserRole = new BehaviorSubject<Role | null>(null);
  private permissionCache: Map<string, boolean> = new Map();
  private rolesService = inject(RolesService);


  constructor(
    private http: HttpClient,
    private sessionStorage: SessionStorageService
  ) {
    this.currentUserSubject = new BehaviorSubject<User | null>(
      this.sessionStorage.getItem<User>('currentUser')
    );
    this.currentUser = this.currentUserSubject.asObservable();

    const savedRole = localStorage.getItem('userRole');
    if (savedRole) {
      this.currentUserRole.next(JSON.parse(savedRole));
    }
  }

  setUserRole(role: Role) {
    // Clear permission cache when role changes
    this.permissionCache.clear();
    localStorage.setItem('userRole', JSON.stringify(role));
    this.currentUserRole.next(role);
  }

  getUserRole(): Observable<Role | null> {
    return this.currentUserRole.asObservable();
  }

  getCurrentRole(): Role | null {
    return this.currentUserRole.getValue();
  }

  /**
   * Check if user has a specific permission
   * @param requiredPermission - Permission code (e.g., 'hotel.reservations.view') or array of codes
   */
  hasPermission(requiredPermission: string | string[]): boolean {
    const userRole = this.currentUserRole.getValue();
    if (!userRole) return false;

    // Handle array of permissions (checks if user has ANY of the permissions)
    if (Array.isArray(requiredPermission)) {
      return requiredPermission.some(permission => this.checkSinglePermission(permission));
    }

    return this.checkSinglePermission(requiredPermission);
  }

  private checkSinglePermission(permissionCode: string): boolean {
    // Check cache first
    if (this.permissionCache.has(permissionCode)) {
      return this.permissionCache.get(permissionCode) || false;
    }

    const userRole = this.currentUserRole.getValue();
    if (!userRole || !userRole.permissions) return false;

    // Check for exact permission match by code
    const hasPermission = userRole.permissions.some(p => p.code === permissionCode);

    // Cache the result
    this.permissionCache.set(permissionCode, hasPermission);
    
    return hasPermission;
  }

  /**
   * Check if user has ALL of the specified permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * Check if user has ANY of the specified permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Get permissions by module
   */
  getPermissionsByModule(moduleName: string): Permission[] {
    const userRole = this.currentUserRole.getValue();
    if (!userRole || !userRole.permissions) return [];

    return userRole.permissions.filter(permission => 
      permission.module.toLowerCase() === moduleName.toLowerCase()
    );
  }

  /**
   * Check if user has any permissions for a module
   */
  hasModuleAccess(moduleName: string): boolean {
    return this.getPermissionsByModule(moduleName).length > 0;
  }

  clearPermissions() {
    this.permissionCache.clear();
    localStorage.removeItem('userRole');
    this.currentUserRole.next(null);
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /** Patches the cached session user (both the in-memory subject and sessionStorage) without a re-login. */
  updateCurrentUser(partial: Partial<User>): void {
    const current = this.currentUserSubject.value;
    if (!current) return;
    const updated = { ...current, ...partial };
    this.sessionStorage.setItem('currentUser', updated);
    this.currentUserSubject.next(updated);
  }

  /**
   * Self-toggled "I'm on duty" — gates who gets alerted about new table orders.
   *
   * The API runs on a dyno that sleeps when idle, and the first request after
   * that can exceed the platform's 30s gateway limit and come back 504. The
   * browser reports a timed-out CORS preflight as "Method PATCH is not allowed
   * by Access-Control-Allow-Methods" — the headers are correct, they just
   * never arrived — so this looked like a CORS/verb problem and isn't one.
   * Switching to PUT would change nothing: a request carrying an
   * Authorization header and a JSON body is preflighted whatever the verb.
   *
   * Retrying is the fix that matches the cause. The first attempt is what
   * wakes the dyno, so a retry a few seconds later usually lands on a warm
   * server. Only retried for gateway/network failures — a 401 or 403 is a real
   * answer and is passed straight through.
   */
  toggleDuty(isOnDuty: boolean): Observable<{ isOnDuty: boolean }> {
    return this.http
      .patch<{ isOnDuty: boolean }>(`${environment.apiUrl}/merchants/me/duty`, { isOnDuty })
      .pipe(
        retry({
          count: 2,
          delay: (error: HttpErrorResponse, retryCount: number) => {
            const isTransient = error.status === 504 || error.status === 502 || error.status === 0;
            if (!isTransient) {
              return throwError(() => error);
            }
            console.warn(`⏳ Duty toggle attempt ${retryCount} failed (${error.status}) — server may be waking, retrying…`);
            return timer(retryCount * 4000);
          },
        }),
        map((res) => {
          this.updateCurrentUser({ isOnDuty: res.isOnDuty });
          return res;
        }),
      );
  }

  login(email: string, password: string): Observable<User> {
    return this.http.post<{access_token: string, user: User}>(`${environment.apiUrl}/auth/login?user=merchant`, { email, password })
      .pipe(map(response => {
        console.log(response.user);
        this.sessionStorage.setItem('currentUser', response.user);
        this.sessionStorage.setItem('auth_token', response.access_token);
        this.currentUserSubject.next(response.user);
        return response.user;
      }));
  }

  signup(userData: Partial<User>): Observable<User> {
    return this.http.post<User>(`${environment.apiUrl}/merchants`, userData)
      .pipe(map(response => {
        return response;
      }));
  }

  logout() {
    // Clear role access from RolesService
    this.rolesService.clearAccess();
    this.sessionStorage.removeItem('currentUser');
    this.sessionStorage.clearAll()
    this.currentUserSubject.next(null);
  }

  resetPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/rest-password`, { email }, { 
      params: { userType: 'merchant' } 
    });
  }

  verifyResetToken(email: string, resetToken: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-code`, { email, resetToken }, {
      params: { userType: 'merchant' }
    });
  }

  updatePassword(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/update-password`, { email, newPassword: password }, {
      params: { userType: 'merchant' }
    });
  }

  changePassword(email: string, currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, { 
      email, 
      currentPassword, 
      newPassword 
    }, {
      params: { userType: 'merchant' }
    });
  }
}
