import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Permission } from '../models/permission.model';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private apiUrl = `${environment.apiUrl}/permissions`;
  private http = inject(HttpClient);

  private permissions = signal<Set<string>>(new Set());

  setPermissions(perms: string[]) {
    this.permissions.set(new Set(perms));
  }

  has(permission: string): boolean {
    return this.permissions().has(permission);
  }

  hasAny(perms: string[]): boolean {
    return perms.some(p => this.permissions().has(p));
  }

  hasAll(perms: string[]): boolean {
    return perms.every(p => this.permissions().has(p));
  }
}
