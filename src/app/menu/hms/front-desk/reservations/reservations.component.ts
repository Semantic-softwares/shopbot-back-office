import { Component, ChangeDetectionStrategy } from '@angular/core';

import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './reservations.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./reservations.component.scss']
})
export class ReservationsComponent {

}