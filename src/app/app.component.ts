import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgProgressbar } from 'ngx-progressbar';
import { NgProgressRouter } from 'ngx-progressbar/router';
import { TrialWarningBannerComponent } from './shared/components/trial-warning-banner/trial-warning-banner.component';
import { SubscriptionExpiringBannerComponent } from './shared/components/subscription-expiring-banner/subscription-expiring-banner.component';
import { AutoPrintService } from './shared/services/auto-print.service';
import { SocketService } from './shared/services/socket.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgProgressbar, NgProgressRouter, TrialWarningBannerComponent, SubscriptionExpiringBannerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'shopbot-back-office';
  private autoPrintService = inject(AutoPrintService);
  private socketService = inject(SocketService);

  ngOnInit() {
    console.log('🚀 [APP] Application initialized');
    console.log('🔌 [APP] Socket connected:', this.socketService.isConnected());
    
    // Auto-print service will start listening when socket connects
    // The socket connection happens in menu.component when user selects a store
    
    // Start listening immediately (will work once socket is connected)
    this.autoPrintService.startListening();
    console.log('📡 [APP] Auto-print service registered');
  }

  ngOnDestroy() {
    console.log('🛑 [APP] Application destroying');
    // Clean up socket listeners
    this.autoPrintService.stopListening();
  }
}

