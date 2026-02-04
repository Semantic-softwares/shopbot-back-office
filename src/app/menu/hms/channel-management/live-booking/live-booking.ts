import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from "@angular/router";

@Component({
  selector: 'app-live-booking',
  imports: [RouterModule],
  templateUrl: './live-booking.html',
  styleUrl: './live-booking.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveBooking { }
