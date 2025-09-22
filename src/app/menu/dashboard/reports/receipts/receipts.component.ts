import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-receipts',
  templateUrl: './receipts.component.html',
  standalone: true,
  imports: [
    RouterModule
  ],
  styles: [
    `
      :host ::ng-deep .mat-mdc-tab-nav-bar {
        border-bottom: none;
      }

      .mat-mdc-tab-link {
        opacity: 1 !important;
      }
    `,
  ],
})
export class ReceiptsComponent {
 
}
