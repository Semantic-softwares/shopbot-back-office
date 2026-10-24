import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AccountContext, AdminOverview, AdminStoreDetail, AdminStoreRow, AuditRow, BillingPlan, BillingSettingsV2, InvoiceV2, Paged, PaymentV2, PlanChangeQuote,
  SubStatus, TrialRow, UpgradeRequestRow,
} from '../models/platform-billing.model';

const params = (o: Record<string, any>): HttpParams => {
  let p = new HttpParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
  return p;
};

/** The platform billing API: what a store sees (`account`) and what a super admin does (`admin`). The server decides who may call which. */
@Injectable({ providedIn: 'root' })
export class PlatformBillingService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  // ---- a store's own billing

  plans(): Observable<{ plans: BillingPlan[]; trialDays: number }> {
    return this.http.get<{ plans: BillingPlan[]; trialDays: number }>(`${this.api}/billing/plans`);
  }
  context(): Observable<AccountContext> {
    return this.http.get<AccountContext>(`${this.api}/billing/account/context`);
  }
  isPlatformAdmin(): Observable<boolean> {
    return this.http.get<{ isPlatformAdmin: boolean }>(`${this.api}/billing/account/admin-status`).pipe(map((r) => r.isPlatformAdmin));
  }
  setModules(modules: string[]): Observable<{ modules: string[] }> {
    return this.http.put<{ modules: string[] }>(`${this.api}/billing/account/modules`, { modules });
  }
  invoices(limit = 24, skip = 0): Observable<{ invoices: InvoiceV2[]; total: number }> {
    return this.http.get<{ invoices: InvoiceV2[]; total: number }>(`${this.api}/billing/account/invoices`, { params: params({ limit, skip }) });
  }
  invoice(id: string): Observable<{ invoice: InvoiceV2; payments: PaymentV2[] }> {
    return this.http.get<{ invoice: InvoiceV2; payments: PaymentV2[] }>(`${this.api}/billing/account/invoices/${id}`);
  }
  invoicePdf(id: string): Observable<Blob> {
    return this.http.get(`${this.api}/billing/account/invoices/${id}/pdf`, { responseType: 'blob' });
  }
  previewPlanChange(planKey: string): Observable<PlanChangeQuote> {
    return this.http.get<PlanChangeQuote>(`${this.api}/billing/account/plan-change/preview`, { params: params({ planKey }) });
  }
  changePlan(planKey: string, confirmQuotedAmount?: number, note?: string): Observable<{ quote: PlanChangeQuote; invoice?: InvoiceV2; request?: any }> {
    return this.http.post<{ quote: PlanChangeQuote; invoice?: InvoiceV2; request?: any }>(`${this.api}/billing/account/plan-change`, { planKey, confirmQuotedAmount, note });
  }
  cancelScheduledChange(): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.api}/billing/account/plan-change/scheduled`);
  }
  cancel(reason?: string): Observable<AccountContext['subscription']> {
    return this.http.post<AccountContext['subscription']>(`${this.api}/billing/account/cancel`, { reason });
  }
  keep(): Observable<AccountContext['subscription']> {
    return this.http.delete<AccountContext['subscription']>(`${this.api}/billing/account/cancel`);
  }
  payInvoice(invoiceId: string, callbackUrl: string): Observable<{ checkoutUrl: string; reference: string; amount: number }> {
    return this.http.post<{ checkoutUrl: string; reference: string; amount: number }>(`${this.api}/billing/account/invoices/${invoiceId}/pay`, { callbackUrl });
  }
  verifyPayment(reference: string): Observable<{ invoice: InvoiceV2; context: AccountContext['subscription'] }> {
    return this.http.post<{ invoice: InvoiceV2; context: AccountContext['subscription'] }>(`${this.api}/billing/account/payments/verify`, { reference });
  }

  // ---- super admin

  adminOverview(): Observable<AdminOverview> {
    return this.http.get<AdminOverview>(`${this.api}/billing/admin/overview`);
  }
  adminStores(q: { search?: string; status?: string; page?: number; limit?: number } = {}): Observable<Paged<AdminStoreRow>> {
    return this.http.get<Paged<AdminStoreRow>>(`${this.api}/billing/admin/stores`, { params: params(q) });
  }
  adminStore(storeId: string): Observable<AdminStoreDetail> {
    return this.http.get<AdminStoreDetail>(`${this.api}/billing/admin/stores/${storeId}`);
  }
  adminExtend(storeId: string, body: { months?: number; until?: string; reason?: string }): Observable<any> {
    return this.http.post(`${this.api}/billing/admin/stores/${storeId}/subscription/extend`, body);
  }
  adminChangePlan(storeId: string, body: { planKey: string; customAmount?: number | null; reason?: string }): Observable<any> {
    return this.http.post(`${this.api}/billing/admin/stores/${storeId}/subscription/plan`, body);
  }
  adminSetStatus(storeId: string, status: SubStatus, reason?: string): Observable<any> {
    return this.http.post(`${this.api}/billing/admin/stores/${storeId}/subscription/status`, { status, reason });
  }
  adminStartTrial(storeId: string): Observable<any> {
    return this.http.post(`${this.api}/billing/admin/stores/${storeId}/subscription/start`, {});
  }
  adminSetModules(storeId: string, modules: string[]): Observable<{ modules: string[] }> {
    return this.http.put<{ modules: string[] }>(`${this.api}/billing/admin/stores/${storeId}/modules`, { modules });
  }
  adminRaiseInvoice(storeId: string, dueInDays?: number): Observable<InvoiceV2> {
    return this.http.post<InvoiceV2>(`${this.api}/billing/admin/stores/${storeId}/invoices`, { dueInDays });
  }
  adminInvoices(q: { status?: string; search?: string; storeId?: string; page?: number; limit?: number } = {}): Observable<Paged<InvoiceV2>> {
    return this.http.get<Paged<InvoiceV2>>(`${this.api}/billing/admin/invoices`, { params: params(q) });
  }
  adminInvoice(id: string): Observable<{ invoice: InvoiceV2; store: any; payments: PaymentV2[] }> {
    return this.http.get<{ invoice: InvoiceV2; store: any; payments: PaymentV2[] }>(`${this.api}/billing/admin/invoices/${id}`);
  }
  adminInvoicePdf(id: string): Observable<Blob> {
    return this.http.get(`${this.api}/billing/admin/invoices/${id}/pdf`, { responseType: 'blob' });
  }
  adminRecordPayment(id: string, body: { providerKey: 'cash' | 'bank_transfer'; amount: number; reference?: string; notes?: string; extendMonths?: number }): Observable<any> {
    return this.http.post(`${this.api}/billing/admin/invoices/${id}/payments`, body);
  }
  adminVoidInvoice(id: string, reason?: string): Observable<InvoiceV2> {
    return this.http.post<InvoiceV2>(`${this.api}/billing/admin/invoices/${id}/void`, { reason });
  }
  adminWriteOff(id: string, reason?: string): Observable<InvoiceV2> {
    return this.http.post<InvoiceV2>(`${this.api}/billing/admin/invoices/${id}/write-off`, { reason });
  }
  adminPayments(q: { providerKey?: string; storeId?: string; page?: number; limit?: number } = {}): Observable<Paged<PaymentV2>> {
    return this.http.get<Paged<PaymentV2>>(`${this.api}/billing/admin/payments`, { params: params(q) });
  }
  adminTrials(): Observable<TrialRow[]> {
    return this.http.get<TrialRow[]>(`${this.api}/billing/admin/trials`);
  }
  adminRequests(status = 'OPEN'): Observable<UpgradeRequestRow[]> {
    return this.http.get<UpgradeRequestRow[]>(`${this.api}/billing/admin/upgrade-requests`, { params: params({ status }) });
  }
  adminResolveRequest(id: string, status: 'APPLIED' | 'DECLINED', resolution?: string): Observable<any> {
    return this.http.post(`${this.api}/billing/admin/upgrade-requests/${id}/resolve`, { status, resolution });
  }
  adminPlans(): Observable<BillingPlan[]> {
    return this.http.get<BillingPlan[]>(`${this.api}/billing/admin/plans`);
  }
  adminCreatePlan(plan: Partial<BillingPlan>): Observable<BillingPlan> {
    return this.http.post<BillingPlan>(`${this.api}/billing/admin/plans`, plan);
  }
  adminUpdatePlan(key: string, plan: Partial<BillingPlan>): Observable<BillingPlan> {
    return this.http.put<BillingPlan>(`${this.api}/billing/admin/plans/${key}`, plan);
  }
  adminArchivePlan(key: string): Observable<BillingPlan> {
    return this.http.delete<BillingPlan>(`${this.api}/billing/admin/plans/${key}`);
  }
  adminAudit(q: { storeId?: string; action?: string; page?: number; limit?: number } = {}): Observable<Paged<AuditRow>> {
    return this.http.get<Paged<AuditRow>>(`${this.api}/billing/admin/audit-log`, { params: params(q) });
  }
  adminSettings(): Observable<BillingSettingsV2> {
    return this.http.get<BillingSettingsV2>(`${this.api}/billing/admin/settings`);
  }
  adminUpdateSettings(patch: Partial<BillingSettingsV2>): Observable<BillingSettingsV2> {
    return this.http.put<BillingSettingsV2>(`${this.api}/billing/admin/settings`, patch);
  }
  adminRunSweep(dryRun = true): Observable<any> {
    return this.http.post(`${this.api}/billing/admin/sweep`, { dryRun });
  }
}
