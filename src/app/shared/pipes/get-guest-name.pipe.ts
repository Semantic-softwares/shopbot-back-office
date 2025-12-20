import { Pipe, PipeTransform, inject } from '@angular/core';
import { Guest } from '../models/reservation.model';
import { GuestService } from '../services/guest.service';

@Pipe({
  name: 'getGuestName',
  standalone: true,
})
export class GetGuestNamePipe implements PipeTransform {
  private guestService = inject(GuestService);

  transform(guest: Guest | null | undefined): string {
    return this.guestService.getGuestName(guest);
  }
}

