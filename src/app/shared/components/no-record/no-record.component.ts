import { Component, Input } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-no-record',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatCardModule],
  templateUrl: './no-record.component.html',
})
export class NoRecordComponent {
  @Input() icon: string = 'inbox';
  @Input() title: string = 'No Records Found';
  @Input() message: any = 'There are no records to display at this time.';
}
