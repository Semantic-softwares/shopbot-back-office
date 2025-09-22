import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-create-service',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule
  ],
  templateUrl: './create-service.component.html'
})
export class CreateServiceComponent {
  serviceForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateServiceComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { service: any }
  ) {
    this.serviceForm = this.fb.group({
      name: ['', Validators.required],
      category: ['', Validators.required],
      price: ['', Validators.required],
      status: ['Active', Validators.required],
      provider: ['', Validators.required],
      description: ['']
    });

    if (data.service) {
      this.serviceForm.patchValue(data.service);
    }
  }

  onSubmit() {
    if (this.serviceForm.valid) {
      this.dialogRef.close(this.serviceForm.value);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
