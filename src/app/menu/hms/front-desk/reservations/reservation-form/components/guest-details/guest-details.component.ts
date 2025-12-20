import {
  Component,
  input,
  output,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Guest } from '../../../../../../../shared/models/reservation.model';
import { GuestFormModalComponent } from '../../../../../../../shared/components/guest-form-modal/guest-form-modal.component';
import { GuestSearchComponent } from '../../../../../../../shared/components/guest-search/guest-search.component';
import { Form, FormArray, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReservationFormService } from '../../../../../../../shared/services/reservation-form.service';
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
    MatListModule,
    GuestSearchComponent,
    GetGuestNamePipe
],
  templateUrl: './guest-details.component.html',
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
  guestAdded = output<void>();
  guestEdited = output<void>();
  guestDeleted = output<void>();
  guestSelected = output<Guest>();
  private dialog = inject(MatDialog);

  public onAddGuest(): void {
    const dialogRef = this.dialog.open(GuestFormModalComponent, {
      width: '600px',
      disableClose: false,
      data: { bookingType: this.bookingType(), ageGrade: 'adult' }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Guest was created, set it as selected
        this.onGuestSearchSelected(result);
      }
    });
  }

  

  public onGuestSearchSelected(guest: Guest): void {
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
        // Guest was updated, emit the event
        this.guestEdited.emit();
      }
    });
  }

  onDeleteGuest() {
    if (confirm('Are you sure you want to remove this guest?')) {
      this.guestDeleted.emit();
    }
  }
}
