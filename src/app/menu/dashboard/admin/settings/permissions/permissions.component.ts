import { Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Permission } from '../../../../../shared/models/permission.model';
import { rxResource } from '@angular/core/rxjs-interop';
import { PermissionService } from '../../../../shared/services/permission.service';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { CreatePermissionComponent } from '../modals/create-permission/create-permission.component';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [
    CommonModule, 
    MatTableModule, 
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    MatInputModule,
  ],
  templateUrl: './permissions.component.html'
})
export class PermissionsComponent  {
    private permissionService = inject(PermissionService);
    private dialog = inject(MatDialog);
    private snackBar = inject(MatSnackBar);
    public permissions = rxResource({
      loader: () => this.permissionService.getPermissions()
    });
    displayedColumns: string[] = ['name', 'action', 'resource', 'category', 'actions'];
    dataSource!: MatTableDataSource<Permission>;
    searchTerm = signal('');
  

      public filteredPermission = computed(() => {
        const term = this.searchTerm().toLowerCase();
         return  this.permissions.value()!.filter(permission => 
            permission.name.toLowerCase().includes(term) ||
            permission.action.toLowerCase().includes(term)
          );
      });
    
    
      onSearch(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.searchTerm.set(input.value);
      }

    onCreate() {
      const dialogRef = this.dialog.open(CreatePermissionComponent, {
        width: '500px',
        data: { mode: 'create' }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.permissions.reload();
        }
      });
    }

    onDelete(permission: Permission) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: 'Delete Permission',
          message: `Are you sure you want to delete the permission "${permission.name}"?`
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.permissionService.deletePermission(permission._id!)
            .subscribe({
              next: () => {
                this.permissions.reload();
                this.snackBar.open('Permission deleted successfully', 'Close', {
                  duration: 3000,
                  panelClass: ['success-snackbar']
                });
              },
              error: (error) => {
                this.snackBar.open('Failed to delete permission', 'Close', {
                  duration: 3000,
                  panelClass: ['error-snackbar']
                });
              }
            });
        }
      });
    }

    onEdit(permission: Permission) {
      const dialogRef = this.dialog.open(CreatePermissionComponent, {
        width: '500px',
        data: { mode: 'edit', permission }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.permissions.reload();
        }
      });
    }
}
