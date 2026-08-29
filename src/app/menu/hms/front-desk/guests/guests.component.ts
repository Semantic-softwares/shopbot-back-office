import { Component, ChangeDetectionStrategy } from '@angular/core';

import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-guests',
  standalone: true,
  imports: [
    RouterOutlet
],
  templateUrl: './guests.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './guests.component.scss',
})
export class GuestsComponent { }
