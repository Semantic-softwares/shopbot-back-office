import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

import { StoreStore } from '../../../../../../shared/stores/store.store';
import { MatDividerModule } from "@angular/material/divider";
import { rxResource } from '@angular/core/rxjs-interop';
import { UserService } from '../../../../../../shared/services/user.service';
import { NoRecordComponent } from '../../../../../../shared/components/no-record/no-record.component';
import { RouterModule } from '@angular/router';
import { StaffDialogComponent } from '../../../../../../shared/components/staff-dialog/staff-dialog.component';
import { ConfirmDialogComponent } from '../../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Employee } from '../../../../../../shared/models/employee.model';
import { Role } from '../../../../../../shared/models/role.model';

@Component({
  selector: 'app-staff-account',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDividerModule,
    NoRecordComponent,
    RouterModule
],
  templateUrl: './staff-account.html',
  styleUrl: './staff-account.scss',
})
export class StaffAccount {
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  public storeStore = inject(StoreStore);
  public userService = inject(UserService);
  merchants = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id! }),
    stream: ({params}) => this.userService.getStoreMerchants(params.storeId),
  })
  displayedColumns = ['name', 'email', 'phone', 'role', 'status', 'actions'];

  getRoleColor(role?: Role): string {
    if (!role) return 'bg-gray-100 text-gray-700';
    
    const roleName = role.name.toLowerCase();
    if (roleName.includes('admin') || roleName.includes('owner')) {
      return 'bg-purple-100 text-purple-700';
    } else if (roleName.includes('manager')) {
      return 'bg-blue-100 text-blue-700';
    } else if (roleName.includes('front desk') || roleName.includes('receptionist')) {
      return 'bg-green-100 text-green-700';
    } else if (roleName.includes('housekeeper') || roleName.includes('housekeeping')) {
      return 'bg-yellow-100 text-yellow-700';
    }
    return 'bg-gray-100 text-gray-700';
  }

  getStatusColor(merchant: Employee): string {
    return merchant.deactivate ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
  }

  getStatusText(merchant: Employee): string {
    return merchant.deactivate ? 'Inactive' : 'Active';
  }

  openAddMerchantDialog(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    const dialogRef = this.dialog.open(StaffDialogComponent, {
      width: '500px',
      data: { storeId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.merchants.reload();
      }
    });
  }

  openEditMerchantDialog(merchant: Employee): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    const dialogRef = this.dialog.open(StaffDialogComponent, {
      width: '500px',
      data: { storeId, staff: merchant }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.merchants.reload();
      }
    });
  }

  openAssignRoleDialog(merchant: Employee): void {
    // Open the same dialog in edit mode - user can change the role there
    this.openEditMerchantDialog(merchant);
  }

  toggleMerchantStatus(merchant: Employee): void {
    const newStatus = !merchant.deactivate;
    this.userService.updateMerchant(merchant._id!, { deactivate: newStatus }).subscribe({
      next: () => {
        this.snackBar.open(
          `${merchant.name} ${newStatus ? 'deactivated' : 'activated'}`,
          'Close',
          { duration: 3000 }
        );
        this.merchants.reload();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to update status', 'Close', { duration: 5000 });
      }
    });
  }

  deleteMerchant(merchant: Employee): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Staff Member',
        message: `Are you sure you want to delete ${merchant.name}? This action cannot be undone.`
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.userService.deleteMerchant(merchant._id!).subscribe({
          next: () => {
            this.snackBar.open(`${merchant.name} deleted`, 'Close', { duration: 3000 });
            this.merchants.reload();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to delete staff member', 'Close', { duration: 5000 });
          }
        });
      }
    });
  }
}
