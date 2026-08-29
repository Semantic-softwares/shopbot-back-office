import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-room-types',
  imports: [
    RouterModule
  ],
  templateUrl: './room-types.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './room-types.component.scss',
})
export class RoomTypesComponent { }
