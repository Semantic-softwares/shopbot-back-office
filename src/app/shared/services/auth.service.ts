import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { SessionStorageService } from './session-storage.service';
import { Role } from '../models/role.model';
import { Permission } from '../models/permission.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserRole = new BehaviorSubject<Role | null>(null);
  private permissionCache: Map<string, boolean> = new Map();

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

  login(email: string, password: string): Observable<User> {
    return this.http.post<{access_token: string, user: User}>(`${environment.apiUrl}/auth/login?user=merchant`, { email, password })
      .pipe(map(response => {
        this.sessionStorage.setItem('currentUser', response.user);
        this.sessionStorage.setItem('auth_token', response.access_token);
        this.currentUserSubject.next(response.user);
        return response.user;
      }));
  }

  signup(userData: Partial<User>): Observable<User> {
    return this.http.post<{token: string, user: User}>(`${environment.apiUrl}/auth/signup`, userData)
      .pipe(map(response => {
        return response.user;
      }));
  }

  logout() {
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
