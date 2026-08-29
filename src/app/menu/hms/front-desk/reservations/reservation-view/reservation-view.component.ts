import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from "@angular/router";

@Component({
  selector: 'app-reservation-view',
  imports: [RouterModule],
  templateUrl: './reservation-view.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./reservation-view.component.scss'],
})
export class ReservationViewComponent {}
