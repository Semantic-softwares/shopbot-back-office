import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Subscription, Invoice, SubscriptionStatus, BillingCountry } from '../models';
import { environment } from '../../../environments/environment';
import { StoreStore } from '../stores/store.store';
import { SessionStorageService } from './session-storage.service';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  private http = inject(HttpClient);
  private storeStore = inject(StoreStore);
  private sessionStorage = inject(SessionStorageService);
  private apiUrl = `${environment.apiUrl}/api/v1/subscription`;

  // Signal-based subscription state
  private subscriptionSignal = signal<Subscription | null>(this.loadCachedSubscription());

  constructor() {
    // Whenever subscription signal changes, save it to localStorage
    // This effect runs whenever the signal is updated
  }

  /**
   * Load cached subscription from localStorage
   */
  private loadCachedSubscription(): Subscription | null {
    const cached = this.sessionStorage.getItem('currentSubscription');
    if (!cached) {
      return null;
    }
    try {
      const subscription = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return subscription as Subscription;
    } catch (error) {
      console.error('Failed to parse cached subscription:', error);
      return null;
    }
  }

  /**
   * Save subscription to localStorage
   */
  private cacheSubscription(subscription: Subscription | null): void {
    if (subscription) {
      this.sessionStorage.setItem('currentSubscription', subscription);
    } else {
      this.sessionStorage.removeItem('currentSubscription');
    }
  }

  /**
   * Get current subscription from signal
   */
  getSubscriptionSignal() {
    return this.subscriptionSignal;
  }

  /**
   * Get current subscription status (will update cache)
   */
  getSubscriptionStatus(): Observable<Subscription> {
    const selectedStore = this.storeStore.selectedStore();
    const storeId = selectedStore?._id;
    
    let params = new HttpParams();
    if (storeId) {
      params = params.set('storeId', storeId);
    }

    return this.http.get<Subscription>(`${this.apiUrl}/status`, { params }).pipe(
      tap((subscription) => {
        this.subscriptionSignal.set(subscription);
        this.cacheSubscription(subscription);
      }),
    );
  }

  /**
   * Get cached subscription signal
   */
  getCachedSubscription(): Subscription | null {
    return this.subscriptionSignal();
  }

  /**
   * Create a free trial subscription
   * All stores are charged in USD
   */
  createTrial(): Observable<Subscription> {
    const selectedStore = this.storeStore.selectedStore();
    const storeId = selectedStore?._id;
    
    // Get billing email from store owner first, then fallback to user email
    let billingEmail = '';
    
    if (selectedStore?.owner) {
      // If owner is an object with email property
      if (typeof selectedStore.owner === 'object' && (selectedStore.owner as any).email) {
        billingEmail = (selectedStore.owner as any).email;
        // billingEmail = 'alexonozor@gmail.com'
      }
      // If owner is just an ID string, use the store contactInfo email
      else if (selectedStore?.contactInfo?.email) {
        billingEmail = selectedStore.contactInfo.email;
        // billingEmail = 'alexonozor@gmail.com'
      }
    
    }

    return this.http
      .post<Subscription>(`${this.apiUrl}/trial`, {
        storeId,
        billingEmail,
        billingCountry: selectedStore?.contactInfo.country,
      })
      .pipe(
        tap((subscription) => {
          this.subscriptionSignal.set(subscription);
          this.cacheSubscription(subscription);
        }),
      );
  }

  /**
   * Initiate subscription upgrade payment
   * @param roomCount Number of rooms to upgrade
   * @param callbackUrl Optional custom callback URL (defaults to environment.paymentReturnUrl)
   * @param webhookUrl Optional webhook URL for server-side payment notifications
   */
  initiateUpgradePayment(
    roomCount: number,
    callbackUrl?: string,
    webhookUrl?: string,
  ): Observable<{
    checkoutUrl: string;
    reference: string;
    amount: number;
  }> {
    const selectedStore = this.storeStore.selectedStore();
    const storeId = selectedStore?._id;
    
    // Use provided callback URL or default from environment
    const finalCallbackUrl = callbackUrl || environment.paymentReturnUrl;
    
    const payload: any = { roomCount, storeId, callbackUrl: finalCallbackUrl };
    
    // Add webhook URL if provided or if environment has a default
    if (webhookUrl) {
      payload.webhookUrl = webhookUrl;
    } else if ((environment as any).webhookUrl) {
      payload.webhookUrl = (environment as any).webhookUrl;
    }
    
    return this.http.post<{
      checkoutUrl: string;
      reference: string;
      amount: number;
    }>(`${this.apiUrl}/upgrade/initiate`, payload);
  }

  /**
   * Verify upgrade payment and activate subscription
   * @param paystackReference Paystack transaction reference
   * @param roomCount Number of rooms for the subscription
   * @param storeId Store ID (required for payment callback verification)
   */
  verifyUpgradePayment(
    paystackReference: string,
    roomCount: number,
    storeId?: string,
  ): Observable<Subscription> {
    const payload: any = { paystackReference, roomCount };
    
    // Include storeId if provided (needed for payment callback without auth)
    if (storeId) {
      payload.storeId = storeId;
    }
    
    return this.http
      .post<Subscription>(`${this.apiUrl}/upgrade/verify`, payload)
      .pipe(
        tap((subscription) => {
          this.subscriptionSignal.set(subscription);
          this.cacheSubscription(subscription);
        }),
      );
  }

  /**
   * Get billing invoices with pagination support
   */
  getInvoices(storeId?: string, limit: number = 12, skip: number = 0): Observable<{ invoices: Invoice[]; total: number }> {
    const selectedStore = this.storeStore.selectedStore();
    const finalStoreId = storeId || selectedStore?._id;

    let params = new HttpParams();
    if (finalStoreId) {
      params = params.set('storeId', finalStoreId);
    }
    params = params.set('limit', limit.toString());
    params = params.set('skip', skip.toString());

    return this.http.get<{ invoices: Invoice[]; total: number }>(
      `${this.apiUrl}/invoices`,
      { params },
    );
  }

  /**
   * Download invoice PDF
   */
  downloadInvoicePdf(invoiceId: string): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/invoices/${invoiceId}/pdf`,
      { responseType: 'blob' },
    );
  }

  /**
   * Cancel subscription
   */
  cancelSubscription(reason: string): Observable<Subscription> {
    const selectedStore = this.storeStore.selectedStore();
    const storeId = selectedStore?._id;

    return this.http
      .post<Subscription>(`${this.apiUrl}/cancel`, { reason, storeId })
      .pipe(
        tap((subscription) => {
          this.subscriptionSignal.set(subscription);
          this.cacheSubscription(subscription);
        }),
      );
  }

  /**
   * Check if subscription is in trial period
   */
  isInTrial(subscription: Subscription): boolean {
    return subscription.status === 'TRIAL';
  }

  /**
   * Check if subscription is active
   */
  isActive(subscription: Subscription): boolean {
    return subscription.status === 'ACTIVE';
  }

  /**
   * Check if subscription is past due
   */
  isPastDue(subscription: Subscription): boolean {
    return subscription.status === 'PAST_DUE';
  }

  /**
   * Check if subscription is expired
   */
  isExpired(subscription: Subscription): boolean {
    return subscription.status === 'EXPIRED';
  }

  /**
   * Get days remaining in trial
   */
  getTrialDaysRemaining(subscription: Subscription): number {
    if (!this.isInTrial(subscription)) return 0;

    const trialEnd = new Date(subscription.trialEndDate);
    const today = new Date();
    const daysRemaining = Math.ceil(
      (trialEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    return Math.max(0, daysRemaining);
  }

  /**
   * Get trial progress percentage
   */
  getTrialProgress(subscription: Subscription): number {
    if (!this.isInTrial(subscription)) return 0;

    const trialStart = new Date(subscription.trialStartDate);
    const trialEnd = new Date(subscription.trialEndDate);
    const today = new Date();

    const totalDays = (trialEnd.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = (today.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24);

    return Math.min(100, Math.round((elapsedDays / totalDays) * 100));
  }

  /**
   * Check if user needs to upgrade (trial expired)
   */
  needsUpgrade(subscription: Subscription): boolean {
    return this.isExpired(subscription);
  }

  /**
   * Check if user has payment method on file
   */
  hasPaymentMethod(subscription: Subscription): boolean {
    return subscription.hasPaymentMethod;
  }

  /**
   * Get subscription status as a readable string
   */
  getStatusLabel(subscription: Subscription): string {
    const labels: Record<SubscriptionStatus, string> = {
      TRIAL: 'Free Trial',
      ACTIVE: 'Active',
      PAST_DUE: 'Payment Required',
      EXPIRED: 'Expired',
      CANCELLED: 'Cancelled',
    };

    return labels[subscription.status];
  }

  /**
   * Get subscription status color (for UI)
   */
  getStatusColor(subscription: Subscription): string {
    const colors: Record<SubscriptionStatus, string> = {
      TRIAL: 'warn',
      ACTIVE: 'accent',
      PAST_DUE: 'error',
      EXPIRED: 'error',
      CANCELLED: 'error',
    };

    return colors[subscription.status];
  }

  /**
   * Format subscription details for display
   */
  formatForDisplay(subscription: Subscription): {
    status: string;
    statusColor: string;
    trialDaysRemaining: number;
    trialProgress: number;
    hasPaymentMethod: boolean;
    nextBillingDate: string | null;
    isUpgradeRequired: boolean;
  } {
    return {
      status: this.getStatusLabel(subscription),
      statusColor: this.getStatusColor(subscription),
      trialDaysRemaining: this.getTrialDaysRemaining(subscription),
      trialProgress: this.getTrialProgress(subscription),
      hasPaymentMethod: this.hasPaymentMethod(subscription),
      nextBillingDate: subscription.nextBillingDate
        ? new Date(subscription.nextBillingDate).toLocaleDateString()
        : null,
      isUpgradeRequired: this.needsUpgrade(subscription),
    };
  }

  /**
   * Refresh subscription status
   */
  refreshSubscription(): Observable<Subscription> {
    return this.getSubscriptionStatus();
  }

  /**
   * Get available pricing plans
   */
  getPricingPlans(): Observable<{
    pricingTiers: Array<{ roomRange: string; price: number; currency: string }>;
    trialDays: number;
  }> {
    return this.http.get<{
      pricingTiers: Array<{ roomRange: string; price: number; currency: string }>;
      trialDays: number;
    }>(`${this.apiUrl}/pricing`);
  }

  /**
   * Get the room count from a plan's room range
   */
  getRoomCountFromRange(roomRange: string): number {
    if (roomRange.includes('0-10')) return 10;
    if (roomRange.includes('11-30')) return 30;
    if (roomRange.includes('31-35')) return 35;
    if (roomRange.includes('35+')) return 50;
    return 10;
  }

  /**
   * Check if a plan is the current subscription plan
   */
  isCurrentSubscriptionPlan(subscription: Subscription | null, planRoomRange: string): boolean {
    if (!subscription) return false;

    // For trial subscriptions, highlight the free tier
    if (subscription.status === 'TRIAL') {
      return planRoomRange === '0-10 rooms';
    }

    // For active subscriptions, check if the room range matches the current room count
    if (subscription.status === 'ACTIVE') {
      const roomCount = subscription.roomCount || 10;

      if (planRoomRange === '0-10 rooms' && roomCount <= 10) return true;
      if (planRoomRange === '11-30 rooms' && roomCount > 10 && roomCount <= 30) return true;
      if (planRoomRange === '31-35 rooms' && roomCount > 30 && roomCount <= 35) return true;
      if (planRoomRange === '35+ rooms' && roomCount > 35) return true;
    }

    return false;
  }

  /**
   * Check if upgrading to a plan is a downgrade based on current subscription
   */
  isDowngrade(subscription: Subscription | null, planRoomRange: string): boolean {
    if (!subscription || !subscription.roomCount) return false;

    const currentRoomCount = subscription.roomCount;
    const planRoomCount = this.getRoomCountFromRange(planRoomRange);

    // It's a downgrade if the new plan's room count is less than current
    return planRoomCount < currentRoomCount;
  }

  /**
   * Get the action label for a plan button
   */
  getPlanActionLabel(subscription: Subscription | null, planRoomRange: string): string {
    // Check if it's the current plan
    if (this.isCurrentSubscriptionPlan(subscription, planRoomRange)) {
      return 'Current Plan';
    }

    // Check if it's a downgrade
    if (this.isDowngrade(subscription, planRoomRange)) {
      return 'Downgrade';
    }

    // Otherwise it's an upgrade
    return 'Upgrade Now';
  }

  /**
   * Check if a plan button should be disabled
   */
  isPlanButtonDisabled(subscription: Subscription | null, planRoomRange: string): boolean {
    // Disable button only for the current plan
    return this.isCurrentSubscriptionPlan(subscription, planRoomRange);
  }
}