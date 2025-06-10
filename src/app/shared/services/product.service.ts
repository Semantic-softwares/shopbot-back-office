import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, Option, OptionItem } from '../models';

@Injectable({providedIn: 'root'})
export class ProductService  {
  
  private hostServer: string = environment.apiUrl;

  /**
   * Constructor
   *
   * @param {HttpClient} _httpClient
   */
  constructor(
    private _httpClient: HttpClient
  ) {
    // Set the defaults
  }


  getProduct(productId:string): Observable<Product> {
   return this._httpClient.get<Product>(`${this.hostServer}/foods/${productId}`)
  }

  getCategoryProducts(categoryId:string): Observable<Product[]> {
   return this._httpClient.get<Product[]>(`${this.hostServer}/foods/${categoryId}/category/products`)
  }

  getStoreProducts(storeId:string): Observable<Product[]> {
    return this._httpClient.get<Product[]>(`${this.hostServer}/foods/${storeId}/store/products`)
  }

  getStoreGroupOption(storeId:string): Observable<Option[]> {
    return this._httpClient.get<Option[]>(`${this.hostServer}/option-groups/${storeId}/store/option-groups`)
  }

  getStoreOptions(storeId:string): Observable<OptionItem[]> {
    return this._httpClient.get<OptionItem[]>(`${this.hostServer}/option-items/${storeId}/store/option-group-items`)
  }

  getGroupOptionItems(variantId:string): Observable<Option[]> {
    return this._httpClient.get<Option[]>(`${this.hostServer}/option-items/${variantId}/option-group/option-group-items`)
  }

  createVariant(option:Option): Observable<Option> {
    return this._httpClient.post<Option>(`${this.hostServer}/option-groups`, option)
  }

  saveOption(option:OptionItem): Observable<OptionItem> {
    return this._httpClient.post<OptionItem>(`${this.hostServer}/option-items`, option)
  }

  updateOption(option: Partial<OptionItem>, id:string): Observable<OptionItem> {
    return this._httpClient.put<OptionItem>(`${this.hostServer}/option-items/${id}`, option)
  }

  updateVariant(params:any, id:string): Observable<Option> {
    return this._httpClient.put<Option>(`${this.hostServer}/option-groups/${id}`, params)
  }

  deleteProduct(productId: string): Observable<any> {
    return this._httpClient.delete(`${this.hostServer}/foods/${productId}`)
  }

  deleteVariant(id:string): Observable<Option> {
    return this._httpClient.delete<Option>(`${this.hostServer}/option-groups/${id}`)
  }

  addProductIdToVariant(id:string, params:object): Observable<Option> {
    return this._httpClient.put<Option>(`${this.hostServer}/option-groups/${id}/product/group-options`, params)
  }

  removeProductIdFromVariant(variantId:string, productId:string): Observable<Option> {
    return this._httpClient.put<Option>(`${this.hostServer}/option-groups/${variantId}/product/group-options/remove`, { productId })
  }

  deleteOptionItem(id:string): Observable<OptionItem> {
    return this._httpClient.delete<OptionItem>(`${this.hostServer}/option-items/${id}`)
  }

  getProductOptions(productId: string): Observable<Option[]> {
    return this._httpClient.get<Option[]>(`${this.hostServer}/option-groups/${productId}/product/option-groups`);
  }

  /**
   * upload product
   *
   * @param formData
   * @returns {Promise<any>}
   */
  uploadPhoto(formData: any, id?: string): Observable<any> {
    return this._httpClient.post(`${this.hostServer}/foods/upload/${id}`, formData, {
      reportProgress: true,
      observe: 'events'
    })
  }

  /**
 * Save product
 *
 * @param product
 * @returns {Promise<any>}
 */
  saveProduct(product: Partial<Product>, id: string): Observable<any> {
    return this._httpClient.put(`${this.hostServer}/foods/${id}`, product)
  }

  /**
   * Add product
   *
   * @param product
   * @returns {Observable<any>}
   */
  addProduct(product: any): Observable<Product> {
    return this._httpClient.post<Product>(`${this.hostServer}/foods`, product)
  }
}
