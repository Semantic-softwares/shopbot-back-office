import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-check-in-check-out',
  imports: [RouterModule],
  templateUrl: './check-in-check-out.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./check-in-check-out.component.scss'],
})
export class CheckInCheckOutComponent { }
