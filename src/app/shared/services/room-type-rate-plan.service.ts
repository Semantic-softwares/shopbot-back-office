import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface RoomType {
  id: string;
  title: string;
  position: number;
  occ_adults: number;
  occ_children: number;
  occ_infants: number;
  default_occupancy: number;
}

export interface RatePlan {
  id: string;
  title: string;
  position?: number;
  room_type_id?: string;
  rate_plan_id?: string;
}

export interface RoomTypeWithRatePlans extends RoomType {
  ratePlans: RatePlan[];
}

@Injectable({
  providedIn: 'root',
})
export class RoomTypeRatePlanService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getRoomTypesOptions(propertyId: string): Observable<RoomType[]> {
    return this.http
      .get<any>(`${this.apiUrl}/admin/channex/room-types/options?propertyId=${propertyId}`)
      .pipe(
        map((response) => {
          // Handle response structure - response.data is the array from backend
          const dataArray = Array.isArray(response?.data) ? response.data : [];
          return dataArray.map((item: any) => ({
            id: item.id || item.attributes?.id,
            title: item.attributes?.title,
            position: item.attributes?.position,
            occ_adults: item.attributes?.occ_adults,
            occ_children: item.attributes?.occ_children,
            occ_infants: item.attributes?.occ_infants,
            default_occupancy: item.attributes?.default_occupancy,
          }));
        })
      );
  }

  getRatePlansOptions(
    propertyId: string,
    multiOccupancy = false
  ): Observable<RatePlan[]> {
    return this.http
      .get<any>(
        `${this.apiUrl}/admin/channex/rate-plans/options?propertyId=${propertyId}&multiOccupancy=${multiOccupancy}`
      )
      .pipe(
        map((response) => {
          // Handle response structure - response.data is the array from backend
          const dataArray = Array.isArray(response?.data) ? response.data : [];
          return dataArray.map((item: any) => ({
            id: item.id || item.attributes?.id,
            title: item.attributes?.title,
            position: item.attributes?.position,
            room_type_id: item.attributes?.room_type_id,
            rate_plan_id: item.attributes?.rate_plan_id,
          }));
        })
      );
  }

  getRoomTypesWithRatePlans(
    propertyId: string
  ): Observable<RoomTypeWithRatePlans[]> {
    return forkJoin({
      roomTypes: this.getRoomTypesOptions(propertyId),
      ratePlans: this.getRatePlansOptions(propertyId, false),
    }).pipe(
      map(({ roomTypes, ratePlans }) => {
        return roomTypes
          .map((roomType) => ({
            ...roomType,
            ratePlans: ratePlans.filter(
              (plan) => plan.room_type_id === roomType.id
            ),
          }))
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      })
    );
  }
}
