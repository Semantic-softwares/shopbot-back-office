import { Component } from '@angular/core';

import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'inventories',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './inventories.component.html',
  styleUrl: './inventories.component.scss',
})
export class InventoriesComponent { }
