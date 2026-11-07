import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionReconciliation, StoreMovement, StoreRegisterReport, TerminalInfo, TerminalStaff } from './register.models';
import { CashMovement, CloseSummary, CountRequest, CountRow, CurrentRegister, MovementType, Register, RegisterReport, RegisterSession, RegisterSettings } from './register.models';

/** Thin wrapper over the register routes. Every amount is whole minor units. */
@Injectable({ providedIn: 'root' })
export class RegisterApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/registers`;

  settings(storeId: string): Observable<{ settings: RegisterSettings; currencyCode: string | null }> {
    return this.http.get<{ settings: RegisterSettings; currencyCode: string | null }>(`${this.base}/store/${storeId}/settings`);
  }

  updateSettings(storeId: string, body: Partial<RegisterSettings>): Observable<{ settings: RegisterSettings; currencyCode: string | null }> {
    return this.http.patch<{ settings: RegisterSettings; currencyCode: string | null }>(`${this.base}/store/${storeId}/settings`, body);
  }

  registers(storeId: string): Observable<Register[]> {
    return this.http.get<Register[]>(`${this.base}/store/${storeId}/registers`);
  }

  createRegister(storeId: string, body: { name: string; code: string; operatingMode?: 'individual' | 'shared'; acceptsCash?: boolean }): Observable<Register> {
    return this.http.post<Register>(`${this.base}/store/${storeId}/registers`, body);
  }

  updateRegister(storeId: string, registerId: string, body: Partial<Pick<Register, 'name' | 'operatingMode' | 'acceptsCash' | 'isActive'>>): Observable<Register> {
    return this.http.patch<Register>(`${this.base}/store/${storeId}/registers/${registerId}`, body);
  }

  /** The live session the signed-in cashier is on. The server answers with an empty body when there is none. */
  current(storeId: string): Observable<CurrentRegister | Record<string, never>> {
    return this.http.get<CurrentRegister | Record<string, never>>(`${this.base}/store/${storeId}/sessions/current`);
  }

  open(storeId: string, body: { registerId: string; openingFloatMinor?: number; openingDenominations?: CountRow[]; openingNotes?: string; clientSessionId?: string; deviceId?: string }): Observable<{ session: RegisterSession; assignment: unknown; joined: boolean }> {
    return this.http.post<{ session: RegisterSession; assignment: unknown; joined: boolean }>(`${this.base}/store/${storeId}/sessions/open`, body);
  }

  sessions(storeId: string, query: Record<string, string | undefined> = {}): Observable<{ data: RegisterSession[]; total: number; page: number; limit: number }> {
    const params = Object.entries(query).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
    return this.http.get<{ data: RegisterSession[]; total: number; page: number; limit: number }>(`${this.base}/store/${storeId}/sessions${params ? `?${params}` : ''}`);
  }

  sessionDetail(sessionId: string): Observable<{ session: RegisterSession; assignments: unknown[]; audit?: unknown[] }> {
    return this.http.get<{ session: RegisterSession; assignments: unknown[]; audit?: unknown[] }>(`${this.base}/sessions/${sessionId}`);
  }

  addMovement(storeId: string, sessionId: string, body: { type: Exclude<MovementType, 'cash_refund' | 'cash_transfer_in' | 'cash_transfer_out'>; amountMinor: number; reason: string; referenceType?: string; referenceId?: string; idempotencyKey?: string; deviceId?: string; clientAt?: string }): Observable<{ movement: CashMovement; replayed: boolean }> {
    return this.http.post<{ movement: CashMovement; replayed: boolean }>(`${this.base}/store/${storeId}/sessions/${sessionId}/movements`, body);
  }

  movements(storeId: string, sessionId: string): Observable<CashMovement[]> {
    return this.http.get<CashMovement[]>(`${this.base}/store/${storeId}/sessions/${sessionId}/movements`);
  }

  reverseMovement(storeId: string, movementId: string, reason: string): Observable<{ movement: CashMovement }> {
    return this.http.post<{ movement: CashMovement }>(`${this.base}/store/${storeId}/movements/${movementId}/reverse`, { reason });
  }

  xReport(storeId: string, sessionId: string): Observable<RegisterReport> {
    return this.http.get<RegisterReport>(`${this.base}/store/${storeId}/sessions/${sessionId}/x-report`);
  }

  zReport(storeId: string, sessionId: string): Observable<RegisterReport> {
    return this.http.get<RegisterReport>(`${this.base}/store/${storeId}/sessions/${sessionId}/z-report`);
  }

  spotCount(storeId: string, sessionId: string, body: CountRequest): Observable<unknown> {
    return this.http.post(`${this.base}/store/${storeId}/sessions/${sessionId}/count`, body);
  }

  handover(storeId: string, sessionId: string, body: { toCashierId: string; count?: CountRequest; notes?: string; clientEventId?: string }): Observable<unknown> {
    return this.http.post(`${this.base}/store/${storeId}/sessions/${sessionId}/handover`, body);
  }

  /** `deviceId` is this till: it is the one closing, so it is never counted as "another till" still to sync. */
  closeStart(storeId: string, sessionId: string, deviceId?: string): Observable<CloseSummary> {
    return this.http.post<CloseSummary>(`${this.base}/store/${storeId}/sessions/${sessionId}/close/start`, {}, { params: deviceId ? { deviceId } : {} });
  }

  closeCancel(storeId: string, sessionId: string): Observable<RegisterSession> {
    return this.http.post<RegisterSession>(`${this.base}/store/${storeId}/sessions/${sessionId}/close/cancel`, {});
  }

  close(storeId: string, sessionId: string, body: CountRequest & { deviceId?: string; closeAnyway?: boolean }): Observable<{ session: RegisterSession; replayed?: boolean; pendingApproval?: boolean; varianceMinor?: number; expectedCashMinor?: number; actualCashMinor?: number; drift?: unknown }> {
    return this.http.post<{ session: RegisterSession; replayed?: boolean; pendingApproval?: boolean; varianceMinor?: number; expectedCashMinor?: number; actualCashMinor?: number; drift?: unknown }>(`${this.base}/store/${storeId}/sessions/${sessionId}/close`, body);
  }

  approveClose(storeId: string, sessionId: string, note?: string): Observable<{ session: RegisterSession }> {
    return this.http.post<{ session: RegisterSession }>(`${this.base}/store/${storeId}/sessions/${sessionId}/close/approve`, { note });
  }

  rejectClose(storeId: string, sessionId: string, reason: string): Observable<RegisterSession> {
    return this.http.post<RegisterSession>(`${this.base}/store/${storeId}/sessions/${sessionId}/close/reject`, { reason });
  }

  reconciliation(storeId: string, sessionId: string): Observable<unknown> {
    return this.http.get(`${this.base}/store/${storeId}/sessions/${sessionId}/reconciliation`);
  }

  /** What this till still has waiting for a session. The id may be the one the till made when it opened the register offline. */
  heartbeat(storeId: string, sessionId: string, body: { deviceId: string; pendingCount: number; hadActivity?: boolean }): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.base}/store/${storeId}/sessions/${sessionId}/heartbeat`, body);
  }

  // ---- store-level lists and reports (managers and reporters)
  storeMovements(storeId: string, query: Record<string, string | undefined> = {}): Observable<{ data: StoreMovement[]; total: number; page: number; limit: number }> {
    const params = Object.entries(query).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
    return this.http.get<{ data: StoreMovement[]; total: number; page: number; limit: number }>(`${this.base}/store/${storeId}/movements${params ? `?${params}` : ''}`);
  }

  storeReport(storeId: string, query: { from?: string; to?: string } = {}): Observable<StoreRegisterReport> {
    const params = Object.entries(query).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
    return this.http.get<StoreRegisterReport>(`${this.base}/store/${storeId}/report${params ? `?${params}` : ''}`);
  }

  reconciliationOf(storeId: string, sessionId: string): Observable<SessionReconciliation> {
    return this.http.get<SessionReconciliation>(`${this.base}/store/${storeId}/sessions/${sessionId}/reconciliation`);
  }

  // ---- shared terminals and PINs
  terminals(storeId: string): Observable<TerminalInfo[]> {
    return this.http.get<TerminalInfo[]>(`${this.base}/store/${storeId}/terminals`);
  }

  enrolTerminal(storeId: string, body: { deviceId: string; name: string; registerId?: string }): Observable<{ terminal: TerminalInfo; secret: string }> {
    return this.http.post<{ terminal: TerminalInfo; secret: string }>(`${this.base}/store/${storeId}/terminals`, body);
  }

  revokeTerminal(storeId: string, deviceId: string): Observable<TerminalInfo> {
    return this.http.delete<TerminalInfo>(`${this.base}/store/${storeId}/terminals/${deviceId}`);
  }

  setOwnPin(storeId: string, pin: string): Observable<{ ok: boolean }> {
    return this.http.put<{ ok: boolean }>(`${this.base}/store/${storeId}/pin`, { pin });
  }

  resetPin(storeId: string, userId: string, pin: string): Observable<{ ok: boolean }> {
    return this.http.put<{ ok: boolean }>(`${this.base}/store/${storeId}/pin/${userId}`, { pin });
  }

  terminalStaff(storeId: string, deviceId: string, secret: string): Observable<TerminalStaff[]> {
    return this.http.get<TerminalStaff[]>(`${this.base}/store/${storeId}/terminal/staff?deviceId=${encodeURIComponent(deviceId)}`, { headers: { 'X-Terminal-Secret': secret } });
  }

  terminalSwitch(storeId: string, deviceId: string, secret: string, userId: string, pin: string): Observable<{ token: string; user: { id: string; name: string | null } }> {
    return this.http.post<{ token: string; user: { id: string; name: string | null } }>(`${this.base}/store/${storeId}/terminal/switch`, { deviceId, userId, pin }, { headers: { 'X-Terminal-Secret': secret } });
  }

  reconcile(storeId: string, sessionId: string, note?: string): Observable<RegisterSession> {
    return this.http.post<RegisterSession>(`${this.base}/store/${storeId}/sessions/${sessionId}/reconcile`, { note });
  }
}
