import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
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
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { NoRecordComponent } from '../../../../shared/components/no-record/no-record.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StaffDialogComponent } from '../../../../shared/components/staff-dialog/staff-dialog.component';
import { TeamMember } from '../../../../shared/models/membership.model';
import { UserService } from '../../../../shared/services/user.service';
import { StoreService } from '../../../../shared/services/store.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { StoreStore } from '../../../../shared/stores/store.store';


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
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './staff-account.scss',
})
export class StaffAccount {
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private storeService = inject(StoreService);
  private authService = inject(AuthService);
  public storeStore = inject(StoreStore);
  public userService = inject(UserService);

  private currentUser = toSignal(this.authService.currentUser, { initialValue: null });

  team = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id! }),
    stream: ({params}) => this.userService.getTeamForStore(params.storeId),
  })
  displayedColumns = ['name', 'email', 'phone', 'role', 'status', 'actions'];

  /**
   * Only the current owner can transfer ownership — computed from the
   * team list itself rather than trusting StoreStore.selectedStore().owner,
   * which an unrelated backend aggregation bug can leave unpopulated.
   */
  isCurrentUserOwner = computed(() => {
    const myId = this.currentUser()?._id;
    return !!myId && this.team.value()?.some((m) => m.merchant._id === myId && m.isOwner) === true;
  });

  /**
   * The owner can only edit their own details/role — enforced server-side
   * too (see MerchantsService.assertCanEditMerchantAtStore), this is what
   * hides the actions from anyone else's view rather than showing them and
   * then failing on submit.
   */
  canEdit(member: TeamMember): boolean {
    return !member.isOwner || member.merchant._id === this.currentUser()?._id;
  }

  getStatusText(member: TeamMember): string {
    switch (member.status) {
      case 'ACTIVE': return 'Active';
      case 'SUSPENDED': return 'Deactivated';
      case 'INVITED': return 'Invited';
    }
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
        this.team.reload();
      }
    });
  }

  openEditMerchantDialog(member: TeamMember): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    const dialogRef = this.dialog.open(StaffDialogComponent, {
      width: '500px',
      data: {
        storeId,
        staff: {
          _id: member.merchant._id,
          name: member.merchant.name,
          email: member.merchant.email,
          phoneNumber: member.merchant.phoneNumber || '',
          gender: member.merchant.gender as any,
          role: member.role,
        },
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.team.reload();
      }
    });
  }

  openAssignRoleDialog(member: TeamMember): void {
    // Open the same dialog in edit mode - user can change the role there
    this.openEditMerchantDialog(member);
  }

  toggleMerchantStatus(member: TeamMember): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    const newStatus: 'ACTIVE' | 'SUSPENDED' = member.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';

    this.userService.setStaffStoreStatus(member.merchant._id, storeId, newStatus).subscribe({
      next: () => {
        this.snackBar.open(
          `${member.merchant.name} ${newStatus === 'SUSPENDED' ? 'deactivated' : 'activated'}`,
          'Close',
          { duration: 3000 }
        );
        this.team.reload();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to update status', 'Close', { duration: 5000 });
      }
    });
  }

  removeFromWorkspace(member: TeamMember): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Remove from Workspace',
        message: `Remove ${member.merchant.name} from this workspace? They'll lose access to this store, but their account (and any other stores they belong to) stays intact.`,
        confirmText: 'Remove',
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.userService.removeStaffFromStore(member.merchant._id, storeId).subscribe({
          next: () => {
            this.snackBar.open(`${member.merchant.name} removed from this workspace`, 'Close', { duration: 3000 });
            this.team.reload();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to remove from workspace', 'Close', { duration: 5000 });
          }
        });
      }
    });
  }

  transferOwnership(member: TeamMember): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Transfer Ownership',
        message: `Make ${member.merchant.name} the owner of this workspace? You'll no longer be the owner — this can only be undone by ${member.merchant.name} transferring it back to you.`,
        confirmText: 'Transfer Ownership',
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.storeService.transferOwnership(storeId, member.merchant._id).subscribe({
          next: () => {
            this.snackBar.open(`${member.merchant.name} is now the owner`, 'Close', { duration: 4000 });
            this.team.reload();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to transfer ownership', 'Close', { duration: 5000 });
          }
        });
      }
    });
  }
}
