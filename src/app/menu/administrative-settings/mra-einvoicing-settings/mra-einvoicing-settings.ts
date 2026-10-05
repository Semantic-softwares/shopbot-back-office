import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormGroup } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MraAuditEntry, MraOwnerView, MraStatus, MraTestUserKind, MraView } from '../../../shared/models';
import { MraEinvoicingService } from '../../../shared/services/mra-einvoicing.service';
import { StoreStore } from '../../../shared/stores/store.store';

const MRA_PORTAL_URL = 'https://www.mra.mu';

const ACTIVITY_LABELS: Record<string, string> = {
  BUSINESS_SAVED: 'Business details saved',
  BUSINESS_UPDATED: 'Business details updated',
  REGISTRATION_SAVED: 'MRA registration steps updated',
  TRANSMISSION_CREDENTIALS_ADDED: 'MRA Transmission User added',
  TRANSMISSION_CREDENTIALS_UPDATED: 'MRA Transmission User updated',
  EBS_REGISTERED: 'Shopbot registered as EBS for this place of business',
  EBS_UPDATED: 'EBS details changed',
  TEST_DRIVE_STARTED: 'MRA Test Drive started',
  TEST_DRIVE_PASSED: 'MRA Test Drive passed',
  TEST_DRIVE_FAILED: 'MRA Test Drive did not pass',
  TEST_DRIVE_RESET: 'MRA Test Drive restarted from scratch',
  TESTS_RESET: 'Testing restarted after a change',
  ONBOARDING_SUBMITTED: 'EBS sent for onboarding',
  ONBOARDING_APPROVED: 'Onboarding approved',
  LIVE_ACTIVATION_REFUSED: 'LIVE activation was refused',
  LIVE_ACTIVATION_REQUESTED: 'LIVE activation requested',
  LIVE_ACTIVATED: 'LIVE fiscalisation activated',
  LIVE_SUSPENDED: 'LIVE fiscalisation suspended',
  AUTHENTICATION_SUCCEEDED: 'Connected to MRA',
  AUTHENTICATION_FAILED: 'Could not sign in to MRA',
  INTERRUPTED: 'Connection problem',
  RECOVERED: 'Connection restored',
};

const FIRST_TIME_STEPS = [
  'Register your business with MRA as an Economic Operator, and register your places of business.',
  'Create your MRA Transmission User, which lets Shopbot send your invoices.',
  'Register Shopbot as your EBS for each place of business.',
  'Complete the MRA Test Drive and send the EBS for onboarding.',
  'Approve onboarding, then activate LIVE fiscalisation.',
];

type Mode = 'status' | 'wizard';

// The merchant's guided route from "not connected" to LIVE. Shopbot is already a
// certified EBS; this is the business's own MRA onboarding. Nothing here can turn
// LIVE on early: the server only offers activation once the tests have passed.
@Component({
  selector: 'app-mra-einvoicing-settings',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
  ],
  templateUrl: './mra-einvoicing-settings.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class MraEinvoicingSettings implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private service = inject(MraEinvoicingService);
  private storeStore = inject(StoreStore);

  readonly portalUrl = MRA_PORTAL_URL;
  readonly firstTimeSteps = FIRST_TIME_STEPS;

  loading = signal(true);
  loadFailed = signal(false);
  saving = signal(false);
  mode = signal<Mode>('status');
  wizardStep = signal(1);
  view = signal<MraView | null>(null);
  audit = signal<MraAuditEntry[] | null>(null);
  liveConfirmOpen = signal(false);
  suspendOpen = signal(false);

  owner = computed(() => {
    const v = this.view();
    return v && v.role === 'OWNER' ? (v as MraOwnerView) : null;
  });
  member = computed(() => {
    const v = this.view();
    return v && v.role === 'MEMBER' ? v : null;
  });

  businessForm = this.fb.nonNullable.group({
    legalName: ['', Validators.required],
    tradingName: [''],
    tan: ['', [Validators.required, Validators.pattern(/^\s*\d{8}\s*$/)]],
    brn: ['', Validators.required],
    businessAddr: ['', Validators.required],
    businessPhone: [''],
    businessEmail: [''],
  });

  registrationForm = this.fb.nonNullable.group({
    registeredAsOperator: false,
    placesOfBusinessRegistered: false,
    transmissionUserCreated: false,
  });

  transmissionForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: [''],
  });

  ebsForm = this.fb.nonNullable.group({
    ebsMraId: ['', Validators.required],
    areaCode: ['', Validators.required],
    placeOfBusinessReference: [''],
    testUserKind: ['' as MraTestUserKind | '', Validators.required],
    ebsRegistered: false,
  });

  liveConfirmation = this.fb.nonNullable.control('');
  suspendReason = this.fb.nonNullable.control('');
  suspendConfirmation = this.fb.nonNullable.control('');

  // A form isn't a signal, so follow its changes explicitly or this never updates.
  private registrationValue = toSignal(this.registrationForm.valueChanges.pipe(startWith(this.registrationForm.getRawValue())), { initialValue: this.registrationForm.getRawValue() });
  registrationComplete = computed(() => {
    const c = this.registrationValue();
    return !!(c.registeredAsOperator && c.placesOfBusinessRegistered && c.transmissionUserCreated);
  });

  private get storeId(): string | undefined {
    return this.storeStore.selectedStore()?._id;
  }

  ngOnInit(): void {
    this.refresh(true);
  }

  private refresh(initial = false): void {
    const storeId = this.storeId;
    if (!storeId) return this.fail();
    this.service.get(storeId).subscribe({
      next: (view) => {
        this.apply(view);
        if (initial) this.loading.set(false);
      },
      error: () => this.fail(),
    });
  }

  private fail(): void {
    this.loadFailed.set(true);
    this.loading.set(false);
  }

  private apply(view: MraView): void {
    this.view.set(view);
    if (view.role !== 'OWNER') return;
    this.businessForm.patchValue(view.business);
    this.registrationForm.patchValue(view.registration);
    this.transmissionForm.patchValue({ username: view.transmissionUser.username, password: '' });
    this.ebsForm.patchValue({
      ebsMraId: view.placeOfBusiness.ebsMraId,
      areaCode: view.placeOfBusiness.areaCode,
      placeOfBusinessReference: view.placeOfBusiness.reference,
      testUserKind: view.placeOfBusiness.testUserKind ?? '',
      ebsRegistered: view.placeOfBusiness.ebsRegistered,
    });
  }

  // ---- Wizard -----------------------------------------------------------

  startSetup(): void {
    const o = this.owner();
    const firstOpen = o ? o.progress.findIndex((p) => p.state !== 'DONE') : 0;
    this.wizardStep.set(Math.min(Math.max(firstOpen, 0), 3) + 1);
    this.mode.set('wizard');
  }

  leaveWizard(): void {
    this.mode.set('status');
  }

  goToStep(step: number): void {
    this.wizardStep.set(step);
  }

  saveBusiness(): void {
    const storeId = this.storeId;
    if (!storeId || this.businessForm.invalid) return this.businessForm.markAllAsTouched();
    this.run(this.service.saveBusiness(storeId, this.businessForm.getRawValue()), this.businessForm, () => this.wizardStep.set(2));
  }

  saveRegistration(): void {
    const storeId = this.storeId;
    if (!storeId) return;
    this.run(this.service.saveRegistration(storeId, this.registrationForm.getRawValue()), undefined, () => {
      if (this.registrationComplete()) this.wizardStep.set(3);
      else this.mode.set('status');
    });
  }

  saveTransmissionUser(): void {
    const storeId = this.storeId;
    if (!storeId || this.transmissionForm.invalid) return this.transmissionForm.markAllAsTouched();
    this.run(this.service.saveTransmissionUser(storeId, this.transmissionForm.getRawValue()), this.transmissionForm, () => this.wizardStep.set(4));
  }

  saveEbs(): void {
    const storeId = this.storeId;
    if (!storeId || this.ebsForm.invalid) return this.ebsForm.markAllAsTouched();
    this.run(this.service.saveEbs(storeId, this.ebsForm.getRawValue()), this.ebsForm, () => {
      this.mode.set('status');
      this.snackBar.open('Shopbot is registered for this place of business', 'Close', { duration: 5000 });
    });
  }

  // ---- After the MRA Test Drive ------------------------------------------

  submitOnboarding(): void {
    const storeId = this.storeId;
    if (storeId) this.run(this.service.submitOnboarding(storeId), undefined, () => undefined);
  }

  approveOnboarding(): void {
    const storeId = this.storeId;
    if (storeId) this.run(this.service.approveOnboarding(storeId), undefined, () => undefined);
  }

  resetTesting(): void {
    const storeId = this.storeId;
    if (storeId) this.run(this.service.resetTesting(storeId), undefined, () => this.snackBar.open('MRA Test Drive restarted from scratch', 'Close', { duration: 5000 }));
  }

  // ---- LIVE ---------------------------------------------------------------

  activateLive(): void {
    const storeId = this.storeId;
    if (!storeId) return;
    this.run(this.service.activateLive(storeId, this.liveConfirmation.value), undefined, () => {
      this.liveConfirmOpen.set(false);
      this.liveConfirmation.reset('');
      this.snackBar.open('LIVE fiscalisation is on', 'Close', { duration: 5000 });
    });
  }

  suspend(): void {
    const storeId = this.storeId;
    if (!storeId) return;
    this.run(this.service.suspend(storeId, this.suspendReason.value, this.suspendConfirmation.value), undefined, () => {
      this.suspendOpen.set(false);
      this.suspendReason.reset('');
      this.suspendConfirmation.reset('');
    });
  }

  toggleActivity(): void {
    const storeId = this.storeId;
    if (!storeId) return;
    if (this.audit()) return this.audit.set(null);
    this.service.audit(storeId).subscribe((entries) => this.audit.set(entries));
  }

  // ---- Helpers --------------------------------------------------------------

  activityLabel(action: string): string {
    return ACTIVITY_LABELS[action] ?? action.replace(/_/g, ' ').toLowerCase();
  }

  pillClass(status: MraStatus): string {
    switch (status) {
      case 'LIVE':
        return 'bg-green-50 text-green-700';
      case 'TEST_PASSED':
      case 'PENDING_ONBOARDING':
      case 'READY_FOR_LIVE':
        return 'bg-emerald-50 text-emerald-700';
      case 'TEST_CONFIGURATION':
      case 'TESTING':
        return 'bg-blue-50 text-blue-700';
      case 'TEST_FAILED':
      case 'CONNECTION_ERROR':
      case 'REQUIRES_REAUTHENTICATION':
        return 'bg-amber-50 text-amber-800';
      case 'SUSPENDED':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  /** Plain-language next action for each state; the raw MRA codes never reach this screen. */
  nextAction(status: MraStatus): string {
    switch (status) {
      case 'SETUP_IN_PROGRESS':
      case 'MRA_REGISTRATION_REQUIRED':
        return 'Finish setup to connect Shopbot to MRA.';
      case 'TEST_CONFIGURATION':
        return 'Shopbot is registered for this place of business. The MRA Test Drive is the next step.';
      case 'TESTING':
        return 'Your MRA Test Drive is in progress.';
      case 'TEST_FAILED':
        return 'A Test Drive scenario did not pass. MRA requires the Test Drive to restart from scratch.';
      case 'TEST_PASSED':
        return 'The Test Drive passed. Send the EBS for onboarding on the MRA portal, then record it here.';
      case 'PENDING_ONBOARDING':
        return 'Waiting for your business to approve the EBS onboarding on the MRA portal.';
      case 'READY_FOR_LIVE':
        return 'Your business has completed MRA testing and onboarding and is ready to activate LIVE fiscalisation.';
      case 'LIVE':
        return 'All invoices and receipts are being fiscalised with MRA.';
      case 'SUSPENDED':
        return 'Fiscalisation is suspended. Receipts say “Not Yet Fiscalised” until it is turned back on.';
      case 'CONNECTION_ERROR':
        return 'Shopbot can’t reach MRA right now. Sales are kept and sent when the connection is back.';
      case 'REQUIRES_REAUTHENTICATION':
        return 'MRA didn’t accept your Transmission User details. Please check them.';
      default:
        return '';
    }
  }

  modeLabel(mode: 'SANDBOX' | 'TEST_DRIVE' | 'LIVE'): string {
    return mode === 'TEST_DRIVE' ? 'Test Drive' : mode === 'LIVE' ? 'Live' : 'Sandbox';
  }

  private run(call: ReturnType<MraEinvoicingService['get']>, form: FormGroup | undefined, done: () => void): void {
    this.saving.set(true);
    call.subscribe({
      next: (view) => {
        this.saving.set(false);
        this.apply(view);
        done();
      },
      error: (err: HttpErrorResponse) => this.onError(err, form),
    });
  }

  // The server's per-field messages land on the matching inputs.
  private onError(err: HttpErrorResponse, form?: FormGroup): void {
    this.saving.set(false);
    const fieldErrors: Record<string, string> | undefined = err.error?.errors;
    if (fieldErrors && form) {
      for (const [key, message] of Object.entries(fieldErrors)) {
        form.get(key)?.setErrors({ server: message });
        form.get(key)?.markAsTouched();
      }
    }
    const raw = err.status === 403 ? 'Only the store owner can change this.' : fieldErrors ? 'Check the highlighted fields.' : (err.error?.message ?? 'Something went wrong. Please try again.');
    this.snackBar.open(Array.isArray(raw) ? raw.join(', ') : raw, 'Close', { duration: 6000 });
  }
}
