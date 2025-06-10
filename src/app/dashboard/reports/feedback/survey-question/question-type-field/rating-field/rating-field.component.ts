import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rating-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './rating-field.component.html'
})
export class RatingFieldComponent {
  @Input() question!: any;
  @Input() control!: FormControl | any;
  
  hoverRating = 0;

  handleRating(rating: number) {
    this.control.setValue(rating);
  }
}
