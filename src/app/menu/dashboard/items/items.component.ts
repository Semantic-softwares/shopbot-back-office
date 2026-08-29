import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'shopbot-items',
  imports: [RouterModule],
  templateUrl: './items.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './items.component.scss',
})
export class ItemsComponent { }
