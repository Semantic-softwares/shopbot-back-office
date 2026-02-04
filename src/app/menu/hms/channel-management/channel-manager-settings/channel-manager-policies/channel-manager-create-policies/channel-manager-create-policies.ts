import { ChangeDetectionStrategy, Component, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { rxResource } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { PageHeaderComponent } from '../../../../../../shared/components/page-header/page-header.component';
import { HotelPolicy, HotelPolicyService } from '../../../../../../shared/services/hotel-policy.service';
import { StoreStore } from '../../../../../../shared/stores/store.store';

@Component({
  selector: 'app-channel-manager-create-policies',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatSnackBarModule,
    PageHeaderComponent,
  ],
  templateUrl: './channel-manager-create-policies.html',
  styleUrl: './channel-manager-create-policies.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChannelManagerCreatePolicies implements OnInit {
  private fb = inject(FormBuilder);
  private hotelPolicyService = inject(HotelPolicyService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private storeStore = inject(StoreStore);

  policyForm!: FormGroup;
  isSaving = false;
  isEditing = false;
  policyId: string | null = null;

  readonly internetAccessTypes = ['none', 'wifi', 'wired'];
  readonly internetAccessCoverages = ['entire_property', 'public_areas', 'all_rooms', 'some_rooms', 'business_centre'];
  readonly parkingTypes = ['on_site', 'nearby', 'none'];
  readonly parkingReservations = ['not_available', 'not_needed', 'needed'];
  readonly petsPolicies = ['allowed', 'not_allowed', 'by_arrangements', 'assistive_only'];
  readonly smokingPolicies = ['no_smoking', 'permitted_areas_only', 'allowed'];

  ngOnInit() {
    this.initializeForm();
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditing = true;
        this.policyId = params['id'];
        this.loadPolicy(params['id']);
      }
    });
  }

  private initializeForm() {
    this.policyForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      currency: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
      is_adults_only: [false],
      max_count_of_guests: [1, [Validators.required, Validators.min(1)]],
      checkin_from_time: ['00:00', Validators.required],
      checkin_to_time: ['12:00', Validators.required],
      checkout_from_time: ['15:00', Validators.required],
      checkout_to_time: ['18:00', Validators.required],
      internet_access_type: ['wifi', Validators.required],
      internet_access_coverage: ['entire_property', Validators.required],
      internet_access_cost: [null],
      parking_type: ['on_site', Validators.required],
      parking_reservation: ['needed', Validators.required],
      parking_is_private: [true, Validators.required],
      parking_cost: [null],
      pets_policy: ['allowed', Validators.required],
      pets_non_refundable_fee: ['0', Validators.required],
      pets_refundable_deposit: ['0', Validators.required],
      smoking_policy: ['no_smoking', Validators.required],
      enhanced_cleaning_practices: [false],
      cleaning_practices_description: [''],
      partner_hygiene_link: [''],
    });
  }

  private loadPolicy(id: string) {
    this.hotelPolicyService.getHotelPolicy(id).subscribe({
      next: (response) => {
        const policy = response.data?.attributes;
        if (policy) {
          this.policyForm.patchValue(policy);
        }
      },
      error: (error) => {
        const errorMessage = error.error?.message || 'Failed to load policy';
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
      },
    });
  }

  savePolicy() {
    if (!this.policyForm.valid) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.isSaving = true;
    const formValue = this.policyForm.getRawValue();
    const propertyId = this.storeStore.selectedStore()?.channex?.propertyId;

    const policyData: HotelPolicy = {
      ...formValue,
      property_id: propertyId,
      internet_access_cost: formValue.internet_access_cost ? String(formValue.internet_access_cost) : null,
      parking_cost: formValue.parking_cost ? String(formValue.parking_cost) : null,
      pets_non_refundable_fee: String(formValue.pets_non_refundable_fee),
      pets_refundable_deposit: String(formValue.pets_refundable_deposit),
    };

    const request = this.isEditing && this.policyId
      ? this.hotelPolicyService.updateHotelPolicy(this.policyId, policyData)
      : this.hotelPolicyService.createHotelPolicy(policyData);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        const message = this.isEditing ? 'Policy updated successfully' : 'Policy created successfully';
        this.snackBar.open(message, 'Close', { duration: 3000 });
        this.cancel();
      },
      error: (error) => {
        this.isSaving = false;
        const errorMessage = error.error?.message || 'Failed to save policy';
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
      },
    });
  }

  cancel() {
    this.router.navigate(['../../list'], { relativeTo: this.route });
  }
}
