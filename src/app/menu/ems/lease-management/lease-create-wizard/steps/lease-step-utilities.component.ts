import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UtilityResponsibleParty, UtilityType } from '../../../../../shared/models/estate.model';

@Component({
  selector: 'app-lease-step-utilities',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lease-step-utilities.component.html',
})
export class LeaseStepUtilitiesComponent {
  @Input({ required: true }) utilitiesGroup!: FormGroup;
  @Input({ required: true }) responsibilitiesArray!: FormArray;
  @Input({ required: true }) addUtilityResponsibility!: () => void;
  @Input({ required: true }) removeUtilityResponsibility!: (index: number) => void;

  readonly utilityTypes = Object.values(UtilityType);
  readonly parties = Object.values(UtilityResponsibleParty);
}
