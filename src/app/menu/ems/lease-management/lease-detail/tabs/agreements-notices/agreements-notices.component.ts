import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { NoRecordComponent } from '../../../../../../shared/components/no-record/no-record.component';
import { LeaseDetailPageComponent } from '../../lease-detail-page.component';

@Component({
  selector: 'app-lease-agreements-notices',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatCardModule, NoRecordComponent],
  templateUrl: './agreements-notices.component.html',
})
export class LeaseAgreementsNoticesComponent {
  private parent = inject(LeaseDetailPageComponent);
  lease = this.parent.lease;
}
