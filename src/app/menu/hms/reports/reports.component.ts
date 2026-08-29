import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-reports',
  imports: [RouterOutlet],
  templateUrl: './reports.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './reports.component.scss',
})
export class ReportsComponent { }
