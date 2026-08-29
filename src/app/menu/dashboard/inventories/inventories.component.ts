import { Component, ChangeDetectionStrategy } from '@angular/core';

import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'inventories',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './inventories.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './inventories.component.scss',
})
export class InventoriesComponent { }
