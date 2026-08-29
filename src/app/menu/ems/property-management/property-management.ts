import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-property-management',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './property-management.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './property-management.scss',
})
export class PropertyManagement { }
