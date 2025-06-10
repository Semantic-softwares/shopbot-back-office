import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TouchPoint } from '../../../../../shared/models/touch-point.model';


@Component({
  selector: 'app-create-touch-point',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule
  ],
  templateUrl: './create-touch-point.component.html',
  styleUrl: './create-touch-point.component.scss',
})
export class CreateTouchPointComponent implements OnInit {
  touchPointForm: FormGroup;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateTouchPointComponent>,
    @Inject(MAT_DIALOG_DATA) public data?: TouchPoint
  ) {
    this.isEditMode = !!data;
    this.touchPointForm = this.fb.group({
      name: [data?.name || '', [Validators.required]],
      description: [data?.description || '', [Validators.required]],
      status: [data?.status ?? true]
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.touchPointForm.valid) {
      const result = {
        ...(this.isEditMode && { _id: this.data?._id }),
        ...this.touchPointForm.value
      };
      this.dialogRef.close(result);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
