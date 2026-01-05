import { Component, inject, Inject } from '@angular/core';

import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-subscription-upgrade-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule
],
  templateUrl: './subscription-upgrade-dialog.component.html',
  styleUrls: ['./subscription-upgrade-dialog.component.scss']
})
export class SubscriptionUpgradeDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<SubscriptionUpgradeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { storeId: string }
  ) {}

  closeDialog(): void {
    this.dialogRef.close();
  }
}
