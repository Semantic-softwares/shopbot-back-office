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
import {
  MatSlideToggleModule,
  MatSlideToggleChange,
} from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { rxResource } from '@angular/core/rxjs-interop';
import { CreatePreferenceComponent } from '../modals/create-preference/create-preference.component';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { PreferenceService } from '../../../../shared/services/preference.service';
import { Preference } from '../../../../shared/models/preference.model';
import { SessionStorageService } from '../../../../shared/services/session-storage.service';

@Component({
  selector: 'app-preferences',
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
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    HasPermissionDirective,
  ],
  templateUrl: './preferences.component.html',
})
export class PreferencesComponent {
  private preferenceService = inject(PreferenceService);
  private dialog = inject(MatDialog);
  private sessionStorage = inject(SessionStorageService);
  private companyId = this.sessionStorage.getCurrentUser()?.company;
  searchTerm = signal('');
  displayedColumns = [
    'company',
    'touchPoint',
    'feedbackType',
    'channel',
    'status',
    'actions',
  ];

  public preferences = rxResource({
    loader: () => this.preferenceService.getPreferences(),
  });

  public filteredPreferences = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.preferences
      .value()!
      .filter((preference) =>
        preference.feedbackType.toLowerCase().includes(term)
      );
  });

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(CreatePreferenceComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.preferences.reload();
      }
    });
  }

  editPreference(preference: Preference) {
    const dialogRef = this.dialog.open(CreatePreferenceComponent, {
      data: { preference },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.preferences.reload();
      }
    });
  }

  deletePreference(id: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Preference',
        message: 'Are you sure you want to delete this preference?',
        confirmButtonText: 'Delete',
        showCancelButton: true,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.preferenceService.deletePreference(id).subscribe({
          next: () => {
            this.preferences.reload();
          },
          error: (error) => {
            this.dialog.open(ConfirmationDialogComponent, {
              width: '400px',
              data: {
                title: 'Error',
                message: 'Failed to delete preference. Please try again.',
                confirmButtonText: 'OK',
                showCancelButton: false,
              },
            });
          },
        });
      }
    });
  }
}
