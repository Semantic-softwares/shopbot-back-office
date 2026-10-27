import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { switchMap, catchError, of, map } from 'rxjs';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../shared/services/auth.service';
import { StoreService } from '../../shared/services/store.service';
import { UserService } from '../../shared/services/user.service';
import { SubscriptionService } from '../../shared/services/subscription.service';
import { User } from '../../shared/models';
import { ModuleKey } from '../../shared/models';
import { MODULE_OPTIONS, ModuleOption } from '../../shared/billing/module-options';

@Component({
  selector: 'app-signup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    ReactiveFormsModule,
    MatIconModule,
    MatSelectModule,
    MatStepperModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    RouterLink,
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private storeService = inject(StoreService);
  private userService = inject(UserService);
  private subscriptionService = inject(SubscriptionService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  @ViewChild('stepper') stepper!: MatStepper;

  readonly hidePassword = signal(true);
  readonly hideConfirmPassword = signal(true);
  readonly loading = signal(false);
  readonly validating = signal(false);

  // ── Module selection ──────────────────────────────────────────────────────

  readonly availableModules: ModuleOption[] = MODULE_OPTIONS;

  readonly selectedModules = signal<ModuleKey[]>(['PMS', 'POS', 'ERP']);
  readonly selectedModuleCountLabel = computed(() => {
    const count = this.selectedModules().length;
    return count === 1 ? $localize`1 module selected` : $localize`${count} modules selected`;
  });

  isModuleSelected(key: ModuleKey): boolean {
    return this.selectedModules().includes(key);
  }

  toggleModule(key: ModuleKey): void {
    this.selectedModules.update((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));
  }

  // ── Static data ───────────────────────────────────────────────────────────

  readonly storeTypes = [
    { value: 'restaurant', label: $localize`Restaurant` },
    { value: 'hotel', label: $localize`Hotel` },
    { value: 'real_estate', label: $localize`Real Estate` },
  ];

  readonly deliveryZones = rxResource({
    stream: () => this.storeService.deliveryZones(),
  });

  // ── Forms ─────────────────────────────────────────────────────────────────

  readonly merchantForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [
      '',
      [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)],
    ],
    gender: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
    pin: [
      null,
      [Validators.required, Validators.maxLength(4), Validators.pattern(/^\d+$/)],
    ],
  });

  readonly storeForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    storeType: ['hotel', Validators.required],
    billingEmail: ['', [Validators.required, Validators.email]],
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
      country: [''],
    }),
  });

  readonly states = toSignal(
    this.storeForm.get('country')!.valueChanges.pipe(
      map((country) => {
        const countryData = this.deliveryZones
          .value()
          ?.find((c: any) => c.country === country);
        return countryData?.states ?? [];
      }),
    ),
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  selectCountry(country: string): void {
    const zone = this.deliveryZones.value()?.find((z: any) => z.country === country);
    if (zone) {
      this.storeForm.patchValue({
        currency: zone.currency,
        currencyCode: zone.currencyCode,
        contactInfo: { country: zone.country },
      });
    }
  }

  togglePasswordVisibility(event: MouseEvent): void {
    this.hidePassword.set(!this.hidePassword());
    event.stopPropagation();
  }

  toggleConfirmPasswordVisibility(event: MouseEvent): void {
    this.hideConfirmPassword.set(!this.hideConfirmPassword());
    event.stopPropagation();
  }

  validateMerchantForm(): boolean {
    if (!this.merchantForm.valid) {
      this.merchantForm.markAllAsTouched();
      return false;
    }
    if (this.merchantForm.value.password !== this.merchantForm.value.confirmPassword) {
      this.snackBar.open($localize`Passwords do not match`, $localize`Close`, {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      });
      return false;
    }
    return true;
  }

  validateAndProceed(): void {
    if (!this.validateMerchantForm()) return;
    this.validating.set(true);

    const email = this.merchantForm.value.email!;
    const phoneNumber = this.merchantForm.value.phoneNumber!;

    this.userService
      .validateEmailAndPhoneNumber({ email, phoneNumber })
      .pipe(
        catchError(() => {
          this.snackBar.open($localize`Error validating information. Please try again.`, $localize`Close`, {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
          this.validating.set(false);
          return of(null);
        }),
      )
      .subscribe((result) => {
        this.validating.set(false);
        if (!result) return;

        const errors: string[] = [];
        if (!result.email) errors.push('Email is already registered');
        if (!result.phoneNumber) errors.push('Phone number is already registered');

        if (errors.length > 0) {
          this.snackBar.open(errors.join('. '), $localize`Close`, {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });
          return;
        }

        this.stepper.next();
      });
  }

  proceedToModules(): void {
    if (!this.storeForm.valid) {
      this.storeForm.markAllAsTouched();
      return;
    }
    this.stepper.next();
  }

  onSubmit(): void {
    if (!this.merchantForm.valid || !this.storeForm.valid) return;

    if (this.selectedModules().length === 0) {
      this.snackBar.open($localize`Please select at least one module to continue`, $localize`Close`, {
        duration: 4000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar'],
      });
      return;
    }

    this.loading.set(true);

    const merchantData: Partial<User> = {
      name: this.merchantForm.value.name ?? undefined,
      email: this.merchantForm.value.email ?? undefined,
      phoneNumber: this.merchantForm.value.phoneNumber ?? undefined,
      gender: this.merchantForm.value.gender ?? undefined,
      password: this.merchantForm.value.password ?? undefined,
      pin: this.merchantForm.value.pin ?? undefined,
      isOwner: true,
    };

    this.authService
      .signup(merchantData)
      .pipe(
        switchMap((merchant) => {
          const { billingEmail, ...storeFormValue } = this.storeForm.getRawValue();
          const storeData = {
            ...storeFormValue,
            owner: merchant._id,
            merchant: merchant._id,
            staffs: [merchant._id],
          };
          return this.storeService
            .addStore(storeData as any)
            .pipe(map((store) => ({ merchant, store })));
        }),
        switchMap(({ merchant, store }) =>
          this.subscriptionService
            .setupSubscription({
              storeId: store._id,
              billingEmail: this.storeForm.get('billingEmail')?.value ?? '',
              modules: this.selectedModules(),
              billingCycle: 'MONTHLY',
            })
            .pipe(map(() => store)),
        ),
        catchError((error) => {
          this.snackBar.open(
            error.error?.message || error.message || 'Signup failed. Please try again.',
            $localize`Close`,
            {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar'],
            },
          );
          this.loading.set(false);
          return of(null);
        }),
      )
      .subscribe((store) => {
        if (store) {
          this.snackBar.open(
            'Account created successfully! Your store number is: ' + store.storeNumber,
            $localize`Close`,
            { duration: 10000, horizontalPosition: 'center', verticalPosition: 'top' },
          );
          setTimeout(() => this.router.navigate(['/auth/login']), 2000);
        }
        this.loading.set(false);
      });
  }
}
