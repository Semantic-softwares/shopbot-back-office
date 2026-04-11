import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatButtonModule } from '@angular/material/button';
import { InvoicesComponent } from './invoices/invoices';
import { BillingInformationComponent } from './billing-information/billing-information';
import { CurrentPlanComponent } from './current-plan/current-plan';
import { SubscriptionService } from '../../../shared/services/subscription.service';

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

  isLoading = signal<boolean>(true);
  readonly data = this.subscriptionService.subscriptionWithModules;

  ngOnInit(): void {
    this.loadSubscription();
  }

  loadSubscription(): void {
    this.isLoading.set(true);
    this.subscriptionService.getSubscriptionWithModules().subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load subscription:', error);
        this.isLoading.set(false);
      },
    });
  }
}
