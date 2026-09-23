import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MembershipsService } from '../../services/memberships.service';
import { Membership } from '../../models/membership.model';
import { Store } from '../../models/store.model';
import { Role } from '../../models/role.model';

interface PendingInviteRow {
  membership: Membership;
  store: Store;
  role?: Role;
  resolving: boolean;
  resolved: 'accepted' | 'declined' | null;
}

/**
 * Shown right after login when the merchant has one or more INVITED
 * memberships — the prompt the staff-invite email promises ("log in and
 * you'll see a prompt to accept access"), which previously didn't exist:
 * login.component.ts only ever fetched ACTIVE memberships, so an invited
 * store never showed up anywhere for the invitee to act on.
 */
@Component({
  selector: 'app-pending-invites-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pending-invites-dialog.component.html',
})
export class PendingInvitesDialogComponent {
  private membershipsService = inject(MembershipsService);
  private dialogRef = inject(MatDialogRef<PendingInvitesDialogComponent>);
  public data = inject<{ invites: Membership[] }>(MAT_DIALOG_DATA);

  protected rows = signal<PendingInviteRow[]>(
    (this.data.invites || []).map((m) => ({
      membership: m,
      store: m.store as Store,
      role: m.role as Role | undefined,
      resolving: false,
      resolved: null,
    }))
  );

  protected accept(row: PendingInviteRow): void {
    this.setResolving(row, true);
    this.membershipsService.accept(row.membership._id).subscribe({
      next: () => this.markResolved(row, 'accepted'),
      error: () => this.setResolving(row, false),
    });
  }

  protected decline(row: PendingInviteRow): void {
    this.setResolving(row, true);
    this.membershipsService.decline(row.membership._id).subscribe({
      next: () => this.markResolved(row, 'declined'),
      error: () => this.setResolving(row, false),
    });
  }

  protected close(): void {
    this.dialogRef.close();
  }

  protected allResolved(): boolean {
    return this.rows().every((r) => r.resolved !== null);
  }

  private setResolving(row: PendingInviteRow, value: boolean): void {
    this.rows.update((rows) => rows.map((r) => (r === row ? { ...r, resolving: value } : r)));
  }

  private markResolved(row: PendingInviteRow, status: 'accepted' | 'declined'): void {
    this.rows.update((rows) => rows.map((r) => (r === row ? { ...r, resolving: false, resolved: status } : r)));
  }
}
