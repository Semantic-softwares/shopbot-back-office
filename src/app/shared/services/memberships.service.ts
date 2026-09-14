import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Membership } from '../models/membership.model';

@Injectable({ providedIn: 'root' })
export class MembershipsService {
  private hostServer: string = environment.apiUrl;
  private _httpClient = inject(HttpClient);

  /** Every store the current logged-in merchant has active access to. */
  getMine(): Observable<Membership[]> {
    return this._httpClient.get<Membership[]>(`${this.hostServer}/memberships/mine`);
  }

  /** Pending invites for the current logged-in merchant. */
  getMinePending(): Observable<Membership[]> {
    return this._httpClient.get<Membership[]>(`${this.hostServer}/memberships/mine/pending`);
  }

  accept(membershipId: string): Observable<Membership> {
    return this._httpClient.patch<Membership>(`${this.hostServer}/memberships/${membershipId}/accept`, {});
  }

  decline(membershipId: string): Observable<{ success: boolean }> {
    return this._httpClient.delete<{ success: boolean }>(`${this.hostServer}/memberships/${membershipId}/decline`);
  }
}
