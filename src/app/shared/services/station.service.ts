import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {  Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Station, StationStatusStepInput } from '../models';

@Injectable({providedIn: 'root'})
export class StationsService {
  orders!: any[];
  private hostServer: string = environment.apiUrl;
  private _httpClient =  inject(HttpClient)
  
  createStation(station: Partial<Station>): Observable<Station> {
    return this._httpClient.post<Station>(`${this.hostServer}/stations`, station);
  }

  getStations(storeId: string): Observable<Station[]> {
    return this._httpClient.get<Station[]>(
      `${this.hostServer}/stations/store/${storeId}/stations`
    );
  }

  getStation(id:any): Observable<Station> {
    return this._httpClient.get<Station>(`${this.hostServer}/stations/${id}`);
  }

  updateStation(stationId: string, station: Partial<Station>): Observable<Station> {
    return this._httpClient.put<Station>(`${this.hostServer}/stations/${stationId}`, station);
  }

  /**
   * Save a station's KDS status flow via the generic PUT /stations/:id. Only
   * keys (in order) and optional shortcuts are sent; the backend normalizes
   * (derives labels, renumbers order, marks the last step terminal).
   */
  updateStationStatusFlow(stationId: string, statusFlow: StationStatusStepInput[]): Observable<Station> {
    return this._httpClient.put<Station>(`${this.hostServer}/stations/${stationId}`, { statusFlow });
  }

  deleteStation(stationId: string) {
    return this._httpClient.delete(`${this.hostServer}/stations/${stationId}`);
  }

  getStoreStations(storeId: string) {
    return this._httpClient.get<Station[]>(`${this.hostServer}/stations/store/${storeId}/stations`);
  }  
}
