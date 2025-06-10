import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class OrderService {
  public http = inject(HttpClient);
  
  public getTopSellingProducts(storeId:string, queryParams: any): Observable<any[]> {
    const params = new URLSearchParams(queryParams).toString();
    return this.http.get<any[]>(`${environment.apiUrl}/orders/store/${storeId}/top-products/selling?${params}`);
  }

  public getSalesSummary(storeId:string, queryParams: any): Observable<any> {
    const params = new URLSearchParams(queryParams).toString();
    return this.http.get<any>(`${environment.apiUrl}/orders/store/${storeId}/sales/selling?${params}`);
  }

   public getSalesSummaryByDate(storeId:string, queryParams: any): Observable<any> {
    const params = new URLSearchParams(queryParams).toString();
    return this.http.get<any>(`${environment.apiUrl}/orders/store/${storeId}/sales-summary-by-date/selling?${params}`);
  }

  public getTopSellingCategories(storeId:string, queryParams: any): Observable<any[]> {
    const params = new URLSearchParams(queryParams).toString();
    return this.http.get<any[]>(`${environment.apiUrl}/orders/store/${storeId}/category/selling?${params}`);
  }

  public getSalesByEmployees(storeId:string, queryParams: any): Observable<any[]> {
    const params = new URLSearchParams(queryParams).toString();
    return this.http.get<any[]>(`${environment.apiUrl}/orders/store/${storeId}/employee/selling?${params}`);
  }

  public getSalesByPaymentType(storeId:string, queryParams: any): Observable<any[]> {
    const params = new URLSearchParams(queryParams).toString();
    return this.http.get<any[]>(`${environment.apiUrl}/orders/store/${storeId}/payment-type/selling?${params}`);
  }

   public getSalesReceipts(storeId:string, queryParams: any): Observable<any> {
    const params = new URLSearchParams(queryParams).toString();
    return this.http.get<any>(`${environment.apiUrl}/orders/store/${storeId}/receipts/selling?${params}`);
  }

  

}
