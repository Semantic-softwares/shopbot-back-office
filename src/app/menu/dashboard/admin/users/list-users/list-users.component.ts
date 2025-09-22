import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CreateUserComponent } from '../modals/create-user/create-user.component';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { rxResource } from '@angular/core/rxjs-interop';
import { UserService } from '../../../../../shared/services/user.service';
import { User } from '../../../../../shared/models/user.model';
import { ConfirmationDialogComponent } from '../../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { MatChipsModule } from '@angular/material/chips';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';
import { UpdatePasswordComponent } from '../modals/update-password/update-password.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'list-users',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatCardModule,
    FormsModule,
    MatProgressSpinner,
    MatChipsModule,
    HasPermissionDirective,
    MatChipsModule
  ],
  templateUrl: './list-users.component.html',
})
export class ListUsersComponent {
  private userService = inject(UserService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  public displayedColumns = ['name', 'email', 'role', 'company', 'department', 'office', 'actions'];
  public searchTerm = signal('');
  public loading = signal(true);
  public users = rxResource({
    loader: () => this.userService.getAllUsers()
  });

  public filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.users.value()!.filter(user => 
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.company.toLowerCase().includes(term)
    );
  });


  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  onAdd(): void {
    const dialogRef = this.dialog.open(CreateUserComponent, {
      width: '800px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Handle new user creation
        console.log('New user:', result);
        this.users.reload();
      }
    });
  }

  onEdit(user: User): void {
    const dialogRef = this.dialog.open(CreateUserComponent, {
      width: '800px',
      data: user
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Handle user update
        console.log('Updated user:', result);
        this.users.reload();
      }
    });
  }

  onDelete(user: User): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: { message: `Are you sure you want to delete ${user.name}?` }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.deleteUser(user._id).subscribe(() => {
          console.log('User deleted:', user);
          this.users.reload();
        });
      }
    });
  }

  onReload(): void {
    this.users.reload();
  }

  onManageRoles(): void {
    this.router.navigate(['../settings', 'roles'], { relativeTo: this.route.parent });
  }

  onViewDetails(user: User): void {
    this.router.navigate(['./details', user._id], { relativeTo: this.route.parent });
  }

  onUpdatePassword(user: User): void {
    const dialogRef = this.dialog.open(UpdatePasswordComponent, {
      width: '400px',
      data: user
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Password updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    });
  }
}
