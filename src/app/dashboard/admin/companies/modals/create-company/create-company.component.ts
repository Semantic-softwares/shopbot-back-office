import { CommonModule } from '@angular/common';
import { Component, inject, Inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Company } from '../../../../../shared/models/company.model';
import { CompanyService } from '../../../../../shared/services/company.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { UserService } from '../../../../../shared/services/user.service';
import { tap } from 'rxjs';

@Component({
  selector: 'app-create-company',
  templateUrl: './create-company.component.html',
  styleUrls: ['./create-company.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    FormsModule
  ],
})
export class CreateCompanyComponent {
  private userService = inject(UserService);
  public companyForm!: FormGroup;
  public isLoading = signal(false);
  public users = rxResource({
      loader: () => this.userService.getRootUsers().pipe(tap(() =>  this.companyForm.patchValue({
        accountManager: this.data.company?.accountManager?._id,
        primaryTech: this.data.company?.primaryTech?._id,
        salesRep: this.data.company?.salesRep?._id
      }))),
    });

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateCompanyComponent>,
    private companyService: CompanyService,
    @Inject(MAT_DIALOG_DATA) public data: { company: Company }
  ) {
        
    this.initForm();
    if (data?.company) {
      this.companyForm.patchValue(data.company);
    }
  }

  initForm() {
    this.companyForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      website: [''],
      phone: [''],
      address: this.fb.group({
        street: ['', Validators.required],
        city: ['', Validators.required],
        state: ['', Validators.required],
        zip: ['', Validators.required],
        country: ['', Validators.required]
      }),
      industry: ['', Validators.required],
      registrationNumber: ['', Validators.required],
      taxId: ['', Validators.required],
      primaryTech: ['', Validators.required],
      accountManager: ['', Validators.required],
      salesRep: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.companyForm.valid) {
      this.isLoading.set(true);
      const companyData = {
        ...this.companyForm.value,
        _id: this.data.company?._id
      };

      const observable = this.data.company
        ? this.companyService.updateCompany(this.data.company._id!, companyData)
        : this.companyService.createCompany(companyData);

      observable.subscribe({
        next: (result) => {
          this.isLoading.set(false);
          this.dialogRef.close(result);
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Error:', error);
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
