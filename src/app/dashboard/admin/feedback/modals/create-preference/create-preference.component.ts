import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ChannelService } from '../../../../../shared/services/orders.service';
import { CompanyService } from '../../../../../shared/services/company.service';
import { PreferenceService } from '../../../../../shared/services/preference.service';
import { TouchPointService } from '../../../../../shared/services/touch-point.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { FEEDBACK_TYPES } from '../../../../../shared/constants/feedback-types.constant';
import { tap } from 'rxjs';

@Component({
  selector: 'app-create-preference',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './create-preference.component.html',
  styleUrls: ['./create-preference.component.scss']
})
export class CreatePreferenceComponent {
  private fb = inject(FormBuilder);
  private preferenceService = inject(PreferenceService);
  private touchPointService = inject(TouchPointService);
  private channelService = inject(ChannelService);
  private companyService = inject(CompanyService);
  public dialogRef = inject(MatDialogRef<CreatePreferenceComponent>);
  public data = inject(MAT_DIALOG_DATA);
  public feedback_types = FEEDBACK_TYPES
  public isSubmitting = signal(false);

  public form: FormGroup = this.fb.group({
    company: ['', Validators.required],
    touchPoint: ['', Validators.required],
    feedbackType: ['', Validators.required],
    channel: ['', Validators.required],
  });

  public touchPoints = rxResource({
    loader: () => this.touchPointService.getTouchPoints().pipe(tap(() => {
        if (this.data?.preference) {
            this.form.patchValue({touchPoint: this.data.preference.touchPoint._id})
        }
        
    }))
  });

  public channels = rxResource({
    loader: () => this.channelService.getChannels().pipe(tap(() => {
        if (this.data?.preference) {
         this.form.patchValue({channel: this.data.preference.channel._id})
        }
    }))
  });

  public companies = rxResource({
    loader: () => this.companyService.getAllCompanies()
  });

  constructor() {
    if (this.data?.preference) {
      this.form.patchValue(this.data.preference);
      this.form.patchValue({company: this.data.preference.company._id})
    } else {
      this.form.patchValue({company: this.data.companyId})
    }
  }

  onSave() {
    if (this.form.valid) {
      this.isSubmitting.set(true);
      if (this.data?.preference) {
        this.preferenceService.updatePreference(this.data?.preference?._id, this.form.value).subscribe((data) => {
          this.dialogRef.close(data);
        }, () => {
          this.isSubmitting.set(false);
        });
      } else {
        this.preferenceService.createPreference(this.form.value).subscribe((data) => {
          this.dialogRef.close(data);
        }, () => {
          this.isSubmitting.set(false);
        });
      }
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
