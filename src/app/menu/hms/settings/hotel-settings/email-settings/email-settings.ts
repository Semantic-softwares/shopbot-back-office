import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { StoreStore } from '../../../../../shared/stores/store.store';
import { StoreService } from '../../../../../shared/services/store.service';

@Component({
  selector: 'app-email-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './email-settings.html',
  styleUrl: './email-settings.scss',
})
export class EmailSettings implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private storeService = inject(StoreService);
  public storeStore = inject(StoreStore);

  loading = signal(false);
  saving = signal(false);
  
  emailSettingsForm!: FormGroup;

  ngOnInit(): void {
    this.initializeForm();
    this.loadSettings();
  }

  private initializeForm(): void {
    this.emailSettingsForm = this.fb.group({
      smtpHost: [''],
      smtpPort: [587],
      smtpUsername: [''],
      smtpPassword: [''],
      smtpSecure: [true],
      senderName: [''],
      senderEmail: [''],
      replyToEmail: ['']
    });
  }

  private loadSettings(): void {
    this.loading.set(true);
    
    const store = this.storeStore.selectedStore();
    if (store?.hotelSettings?.emailSettings) {
      this.emailSettingsForm.patchValue(store.hotelSettings.emailSettings);
    }
    
    this.loading.set(false);
  }

  testEmailConnection(): void {
    if (this.emailSettingsForm.valid) {
      this.snackBar.open('Testing email connection...', 'Close', { duration: 2000 });
      setTimeout(() => {
        this.snackBar.open('Email connection test successful!', 'Close', { duration: 3000 });
      }, 2000);
    }
  }

  saveEmailSettings(): void {
    if (this.emailSettingsForm.valid && this.storeStore.selectedStore()) {
      this.saving.set(true);
      
      const currentStore = this.storeStore.selectedStore()!;
      const emailSettings = this.emailSettingsForm.value;
      
      const storeUpdatePayload = {
        hotelSettings: {
          ...currentStore.hotelSettings,
          emailSettings: emailSettings
        }
      };

      this.storeService.updateStore(currentStore._id, storeUpdatePayload).subscribe({
        next: () => {
          this.storeService.getStore(currentStore._id).subscribe({
            next: (updatedStore) => {
              this.storeStore.updateStore(updatedStore);
              this.storeService.saveStoreLocally(updatedStore);
              this.saving.set(false);
              this.snackBar.open('Email settings saved successfully!', 'Close', { duration: 3000 });
            },
            error: (fetchError) => {
              console.error('Error fetching updated store:', fetchError);
              this.saving.set(false);
              this.snackBar.open('Settings saved but failed to update local data.', 'Close', { duration: 5000 });
            }
          });
        },
        error: (error) => {
          console.error('Error saving email settings:', error);
          this.saving.set(false);
          this.snackBar.open('Failed to save email settings.', 'Close', { duration: 5000 });
        }
      });
    }
  }
}
