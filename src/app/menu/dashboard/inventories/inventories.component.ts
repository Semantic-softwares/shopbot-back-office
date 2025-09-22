import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'inventories',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './inventories.component.html',
  styleUrl: './inventories.component.scss',
})
export class InventoriesComponent { }
