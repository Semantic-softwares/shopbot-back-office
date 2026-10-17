import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type IssueSeverity = 'blocker' | 'warning' | 'info';
export type StepStatus = 'pending' | 'ok' | 'warning' | 'blocked' | 'failed';

export interface AuditIssue {
  code: string;
  severity: IssueSeverity;
  message: string;
  count?: number;
  refs?: Array<{ id: string; label: string }>;
}

export interface AuditStep {
  key: 'pre_checks' | 'no_shows' | 'post_room_tax' | 'sync_orders' | 'reconcile_payments' | 'trial_balance' | 'report_pack';
  status: StepStatus;
  summary?: string;
  startedAt?: string;
  finishedAt?: string;
  data?: any;
  issues: AuditIssue[];
}

export interface TrialBalance {
  opening: number;
  debits: number;
  credits: number;
  closing: number;
  debitsByType: Record<string, number>;
  creditsByType: Record<string, number>;
  buckets: Record<'inHouse' | 'advance' | 'departed' | 'closed', { count: number; owed: number; credit: number; net: number }>;
  difference: number;
  balanced: boolean;
}

export interface AuditSnapshot {
  businessDate: string;
  generatedAt: string;
  flash: {
    occupancy: number | null; roomsSold: number; sellableRooms: number; adr: number | null; revpar: number | null;
    roomRevenue: number; taxes: number; fees: number; arrivals: number; departures: number; guests: number; noShows: number;
  } | null;
  revenueByCode: Array<{ code: string; amount: number }>;
  paymentsByMethod: Record<string, number>;
  shifts: Array<{ id: string; user: string; counted?: number; expected?: number; variance?: number }>;
  trialBalance: TrialBalance | null;
  overrides: Array<{ code: string; reason: string }>;
}

export interface AuditRun {
  _id: string;
  businessDate: string;
  status: 'open' | 'running' | 'blocked' | 'closed';
  trigger: 'manual' | 'auto';
  steps: AuditStep[];
  overrides: Array<{ code: string; reason: string; by: string; at: string }>;
  snapshot?: AuditSnapshot;
  closedBy?: string;
  closedAt?: string;
  nextBusinessDate?: string;
  startedAt?: string;
}

export interface AuditStatus {
  enabled: boolean;
  businessDate: string;
  run: AuditRun | null;
  lastClosed: { businessDate: string; closedAt: string; closedBy: string; trigger: string } | null;
  preflight: AuditIssue[];
}

export interface AuditSettings {
  enabled: boolean;
  businessDate: string;
  autoRun: boolean;
  autoRunTime: string;
  noShowFee: { enabled: boolean; mode: 'first_night' | 'fixed'; amount: number };
  cashVarianceTolerance: number;
}

/** The night auditor's API: checklist, run, sign-off, close, history and settings for one store. */
@Injectable({ providedIn: 'root' })
export class NightAuditService {
  private http = inject(HttpClient);
  private base = (storeId: string) => `${environment.apiUrl}/stores/${storeId}/night-audit`;

  status(storeId: string): Observable<AuditStatus> {
    return this.http.get<AuditStatus>(`${this.base(storeId)}/status`);
  }
  run(storeId: string): Observable<AuditRun> {
    return this.http.post<AuditRun>(`${this.base(storeId)}/run`, {});
  }
  close(storeId: string): Observable<AuditRun> {
    return this.http.post<AuditRun>(`${this.base(storeId)}/close`, {});
  }
  override(storeId: string, code: string, reason: string): Observable<AuditRun> {
    return this.http.post<AuditRun>(`${this.base(storeId)}/override`, { code, reason });
  }
  history(storeId: string): Observable<AuditRun[]> {
    return this.http.get<AuditRun[]>(`${this.base(storeId)}/runs`);
  }
  getRun(storeId: string, id: string): Observable<AuditRun> {
    return this.http.get<AuditRun>(`${this.base(storeId)}/runs/${id}`);
  }
  settings(storeId: string): Observable<AuditSettings> {
    return this.http.get<AuditSettings>(`${this.base(storeId)}/settings`);
  }
  saveSettings(storeId: string, patch: Partial<AuditSettings> & { startDate?: string }): Observable<AuditSettings> {
    return this.http.put<AuditSettings>(`${this.base(storeId)}/settings`, patch);
  }
}
