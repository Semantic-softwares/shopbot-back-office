import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-surveys',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './surveys.component.html'
})
export class SurveysComponent {
  
}
