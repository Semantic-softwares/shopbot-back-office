import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../../../../shared/services/user.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';

@Component({
  selector: 'user-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatToolbarModule
  ],
  templateUrl: './user-details.component.html',
})
export class UserDetailsComponent {
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private id = this.route.snapshot.params['id'];
  private router = inject(Router);
  
  public user = rxResource({
    loader: () => this.userService.getUser(this.id)
  });

  public passwordForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, {
    validator: this.passwordMatchValidator
  });

  private passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  updatePassword() {
    if (this.passwordForm.valid) {
      // Implement password update logic here
      this.snackBar.open('Password updated successfully', 'Close', {
        duration: 3000
      });
      this.passwordForm.reset();
    }
  }

  goBack() {
    this.router.navigate(['/dashboard/users']);
  }
}
