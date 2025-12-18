import {
  Component,
  input,
  output,
  inject,
  computed,
  effect,
  linkedSignal,
  signal,
  OnInit,
  untracked,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  ReactiveFormsModule,
  FormBuilder,
  ControlContainer,
  FormGroupDirective,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../../../../../shared/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReservationFormService } from '../../../../../../../shared/services/reservation-form.service';
import { distinctUntilChanged, tap } from 'rxjs';

@Component({
  selector: 'app-stay-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './stay-details.component.html',
  styleUrls: ['./stay-details.component.scss'],
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective },
  ], // Key step
})
export class StayDetailsComponent implements AfterViewInit {
  private reservationFormService = inject(ReservationFormService);
  public reservationForm = toSignal<FormGroup | null>(
    this.reservationFormService.form$,
    { initialValue: null }
  );
  private checkInDate = toSignal<Date | null>(
    this.reservationForm()!.get('checkInDate')!.valueChanges,
    { initialValue: this.reservationForm()!.get('checkInDate')!.value }
  );
  private checkOutDate = toSignal<Date | null>(
    this.reservationForm()!.get('checkOutDate')!.valueChanges,
    { initialValue: this.reservationForm()!.get('checkOutDate')!.value }
  );

  numberOfNights = computed(() => {
    const checkIn = this.checkInDate();
    const checkOut = this.checkOutDate();
    if (checkIn && checkOut) {
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  });

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  // Inputs
  quickReservation = input<any>(null);
  isEditing = input<boolean>(false);

  // Outputs
  dateChanged = output<void>();

  // Computed signal for current user
  currentUser = toSignal(this.authService.currentUser, { initialValue: null });

  // Display name for sales person
  salesPersonName = computed(() => {
    const user = this.currentUser();
    if (user) {
      return user.name || '';
    }
    return '';
  });

  ngAfterViewInit() {
    // Sync form values after view init to avoid ExpressionChangedAfterItHasBeenCheckedError

    this.reservationForm()?.valueChanges
    .pipe(
    distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
  ).subscribe((d) => {
      this.reservationForm()?.patchValue(
        {
          createdBy: this.currentUser()?._id,
          checkInDate: this.checkInDate(),
          checkOutDate: this.checkOutDate(),
          numberOfNights: this.numberOfNights(),
        },
        { emitEvent: false }
      );
    });
  }


  onDateChange() {
    this.dateChanged.emit();
  }
}
