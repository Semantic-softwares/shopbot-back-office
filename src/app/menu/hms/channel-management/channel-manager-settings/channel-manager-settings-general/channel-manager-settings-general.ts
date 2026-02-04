import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { signal, computed } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PropertySettingsService } from '../../../../../shared/services/property-settings.service';
import { NoRecordComponent } from '../../../../../shared/components/no-record/no-record.component';
import { map, tap } from 'rxjs';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { PageHeaderComponent } from "../../../../../shared/components/page-header/page-header.component";

@Component({
  selector: 'app-channel-manager-settings-general',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSelectModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    NoRecordComponent,
    PageHeaderComponent
],
  templateUrl: './channel-manager-settings-general.html',
  styleUrl: './channel-manager-settings-general.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChannelManagerSettingsGeneral  {
  private fb = inject(FormBuilder);
  public storeStore = inject(StoreStore);
  private propertySettingsService = inject(PropertySettingsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  settingsForm = this.fb.group({
    // Price Settings
    min_price: [null, [Validators.min(0)]],
    max_price: [null, [Validators.min(0)]],

    // Availability Settings
    allow_availability_autoupdate_on_confirmation: [{value: true, disabled: true}],
    allow_availability_autoupdate_on_modification: [false],
    allow_availability_autoupdate_on_cancellation: [false],

    // Inventory Settings
    state_length: [500, [Validators.required, Validators.min(100), Validators.max(730)]],

    // Minimum Stay Settings
    min_stay_type: ['both', Validators.required],

    // Cut-off Settings
    cut_off_time: ['00:00:00'],
    cut_off_days: [0, [Validators.required, Validators.min(0)]],

    // Max Days Advance
    max_day_advance_enabled: [false],
    max_day_advance: [null, [Validators.min(1)]],
  });
  isSaving = signal(false);
  propertyId = signal<string>(this.storeStore.selectedStore()?.channex?.propertyId!)

  // Resource to load property settings
  propertyResource = rxResource({
    params: () => ({ propertyId: this.propertyId() }),
    stream: ({ params }) => this.propertySettingsService.getPropertySettings(params.propertyId!).pipe(tap((prop) => this.populateForm(prop) )),
  });

  populateForm(prop: any) {
    console.log('Populating form with response:', prop);
    if (!prop?.data?.attributes?.settings) return;

    const settings = prop.data.attributes.settings;
    console.log('Populating form with settings:', settings);
    this.settingsForm.patchValue({
      // Price Settings
      min_price: settings.min_price ?? undefined,
      max_price: settings.max_price ?? undefined,

      // Availability Settings
      allow_availability_autoupdate_on_confirmation:
        settings.allow_availability_autoupdate_on_confirmation ?? true,
      allow_availability_autoupdate_on_modification:
        settings.allow_availability_autoupdate_on_modification ?? false,
      allow_availability_autoupdate_on_cancellation:
        settings.allow_availability_autoupdate_on_cancellation ?? false,

      // Inventory Settings
      state_length: settings.state_length ?? 500,

      // Minimum Stay Settings
      min_stay_type: settings.min_stay_type ?? 'both',

      // Cut-off Settings
      cut_off_time: settings.cut_off_time ?? '00:00:00',
      cut_off_days: settings.cut_off_days ?? 0,

      // Max Days Advance
      max_day_advance_enabled: !!settings.max_day_advance,
      max_day_advance: settings.max_day_advance ?? undefined,
    } as any);
  }

  saveSettings() {
    if (!this.settingsForm || !this.settingsForm.valid) {
      this.snackBar.open('Please fix the form errors', 'Close', { duration: 3000 });
      return;
    }

    this.isSaving.set(true);
    const propertyId = this.propertyId();
    const formValue = this.settingsForm.getRawValue();

    // Don't send max_day_advance_enabled flag to API
    const { max_day_advance_enabled, ...dataToSend } = formValue as any;

    // If max_day_advance is not enabled, send null
    if (!max_day_advance_enabled) {
      dataToSend.max_day_advance = null;
    }

    // Convert price values to strings
    if (dataToSend.min_price !== null && dataToSend.min_price !== undefined) {
      dataToSend.min_price = String(dataToSend.min_price);
    }
    if (dataToSend.max_price !== null && dataToSend.max_price !== undefined) {
      dataToSend.max_price = String(dataToSend.max_price);
    }

    this.propertySettingsService.updatePropertySettings(propertyId, dataToSend).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.snackBar.open('Settings saved successfully', 'Close', { duration: 3000 });
        // Reload the data
        this.propertyResource.reload();
      },
      error: (error) => {
        this.isSaving.set(false);
        const errorMessage = error.error?.message || 'Failed to save settings';
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
      },
    });
  }

  resetForm() {
    const prop = this.propertyResource.value();
    if (prop) {
      this.populateForm(prop);
    }
  }
}
