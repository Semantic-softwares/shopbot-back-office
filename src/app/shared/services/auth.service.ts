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

  hasPermission(requiredPermission: string | string[]): boolean {
    const userRole = this.currentUserRole.getValue();
    if (!userRole) return false;

    // Handle array of permissions (checks if user has ANY of the permissions)
    if (Array.isArray(requiredPermission)) {
      return requiredPermission.some(permission => this.checkSinglePermission(permission));
    }

    return this.checkSinglePermission(requiredPermission);
  }

  private checkSinglePermission(permission: string): boolean {
    // Check cache first
    if (this.permissionCache.has(permission)) {
      return this.permissionCache.get(permission) || false;
    }

    const userRole = this.currentUserRole.getValue();
    if (!userRole) return false;

    // Split permission string (e.g., "manage_user" becomes ["manage", "user"])
    const [action, resource] = permission.toLowerCase().split('_');

    // Check for exact permission match
    const hasExactPermission = userRole.permissions.some(p => 
      p.action.toLowerCase() === action &&
      p.resource.toLowerCase() === resource
    );

    // Check for wildcard permissions (e.g., "manage_all" or "all_user")
    const hasWildcardPermission = userRole.permissions.some(p => 
      (p.action.toLowerCase() === 'all' && p.resource.toLowerCase() === resource) ||
      (p.action.toLowerCase() === action && p.resource.toLowerCase() === 'all') ||
      (p.action.toLowerCase() === 'all' && p.resource.toLowerCase() === 'all')
    );

    const result = hasExactPermission || hasWildcardPermission;
    
    // Cache the result
    this.permissionCache.set(permission, result);
    
    return result;
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  getPermissionsByCategory(categoryName: string): Permission[] {
    const userRole = this.currentUserRole.getValue();
    if (!userRole) return [];

    return userRole.permissions.filter(permission => 
      permission.categoryId.name.toLowerCase() === categoryName.toLowerCase()
    );
  }

  hasCategory(categoryName: string): boolean {
    const userRole = this.currentUserRole.getValue();
    if (!userRole) return false;

    return userRole.permissions.some(permission => 
      permission.categoryId.name.toLowerCase() === categoryName.toLowerCase()
    );
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

  updatePassword(userId: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${userId}/reset-password`, { password });
  }
}
