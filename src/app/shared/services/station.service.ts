import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {  Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Station } from '../models';

@Injectable({providedIn: 'root'})
export class StationsService {
  orders!: any[];
  private hostServer: string = environment.apiUrl;
  private _httpClient =  inject(HttpClient)
  
  createStation(station: Partial<Station>): Observable<Station> {
    return this._httpClient.post<Station>(`${this.hostServer}/stations`, station);
  }

  getStations(query: any): Observable<Station[]> {
    return this._httpClient.get<any[]>(
      `${this.hostServer}/stations`
    );
  }

  getStation(id:any): Observable<Station> {
    return this._httpClient.get<Station>(`${this.hostServer}/stations/${id}`);
  }

  updateStation(stationId: string, station: Partial<Station>): Observable<Station> {
    return this._httpClient.put<Station>(`${this.hostServer}/stations/${stationId}`, station);
  }

  deleteStation(stationId: string) {
    return this._httpClient.delete(`${this.hostServer}/stations/${stationId}`);
  }

  getStoreStations(storeId: string) {
    return this._httpClient.get<Station[]>(`${this.hostServer}/stations/store/${storeId}/stations`);
  }  
}
