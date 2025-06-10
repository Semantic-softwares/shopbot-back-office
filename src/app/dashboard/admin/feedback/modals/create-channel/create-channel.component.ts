import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Channel } from '../../../../../shared/models/channel.model';

@Component({
  selector: 'app-create-channel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSlideToggleModule
  ],
  templateUrl: './create-channel.component.html'
})
export class CreateChannelComponent implements OnInit {
  form: FormGroup;
  isEditMode: boolean = false;
  feedbackTypeOptions = ['One Click', 'Basic', 'Detailed'];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateChannelComponent>,
    @Inject(MAT_DIALOG_DATA) public data?: Channel
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      feedback_types: [[]],  // Initialize as empty array
      status: [false]
    });
  }

  ngOnInit() {
    if (this.data) {
      this.isEditMode = true;
      this.form.patchValue({
        ...this.data,
        feedback_types: this.data.feedback_types || []  // Ensure it's an array
      });
    }
  }

  onSubmit() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  onCheckboxChange(event: any, type: string) {
    const currentTypes = this.form.get('feedback_types')?.value || [];
    if (event.checked) {
      this.form.patchValue({
        feedback_types: [...currentTypes, type]
      });
    } else {
      this.form.patchValue({
        feedback_types: currentTypes.filter((t: string) => t !== type)
      });
    }
  }

  isTypeSelected(type: string): boolean {
    const types = this.form.get('feedback_types')?.value || [];
    return types.includes(type);
  }
}
