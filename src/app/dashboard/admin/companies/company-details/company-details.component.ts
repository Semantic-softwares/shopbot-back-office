import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CompanyService } from '../../../../shared/services/company.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { rxResource } from '@angular/core/rxjs-interop';
import { UserService } from '../../../../shared/services/user.service';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { CreateUserComponent } from '../../users/modals/create-user/create-user.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'company-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatMenuModule
  ],
  templateUrl: './company-details.component.html',
})
export class CompanyDetailsComponent {
  private companyService = inject(CompanyService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private id = this.route.snapshot.params['id'];
  private userService = inject(UserService);
  private dialog = inject(MatDialog);
  
  public company = rxResource({
    loader: () => this.companyService.getCompany(this.id)
  });

  public employees = rxResource({
    loader: () => this.userService.getCompanyUsers(this.id)
  });

  public address = computed(() => `${this.company.value()?.address.street} ${this.company.value()?.address.city},  ${this.company.value()?.address.state} ${this.company.value()?.address.country}`);

  displayedColumns = ['name', 'email', 'role', 'department', 'office', 'actions'];

  goBack() {
    this.router.navigate(['/dashboard/companies']);
  }

  onAddEmployee() {
    const dialogRef = this.dialog.open(CreateUserComponent, {
      width: '800px',
      data: { companyId: this.id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.employees.reload();
      }
    });
  }

  onEditEmployee(employee: any) {
    const dialogRef = this.dialog.open(CreateUserComponent, {
      width: '800px',
      data: employee
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.employees.reload();
      }
    });
  }

  onDeleteEmployee(employee: any) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: { message: `Are you sure you want to remove ${employee.name} from this company?` }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.deleteUser(employee._id).subscribe(() => {
          this.employees.reload();
        });
      }
    });
  }
}
