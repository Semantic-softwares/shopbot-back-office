import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {  Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category } from '../models';

@Injectable({providedIn: 'root'})
export class CategoryService  {

  private hostServer: string = environment.apiUrl;
 private _httpClient = inject(HttpClient)

  getStoreMenus(storeId: string): Observable<Category[]> {
   return this._httpClient.get<Category[]>(`${this.hostServer}/menus/${storeId}/store/categories`)
  }

  deleteMenu(id: string) {
    return this._httpClient.delete(`${this.hostServer}/menus/${id}`)
  }

  createMenu(params: Category) {
    return this._httpClient.post(`${this.hostServer}/menus`, params)
  }

  updateMenu(menuId: string, menusParams: Category | any) {
    return this._httpClient.put(`${this.hostServer}/menus/${menuId}`, menusParams)
  }

}
