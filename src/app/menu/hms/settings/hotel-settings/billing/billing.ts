import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatButtonModule } from '@angular/material/button';
import { SubscriptionService } from '../../../../../shared/services/subscription.service';
import { Subscription } from '../../../../../shared/models';
import { InvoicesComponent } from './invoices/invoices';
import { BillingInformationComponent } from './billing-information/billing-information';
import { CurrentPlanComponent } from './current-plan/current-plan';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    InvoicesComponent,
    BillingInformationComponent,
    CurrentPlanComponent,
  ],
  templateUrl: './billing.html',
  styleUrl: './billing.scss',
})
export class Billing implements OnInit {
  private subscriptionService = inject(SubscriptionService);

  isLoading = signal(true);
  subscription = signal<Subscription | null>(null);

  ngOnInit() {
    this.loadSubscription();
  }

  private loadSubscription() {
    this.isLoading.set(true);
    this.subscriptionService.getSubscriptionStatus().subscribe({
      next: (sub) => {
        this.subscription.set(sub);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load subscription:', error);
        this.isLoading.set(false);
      },
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      TRIAL: 'Free Trial',
      ACTIVE: 'Active',
      PAST_DUE: 'Payment Required',
      EXPIRED: 'Expired',
      CANCELLED: 'Cancelled',
    };
    return labels[status] || status;
  }
}
