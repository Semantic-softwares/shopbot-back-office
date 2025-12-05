import { Component } from '@angular/core';

import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-guests',
  standalone: true,
  imports: [
    RouterOutlet
],
  templateUrl: './guests.component.html',
  styleUrl: './guests.component.scss',
})
export class GuestsComponent { }
