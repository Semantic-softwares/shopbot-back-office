

import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {  Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models';
import { Employee } from '../models/employee.model';

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

  public getStoreMerchants(storeId:string ) : Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.hostServer}/merchants/find-by-store/${storeId}`);
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