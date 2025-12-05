import { Component } from '@angular/core';

import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './reservations.component.html',
  styleUrls: ['./reservations.component.scss']
})
export class ReservationsComponent {

}