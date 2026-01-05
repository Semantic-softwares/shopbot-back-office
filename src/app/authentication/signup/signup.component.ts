import { Component, inject, signal, ViewChild } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { StoreService } from '../../shared/services/store.service';
import { UserService } from '../../shared/services/user.service';
import { switchMap, catchError, of, map } from 'rxjs';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { User } from '../../shared/models';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    ReactiveFormsModule,
    MatIconModule,
    MatSelectModule,
    MatStepperModule,
    MatProgressSpinnerModule,
    RouterLink,
    CommonModule
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private storeService = inject(StoreService);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  
  @ViewChild('stepper') stepper!: MatStepper;
  
  public hidePassword = signal(true);
  public hideConfirmPassword = signal(true);
  public loading = signal(false);
  public validating = signal(false);


  public deliveryZones = rxResource({
    stream: () => this.storeService.deliveryZones(),
  });

  // Store types
  public storeTypes = [
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'hotel', label: 'Hotel' }
  ];

  // Merchant (Owner) Form
  public merchantForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
    gender: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
    pin: [null, [Validators.required,  Validators.maxLength(4), Validators.pattern(/^\d+$/)]]
  });

  // Store Form
  public storeForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    storeType: ['hotel', Validators.required],
    description: [''],
    currency: ['', Validators.required],
    currencyCode: ['', Validators.required],
    country: ['', Validators.required],
    contactInfo: this.fb.group({
      email: ['', Validators.email],
      phone: [''],
      address: [''],
      city: [''],
      state: [''],
      country: ['']
    })
  });

  // States based on selected country (must be after storeForm)
  public states = toSignal(
    this.storeForm.get('country')!.valueChanges.pipe(
      map((country) => {
        const countryData = this.deliveryZones.value()?.find((c) => c.country === country);
        if (!countryData) {
          return [];
        }
        return countryData.states || [];
      })
    )
  );

  // Handle country selection - auto-populate currency fields
  public selectCountry(country: string): void {
    const selectedZone = this.deliveryZones.value()?.find((zone: any) => zone.country === country);
    if (selectedZone) {
      this.storeForm.patchValue({
        currency: selectedZone.currency,
        currencyCode: selectedZone.currencyCode,
        contactInfo: {
          country: selectedZone.country
        }
      });
    }
  }

  togglePasswordVisibility(event: MouseEvent) {
    this.hidePassword.set(!this.hidePassword());
    event.stopPropagation();
  }

  toggleConfirmPasswordVisibility(event: MouseEvent) {
    this.hideConfirmPassword.set(!this.hideConfirmPassword());
    event.stopPropagation();
  }

  validateMerchantForm(): boolean {
    if (!this.merchantForm.valid) {
      this.merchantForm.markAllAsTouched();
      return false;
    }
    
    // Check password match
    if (this.merchantForm.value.password !== this.merchantForm.value.confirmPassword) {
      this.snackBar.open('Passwords do not match', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      });
      return false;
    }
    return true;
  }

  /**
   * Validate email and phone number with backend before proceeding
   */
  validateAndProceed(): void {
    if (!this.validateMerchantForm()) {
      return;
    }

    this.validating.set(true);
    
    const email = this.merchantForm.value.email!;
    const phoneNumber = this.merchantForm.value.phoneNumber!;

    this.userService.validateEmailAndPhoneNumber({ email, phoneNumber })
      .pipe(
        catchError((error) => {
          this.snackBar.open('Error validating information. Please try again.', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
          this.validating.set(false);
          return of(null);
        })
      )
      .subscribe((result) => {
        this.validating.set(false);
        
        if (!result) return;

        const errors: string[] = [];
        
        if (!result.email) {
          errors.push('Email is already registered');
        }
        if (!result.phoneNumber) {
          errors.push('Phone number is already registered');
        }

        if (errors.length > 0) {
          this.snackBar.open(errors.join('. '), 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
          return;
        }

        // All validations passed, proceed to next step
        this.stepper.next();
      });
  }

  public onSubmit(): void {
    if (this.merchantForm.valid && this.storeForm.valid) {
      this.loading.set(true);

      // Prepare merchant data (convert null to undefined)
      // isOwner flag tells backend to assign Super Admin role
      const merchantData: Partial<User> = {
        name: this.merchantForm.value.name ?? undefined,
        email: this.merchantForm.value.email ?? undefined,
        phoneNumber: this.merchantForm.value.phoneNumber ?? undefined,
        gender: this.merchantForm.value.gender ?? undefined,
        password: this.merchantForm.value.password ?? undefined,
        pin: this.merchantForm.value.pin ?? undefined,
        isOwner: true, // Flag to assign Super Admin role
      };

      // Step 1: Create merchant (signup)
      this.authService.signup(merchantData)
        .pipe(
          switchMap((merchant) => {
            // Step 2: Create store with merchant as owner
            const storeData = {
              ...this.storeForm.value,
              owner: merchant._id,
              merchant: merchant._id,
              staffs: [merchant._id],
            };
            
            return this.storeService.addStore(storeData as any);
          }),
          catchError((error) => {
            this.snackBar.open(
              error.error?.message || error.message || 'Signup failed. Please try again.',
              'Close',
              {
                duration: 5000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['error-snackbar']
              }
            );
            this.loading.set(false);
            return of(null);
          })
        )
        .subscribe((store) => {
          if (store) {
            this.snackBar.open(
              'Account created successfully! Your store number is: ' + store.storeNumber,
              'Close',
              {
                duration: 10000,
                horizontalPosition: 'center',
                verticalPosition: 'top',
              }
            );
            
            // Navigate to login
            setTimeout(() => {
              this.router.navigate(['/auth/login']);
            }, 2000);
          }
          this.loading.set(false);
        });
    }
  }
}
