import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Question } from '../../../../../../shared/models/question.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-multiple-choice-field',
  templateUrl: './multiple-choice-field.component.html',
  standalone: true,
  imports: [MatCheckboxModule, ReactiveFormsModule, CommonModule]
})
export class MultipleChoiceFieldComponent {
  @Input() question!: Question;
  @Input() control!: FormControl | any;

  onOptionChange(option: any, event: any) {
    const currentValue: string[] = this.control.value || [];
    
    if (event.checked) {
      this.control.setValue([...currentValue, option.text]);
    } else {
      this.control.setValue(currentValue.filter(val => val !== option.text));
    }
  }

  isChecked(option: any): boolean {
    const currentValue: string[] = this.control.value || [];
    return currentValue.includes(option.text);
  }
}
