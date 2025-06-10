import { Component, inject, signal, DestroyRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../../shared/services/auth.service';
import { User } from '../../../../../shared/models/user.model';
import { UserService } from '../../../../../shared/services/user.service';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { RolesService } from '../../../../../shared/services/role.service';
import { CompanyService } from '../../../../../shared/services/company.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-user-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss']
})
export class CreateUserComponent  {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CreateUserComponent>);
  public data: User = inject(MAT_DIALOG_DATA);
  private userService = inject(UserService);
  private companiesService = inject(CompanyService);
  private roleService = inject(RolesService);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);
 public currentUser = toSignal(this.authService.currentUser, { initialValue: null });
  public companies = rxResource({
      loader: () => this.companiesService.getAllCompanies()
  });
  

  public roles = rxResource({
    request: () => ({ user: this.currentUser() }),
    loader: ({request}) => this.roleService.getAllRoles().pipe(
      map(roles => {
        if (request.user?.role !== '67ac51a7cf36d2536cf1b7a9') {
          return roles.filter(role => {
           return role._id !== '67ac51a7cf36d2536cf1b7a9'
          });
        }
        return roles;
      })
    )
  });

  superAdminRole = computed(() => { 
    return this.roles.value()?.find(role => role._id === this.currentUser()?.role);
  })
  
  public isEditMode = signal(!!this.data?._id);
  public modalTitle = this.isEditMode() ? 'Edit User' : 'Create User';

  public userForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['', Validators.required],
    company: ['', Validators.required],
    department: ['', Validators.required],
    office: ['', Validators.required],
    root: [false, Validators.required],
    password: ['', this.isEditMode() ? [] : [Validators.required]] // Conditional password validation
  });

  public isLoading = signal(false);

  constructor() {
    if (this.isEditMode()) {
      this.userForm.patchValue(this.data);
      this.userForm.patchValue({role: this.data?.role?._id, company: this.data?.company?._id});
      this.userForm.removeControl('password');
    }

    // Subscribe to company changes
   
      this.userForm.get('company')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(companyId => {
        if (companyId) {
          const selectedCompany = this.companies.value()?.find(company => company._id === companyId);
          if (selectedCompany) {
            this.userForm.patchValue({
              root: selectedCompany.root
            }, { emitEvent: false });
          }
        }
      })
  }

  public onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const userData = {
      ...this.userForm.value,
      ...(this.isEditMode() && { id: this.data._id })
    };

    const request$ = this.isEditMode()
      ? this.userService.updateUser(this.data._id, userData)
      : this.authService.signup(userData);

    request$.subscribe({
      next: () => {
        this.isLoading.set(false);
        this.dialogRef.close(userData);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  public onCancel(): void {
    this.dialogRef.close();
  }

  public getErrorMessage(controlName: string): string {
    const control = this.userForm.get(controlName);
    if (control?.hasError('required')) {
      return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} is required`;
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    return '';
  }
}
