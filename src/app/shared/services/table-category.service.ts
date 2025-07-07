import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TableCategory } from '../models/table-category.model';

@Injectable({
  providedIn: 'root'
})
export class TableCategoryService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getStoreTableCategories(storeId: string): Observable<TableCategory[]> {
    return this.http.get<TableCategory[]>(`${this.baseUrl}/table-categories/store/${storeId}`);
  }

  createTableCategory(category: Partial<TableCategory>): Observable<TableCategory> {
    return this.http.post<TableCategory>(`${this.baseUrl}/table-categories`, category);
  }

  updateTableCategory(categoryId: string, category: Partial<TableCategory>): Observable<TableCategory> {
    return this.http.put<TableCategory>(`${this.baseUrl}/table-categories/${categoryId}`, category);
  }

  deleteTableCategory(categoryId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/table-categories/${categoryId}`);
  }

  getTableCategoryById(categoryId: string): Observable<TableCategory> {
    return this.http.get<TableCategory>(`${this.baseUrl}/table-categories/${categoryId}`);
  }
}
