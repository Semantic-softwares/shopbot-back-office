import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CorrectiveActionsService, CorrectiveAction } from '../../../shared/services/corrective-actions.service';
import { CorrectiveActionFormComponent } from '../modals/corrective-action-form/corrective-action-form.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-list-corrective-actions',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './list-corrective-actions.component.html'
})
export class ListCorrectiveActionsComponent {
  private dialog = inject(MatDialog);
  private service = inject(CorrectiveActionsService);
  private snackBar = inject(MatSnackBar);
  searchTerm = signal('');

  displayedColumns = ['title', 'owner', 'eta', 'status', 'actions'];

  public actions = rxResource({
    loader: () => this.service.getCorrectiveActions()
  });

  public filteredActions = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.actions
      .value()!
      .filter((action) =>
        action.title.toLowerCase().includes(term) ||
        action.owner.toLowerCase().includes(term)
      );
  });

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openForm(action?: CorrectiveAction) {
    const dialogRef = this.dialog.open(CorrectiveActionFormComponent, {
      width: '600px',
      data: action
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.actions.reload();
      }
    });
  }

  deleteAction(id: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Corrective Action',
        message: 'Are you sure you want to delete this corrective action?',
        confirmButtonText: 'Delete',
        showCancelButton: true,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.service.deleteCorrectiveAction(id).subscribe({
          next: () => {
            this.snackBar.open('Corrective action deleted successfully', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
            this.actions.reload();
          },
          error: (error) => {
            this.snackBar.open('Failed to delete corrective action', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
          },
        });
      }
    });
  }
}
