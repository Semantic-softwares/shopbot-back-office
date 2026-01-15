import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgProgressbar } from 'ngx-progressbar';
import { NgProgressRouter } from 'ngx-progressbar/router';
import { TrialWarningBannerComponent } from './shared/components/trial-warning-banner/trial-warning-banner.component';
import { SubscriptionExpiringBannerComponent } from './shared/components/subscription-expiring-banner/subscription-expiring-banner.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgProgressbar, NgProgressRouter, TrialWarningBannerComponent, SubscriptionExpiringBannerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent  {
  title = 'shopbot-back-office';
}

