import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FiscalisationOverview, MraAuditEntry, MraBusiness, MraRegistration, MraTestUserKind, MraView } from '../models/mra-einvoicing.model';

/**
 * A business's MRA e-invoicing setup. All secrets stay on the backend: this
 * service sends the MRA password once (write-only) and never receives it back.
 */
@Injectable({ providedIn: 'root' })
export class MraEinvoicingService {
  private http = inject(HttpClient);
  private api: string = environment.apiUrl;

  /** Whether the current store's country has a tax-authority integration; drives the settings nav. */
  readonly overview = signal<FiscalisationOverview | null>(null);

  loadOverview(storeId: string): Observable<FiscalisationOverview> {
    return this.http.get<FiscalisationOverview>(`${this.api}/revenue-authority/stores/${storeId}`).pipe(tap((o) => this.overview.set(o)));
  }

  private base(storeId: string): string {
    return `${this.api}/mra/onboarding/stores/${storeId}`;
  }

  get(storeId: string): Observable<MraView> {
    return this.http.get<MraView>(this.base(storeId));
  }

  saveBusiness(storeId: string, business: Partial<MraBusiness>): Observable<MraView> {
    return this.http.put<MraView>(`${this.base(storeId)}/business`, business);
  }

  saveRegistration(storeId: string, registration: MraRegistration): Observable<MraView> {
    return this.http.put<MraView>(`${this.base(storeId)}/registration`, registration);
  }

  /** The MRA Transmission User. The password is sent once and never comes back. */
  saveTransmissionUser(storeId: string, body: { username: string; password: string }): Observable<MraView> {
    return this.http.put<MraView>(`${this.base(storeId)}/transmission-user`, body);
  }

  saveEbs(
    storeId: string,
    body: { ebsMraId: string; areaCode: string; placeOfBusinessReference: string; testUserKind: MraTestUserKind | ''; ebsRegistered: boolean },
  ): Observable<MraView> {
    return this.http.put<MraView>(`${this.base(storeId)}/ebs`, body);
  }

  resetTesting(storeId: string): Observable<MraView> {
    return this.http.post<MraView>(`${this.base(storeId)}/testing/reset`, {});
  }

  submitOnboarding(storeId: string): Observable<MraView> {
    return this.http.post<MraView>(`${this.base(storeId)}/onboarding/submit`, {});
  }

  approveOnboarding(storeId: string): Observable<MraView> {
    return this.http.post<MraView>(`${this.base(storeId)}/onboarding/approve`, {});
  }

  activateLive(storeId: string, confirmation: string): Observable<MraView> {
    return this.http.post<MraView>(`${this.base(storeId)}/live/activate`, { confirmation });
  }

  suspend(storeId: string, reason: string, confirmation: string): Observable<MraView> {
    return this.http.post<MraView>(`${this.base(storeId)}/live/suspend`, { reason, confirmation });
  }

  audit(storeId: string): Observable<MraAuditEntry[]> {
    return this.http.get<MraAuditEntry[]>(`${this.base(storeId)}/audit`);
  }
}
