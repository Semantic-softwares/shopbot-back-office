import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Table } from '../models/table.model';

@Injectable({
  providedIn: 'root'
})
export class TableService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getStoreTables(storeId: string): Observable<Table[]> {
    return this.http.get<Table[]>(`${this.baseUrl}/tables/store/${storeId}`);
  }

  createTable(table: Partial<Table>): Observable<Table> {
    return this.http.post<Table>(`${this.baseUrl}/tables`, table);
  }

  updateTable(tableId: string, table: Partial<Table>): Observable<Table> {
    return this.http.put<Table>(`${this.baseUrl}/tables/${tableId}`, table);
  }

  deleteTable(tableId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/tables/${tableId}`);
  }

  getTableById(tableId: string): Observable<Table> {
    return this.http.get<Table>(`${this.baseUrl}/tables/${tableId}`);
  }
}
