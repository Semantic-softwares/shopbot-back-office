import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SubscriptionPlan {
  name: string;
  price: number;
  allowedBytes: number;
  features: string[];
}

export interface SubscriptionInfo {
  _id: string;
  storeId: string;
  tier: 'FREE' | 'PREMIUM' | 'UNLIMITED';
  allowedBytes: number;
  usedBytes: number;
  monthlyPrice: number;
  isActive: boolean;
  tierInfo: SubscriptionPlan;
  percentageUsed: number;
  exceeded: boolean;
}

export interface UsageInfo {
  usedBytes: number;
  allowedBytes: number;
  percentageUsed: number;
  exceeded: boolean;
  formattedUsage: string;
  formattedLimit: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private http = inject(HttpClient);
  
  // Signal to track current store ID
  currentStoreId = signal<string | null>(null);
  
  // Observable streams converted to signals
  subscriptionPlans = toSignal(
    this.http.get<Record<string, SubscriptionPlan>>(`${environment.subscriptionApiUrl}/plans`),
    { initialValue: null }
  );
  
  // Current subscription signal
  currentSubscription = toSignal(
    toObservable(this.currentStoreId).pipe(
      switchMap(storeId => {
        if (!storeId) return of(null);
        return this.http.get<SubscriptionInfo>(`${environment.subscriptionApiUrl}/current/${storeId}`);
      })
    ),
    { initialValue: null }
  );
  
  // Usage data signal
  usageData = toSignal(
    toObservable(this.currentStoreId).pipe(
      switchMap(storeId => {
        if (!storeId) return of(null);
        return this.http.get<UsageInfo>(`${environment.usageApiUrl}/${storeId}`);
      })
    ),
    { initialValue: null }
  );

  // Computed values
  isUnlimited = computed(() => {
    const subscription = this.currentSubscription();
    return subscription?.tier === 'UNLIMITED';
  });

  shouldShowUsageWarning = computed(() => {
    const usage = this.usageData();
    return usage && usage.percentageUsed > 80 && !this.isUnlimited();
  });

  shouldShowUsageError = computed(() => {
    const usage = this.usageData();
    return usage && usage.exceeded && !this.isUnlimited();
  });

  // Methods
  setCurrentStoreId(storeId: string) {
    this.currentStoreId.set(storeId);
  }

  upgradeSubscription(storeId: string, tier: string) {
    return this.http.post(`${environment.subscriptionApiUrl}/upgrade`, { storeId, tier });
  }

  refreshData() {
    // Trigger refresh by resetting and setting the store ID
    const currentId = this.currentStoreId();
    if (currentId) {
      this.currentStoreId.set(null);
      setTimeout(() => this.currentStoreId.set(currentId), 0);
    }
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    if (bytes === -1) return 'Unlimited';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getProgressBarColor(percentageUsed: number): string {
    if (percentageUsed >= 90) return 'warn';
    if (percentageUsed >= 80) return 'accent';
    return 'primary';
  }
}