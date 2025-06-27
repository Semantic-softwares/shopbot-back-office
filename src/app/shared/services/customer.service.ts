

import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {  Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  private http = inject(HttpClient)
  private hostServer: string = environment.apiUrl;


  validateEmailAndPhoneNumber({email, phoneNumber}: Partial<User>): Observable<any> {
    return this.http.post(`${this.hostServer}/auth/validate-email-and-phone?userType=merchant`, {email, phoneNumber})
  }

  public createCustomer(params: Partial<User> ) : Observable<Partial<User>> {
    return this.http.post<User>(`${this.hostServer}/users`, params);
  }

  public getStoreCustomers(storeId:string ) : Observable<User[]> {
    return this.http.get<User[]>(`${this.hostServer}/users/stores/${storeId}/users`);
  }


  public deleteCustomer(customerId:string): Observable<User> {
    return this.http.delete<User>(`${this.hostServer}/users/${customerId}`)
  }

  public updateCustomer(id:string, params: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.hostServer}/users/${id}`, params)
  }

}