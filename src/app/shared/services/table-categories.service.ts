import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TableCategory } from '../models/table-category.model';

@Injectable({ providedIn: 'root' })
export class TableCategoryService {

  private hostServer: string = environment.apiUrl;
  private _httpClient = inject(HttpClient);

  public getStoreTableCategories(storeId: string): Observable<TableCategory[]> {
    return this._httpClient.get<TableCategory[]>(`${this.hostServer}/table-categories/store/${storeId}`);
  }

  public deleteTableCategory(id: string) {
    return this._httpClient.delete(`${this.hostServer}/table-categories/${id}`);
  }

  public createTableCategory(params: Partial<TableCategory>) {
    return this._httpClient.post(`${this.hostServer}/table-categories`, params);
  }

  public updateTableCategory(tableCategoryId: string, tableCategoryParams: TableCategory | any) {
    return this._httpClient.put(`${this.hostServer}/table-categories/${tableCategoryId}`, tableCategoryParams);
  }

}
