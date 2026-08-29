import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-employees',
  imports: [RouterModule],
  templateUrl: './employees.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './employees.component.scss',
})
export class EmployeesComponent { }
