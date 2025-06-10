import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-survey-success',
  templateUrl: './survey-success.component.html',
  styleUrls: ['./survey-success.component.scss'],
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class SurveySuccessComponent {
  private router = inject(Router);

  navigateHome() {
    this.router.navigate(['/']);
  }

  startNewSurvey() {
    this.router.navigate(['/surveys']);
  }
}
