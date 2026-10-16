import {
  Component,
  input,
  output,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Guest } from '../../../../../../../shared/models/reservation.model';
import { GuestFormModalComponent } from '../../../../../../../shared/components/guest-form-modal/guest-form-modal.component';
import { GuestSearchComponent } from '../../../../../../../shared/components/guest-search/guest-search.component';
import { Form, FormArray, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReservationFormService } from '../../../../../../../shared/services/reservation-form.service';
import { GuestService } from '../../../../../../../shared/services/guest.service';
import { GetGuestNamePipe } from "../../../../../../../shared/pipes/get-guest-name.pipe";

@Component({
  selector: 'app-guest-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    GuestSearchComponent,
    GetGuestNamePipe
],
  templateUrl: './guest-details.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./guest-details.component.scss'],
})
export class GuestDetailsComponent {
  private reservationFormService = inject(ReservationFormService);
    public reservationForm = toSignal<FormGroup | null>(
      this.reservationFormService.form$,
      { initialValue: null }
    );
  guest = input<Guest | null>(null);
  bookingType = signal<string>(this.reservationForm()!.get('bookingType')?.value || 'single');
  guestEdited = output<Guest>();
  guestSelected = output<Guest>();
  private dialog = inject(MatDialog);

  /** Searching for a different guest while the current one stays on the card until a new one is picked. */
  changing = signal(false);
  showMore = signal(false);

  private guestService = inject(GuestService);

  initials = computed(() => {
    const parts = (this.guestService.getGuestName(this.guest()) || '').split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?';
  });

  addressLine = computed(() => {
    const a = this.guest()?.address;
    return [a?.street, a?.city, a?.country].filter(Boolean).join(', ');
  });

  isCorporate = computed(() => this.guest()?.guestType !== undefined && this.guest()?.guestType !== 'individual');

  /** Anything beyond name + contact that is worth a "more details" fold. */
  hasMoreDetails = computed(() => {
    const g = this.guest();
    return !!(g?.dateOfBirth || g?.nationality || g?.companyRegistrationNumber || g?.address?.street || g?.address?.city || g?.address?.country || g?.contactPersonFirstName);
  });

  public onAddGuest(): void {
    const dialogRef = this.dialog.open(GuestFormModalComponent, {
      width: '600px',
      disableClose: false,
      data: { bookingType: this.bookingType(), ageGrade: 'adult' }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.onGuestSearchSelected(result);
      }
    });
  }

  public onGuestSearchSelected(guest: Guest): void {
    this.changing.set(false);
    this.guestSelected.emit(guest);
  }

  public onEditGuest(): void {
    const guest = this.guest();
    if (!guest) return;

    const dialogRef = this.dialog.open(GuestFormModalComponent, {
      width: '600px',
      disableClose: false,
      data: {
        guest: guest,
        bookingType: this.bookingType(),
        ageGrade: 'adult'
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.guestEdited.emit(result);
      }
    });
  }
}
