import { Component, inject, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../../../../shared/services/auth.service';
import { User } from '../../../../../../shared/models/user.model';

@Component({
  selector: 'app-update-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './update-password.component.html'
})
export class UpdatePasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  
  public hidePassword = true;
  public hideConfirmPassword = true;
  public isUpdating = signal(false);

  passwordForm: FormGroup = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  constructor(
    public dialogRef: MatDialogRef<UpdatePasswordComponent>,
    @Inject(MAT_DIALOG_DATA) public data: User
  ) {}

  private passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.passwordForm.valid) {
      this.isUpdating.set(true);
      this.authService.updatePassword(this.data._id, this.passwordForm.get('password')?.value)
        .subscribe({
          next: () => {
            this.isUpdating.set(false);
            this.dialogRef.close(true);
          },
          error: (error) => {
            this.isUpdating.set(false);
            this.snackBar.open(error.message || 'Failed to update password', 'Close', {
              duration: 3000
            });
          }
        });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
