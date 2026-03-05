import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgProgressbar } from 'ngx-progressbar';
import { NgProgressRouter } from 'ngx-progressbar/router';
import { TrialWarningBannerComponent } from './shared/components/trial-warning-banner/trial-warning-banner.component';
import { SubscriptionExpiringBannerComponent } from './shared/components/subscription-expiring-banner/subscription-expiring-banner.component';
import { PwaInstallPromptComponent } from './shared/components/pwa-install-prompt/pwa-install-prompt.component';
import { PwaUpdateService } from './shared/services/pwa-update.service';
import { PwaInstallService } from './shared/services/pwa-install.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgProgressbar, NgProgressRouter, TrialWarningBannerComponent, SubscriptionExpiringBannerComponent, PwaInstallPromptComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'shopbot-back-office';

  private pwaUpdateService = inject(PwaUpdateService);
  private pwaInstallService = inject(PwaInstallService);

  ngOnInit(): void {
    this.pwaUpdateService.initialize();
    this.pwaInstallService.initialize();
  }
}

