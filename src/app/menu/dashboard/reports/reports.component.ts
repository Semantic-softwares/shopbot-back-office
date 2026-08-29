import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-reports',
  imports: [RouterModule],
  templateUrl: './reports.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './reports.component.scss',
})
export class ReportsComponent { }
