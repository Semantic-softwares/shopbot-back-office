import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FiscalisationOverview, MraActivity, MraActivityInvoice, MraActivityBucket, MraAuditEntry, MraBusiness, MraRegistration, MraTestDriveStatus, MraTestUserKind, MraView } from '../models/mra-einvoicing.model';

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

  /** The owner confirms MRA's portal shows this EBS in Test Drive mode. Shopbot can't read or change the portal. */
  confirmPortalMode(storeId: string): Observable<MraView> {
    return this.http.post<MraView>(`${this.base(storeId)}/testing/confirm-portal-mode`, {});
  }

  /** Starts the Test Drive in the background. */
  startTesting(storeId: string): Observable<MraView> {
    return this.http.post<MraView>(`${this.base(storeId)}/testing/start`, {});
  }

  testingStatus(storeId: string): Observable<MraTestDriveStatus | { role: 'MEMBER' }> {
    return this.http.get<MraTestDriveStatus | { role: 'MEMBER' }>(`${this.base(storeId)}/testing`);
  }

  resetTesting(storeId: string): Observable<MraView> {
    return this.http.post<MraView>(`${this.base(storeId)}/testing/reset`, {});
  }

  /** `portalShowsAllPassed` is the owner's confirmation that MRA's portal shows every scenario passed. */
  submitOnboarding(storeId: string, portalShowsAllPassed: boolean): Observable<MraView> {
    return this.http.post<MraView>(`${this.base(storeId)}/onboarding/submit`, { portalShowsAllPassed });
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

  /** What has happened to this place of business's sales at MRA. By default only what needs the owner. */
  activity(storeId: string, bucket?: MraActivityBucket): Observable<MraActivity> {
    return this.http.get<MraActivity>(`${this.base(storeId)}/activity`, { params: bucket ? { bucket } : {} });
  }

  /** Releases an invoice of uncertain outcome for resending, after the owner checked MRA's portal. */
  releaseInvoice(storeId: string, invoice: string, note: string, confirmation: string): Observable<MraActivityInvoice> {
    return this.http.post<MraActivityInvoice>(`${this.base(storeId)}/activity/${encodeURIComponent(invoice)}/release`, { note, confirmation });
  }

  audit(storeId: string): Observable<MraAuditEntry[]> {
    return this.http.get<MraAuditEntry[]>(`${this.base(storeId)}/audit`);
  }
}
