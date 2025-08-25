import { Component, OnInit, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { SubscriptionService } from '../../../services/subscription.service';
import { SubscriptionUpgradeDialogComponent } from '../subscription-upgrade-dialog/subscription-upgrade-dialog.component';

@Component({
  selector: 'app-usage-indicator',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressBarModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './usage-indicator.component.html',
  styleUrls: ['./usage-indicator.component.scss']
})
export class UsageIndicatorComponent implements OnInit {
  storeId = input<string>();
  subscriptionService = inject(SubscriptionService);
  dialog = inject(MatDialog);
  Math = Math;

  ngOnInit() {
    const storeId = this.storeId();
    if (storeId) {
      this.subscriptionService.setCurrentStoreId(storeId);
    }
  }

  showUpgradeDialog() {
    const storeId = this.storeId();
    if (!storeId) return;

    const dialogRef = this.dialog.open(SubscriptionUpgradeDialogComponent, {
      width: '900px',
      maxWidth: '90vw',
      data: { storeId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.upgraded) {
        console.log('Subscription upgraded to:', result.plan);
      }
    });
  }
}