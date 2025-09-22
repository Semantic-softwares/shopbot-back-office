import { Component, effect, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom, from, switchMap } from 'rxjs';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StoreStore } from '../../../shared/stores/store.store';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { StoreService } from '../../../shared/services/store.service';
import { map } from 'rxjs';

@Component({
  selector: 'app-store-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './store-settings.component.html',
})
export class StoreSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private storeService = inject(StoreService);
  private snackBar = inject(MatSnackBar);
  public storeStore = inject(StoreStore);
  public isSubmitting = false;
  public logoPreview: string | null = null;
  public bannerPreview: string | null = null;
  private logoFile: File | null = null;
  private bannerFile: File | null = null;

  onLogoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.logoFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onBannerSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.bannerFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.bannerPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeLogo() {
    this.logoFile = null;
    this.logoPreview = null;
    this.storeForm.patchValue({ logo: '' });
    const logoInput = document.querySelector('#logoInput') as HTMLInputElement;
    if (logoInput) logoInput.value = '';
  }

  removeBanner() {
    this.bannerFile = null;
    this.bannerPreview = null;
    this.storeForm.patchValue({ bannerImage: '' });
    const bannerInput = document.querySelector('#bannerInput') as HTMLInputElement;
    if (bannerInput) bannerInput.value = '';
  }

  public storeForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    currency: [{ value: '', disabled: true }, Validators.required],
    currencyCode: [{ value: '', disabled: true }, Validators.required],
    tax: [0],
    category: [{ value: '', disabled: true }, Validators.required],
    logo: [''],
    bannerImage: [''],
    contactInfo: this.fb.group({
      email: ['', [Validators.email]],
      phone: [''],
      placeName: [''],
      city: [''],
      state: [''],
      country: [''],
    }),
  });

  public categories = rxResource({
    stream: () => this.storeService.getStoreCategories(),
  });

  public deliveryZones = rxResource({
    stream: () => this.storeService.deliveryZones(),
  });



  public states = toSignal(
    this.storeForm.get('contactInfo.country')!.valueChanges.pipe(
      map((country) => {
        const countryData = this.deliveryZones
          .value()
          ?.find((c) => c.country === country);
        if (!countryData) {
          this.storeForm.get('contactInfo.state')?.disable();
          return [];
        }
        this.storeForm.get('contactInfo.state')?.enable();
        return countryData.states || [];
      })
    )
  );

  public localities = toSignal(
    this.storeForm.get('contactInfo.state')!.valueChanges.pipe(
      map((state) => {
        const cityData = this.states()?.find((c: any) => c.name === state);
        if (!cityData) {
          this.storeForm.get('contactInfo.city')?.disable();
          return [];
        }
        this.storeForm.get('contactInfo.city')?.enable();
        return cityData.localities || [];
      })
    )
  );

  ngOnInit(): void {
    const store = this.storeStore.selectedStore();
    console.log('Selected Store:', store);
    if (store) {
      this.storeForm.patchValue(store);
    }
  }


  private async uploadImages(storeId: string): Promise<void> {
    // Handle logo upload first
    if (this.logoFile) {
      const logoFormData = new FormData();
      logoFormData.append('file', this.logoFile); // Change 'file' to 'files' to match product upload
      try {
        await firstValueFrom(this.storeService.uploadLogo(logoFormData, storeId));
        // Add delay between uploads
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error uploading logo:', error);
        throw error;
      }
    }

    // Then handle banner upload
    if (this.bannerFile) {
      const bannerFormData = new FormData();
      bannerFormData.append('file', this.bannerFile); // Change 'file' to 'files' to match product upload
      try {
        await firstValueFrom(this.storeService.uploadBanner(bannerFormData, storeId));
      } catch (error) {
        console.error('Error uploading banner:', error);
        throw error;
      }
    }
  }

  async onSubmit() {
    if (this.storeForm.valid) {
      this.isSubmitting = true;
      try {
        const storeId = this.storeStore.selectedStore()?._id;
        if (!storeId) return;

        // First save store details
        const formValue = { ...this.storeForm.value };
        delete formValue.logo;
        delete formValue.bannerImage;
        await firstValueFrom(this.storeService.updateStore(storeId, formValue));

        // Then handle image uploads sequentially
        await this.uploadImages(storeId);

        this.snackBar.open('Store updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      } catch (error) {
        console.error('Error updating store:', error);
        this.snackBar.open('Failed to update store', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      } finally {
        this.isSubmitting = false;
      }
    }
  }


}
