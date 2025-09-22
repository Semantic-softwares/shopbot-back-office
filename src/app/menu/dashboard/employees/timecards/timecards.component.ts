import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-timecards',
  template: '<router-outlet></router-outlet>',
  standalone: true,
  imports: [CommonModule, RouterOutlet]
})
export class TimecardsComponent {
}
