

import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {  Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models';
import { Employee } from '../models/employee.model';
import { TeamMember } from '../models/membership.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private http = inject(HttpClient)
  private hostServer: string = environment.apiUrl;

  public resetPassword(params: any) {
    return this.http.post(`${this.hostServer}/auth/rest-password?userType=merchant`, params)
  }

  public verifyCode(params: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.hostServer}/auth/verify-code?userType=merchant`, params);
  }

  changePassword(params: any) {
    return this.http.post(`${this.hostServer}/auth/update-password?userType=merchant`, params)
  }

  validateEmailAndPhoneNumber({email, phoneNumber}: Partial<User>): Observable<any> {
    return this.http.post(`${this.hostServer}/auth/validate-email-and-phone?userType=merchant`, {email, phoneNumber})
  }

  public createMerchant(params: Partial<Employee> ) : Observable<Partial<Employee>> {
    return this.http.post<Employee>(`${this.hostServer}/merchants`, params);
  }

  /** Preview a staff invite before showing the set-password form. */
  public getInvitePreview(token: string): Observable<{ name: string; email: string }> {
    return this.http.get<{ name: string; email: string }>(`${this.hostServer}/merchants/invite/${token}`);
  }

  /** Consumes the invite token and sets the invited person's first password. */
  public acceptInvite(token: string, password: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.hostServer}/merchants/invite/${token}/accept`, { password });
  }

  public getStoreMerchants(storeId:string ) : Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.hostServer}/merchants/find-by-store/${storeId}`);
  }

  /**
   * The Team settings page's data source — one row per Membership at this
   * store (ACTIVE/INVITED/SUSPENDED), each flagged with isOwner so the page
   * knows whose row can never offer a delete/deactivate action.
   */
  public getTeamForStore(storeId: string): Observable<TeamMember[]> {
    return this.http.get<TeamMember[]>(`${this.hostServer}/merchants/store/${storeId}/team`);
  }

  /**
   * "Remove from workspace" — deletes only this person's Membership for
   * THIS store. Their Merchant/login account and any other store
   * memberships are untouched, unlike the full-account deleteMerchant()
   * above (kept as-is for the other, unrelated screens still using it).
   */
  public removeStaffFromStore(merchantId: string, storeId: string): Observable<any> {
    return this.http.delete(`${this.hostServer}/merchants/${merchantId}/stores/${storeId}`);
  }

  /**
   * "Deactivate"/"Activate" — suspends or reactivates access to ONE store
   * only. Never touches the merchant's account globally, so it can't lock
   * them out of other stores they belong to.
   */
  public setStaffStoreStatus(merchantId: string, storeId: string, status: 'ACTIVE' | 'SUSPENDED'): Observable<any> {
    return this.http.put(`${this.hostServer}/merchants/${merchantId}/stores/${storeId}/status`, { status });
  }


  public deleteMerchant(merchantId:string): Observable<Employee> {
    return this.http.delete<Employee>(`${this.hostServer}/merchants/${merchantId}`)
  }

  public updateMerchant(id:string, params: Partial<Employee>): Observable<Employee> {
    return this.http.put<Employee>(`${this.hostServer}/merchants/${id}`, params)
  }

  register(params:any): Observable<any> {
    return this.http.post(`${this.hostServer}/staffs`, params)
  }

  updatePassword(params:any) {
    return this.http.post(`${this.hostServer}/staffs/update/password`, params)
  }


}