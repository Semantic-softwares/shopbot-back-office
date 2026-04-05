import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TenantDetailPageComponent } from '../../tenant-detail-page.component';
import { EmergencyContact, Vehicle, Pet } from '../../../../../../../shared/models/estate.model';

@Component({
  selector: 'app-tenant-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatListModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './profile.component.html',
})
export class TenantProfileComponent {
  private parent = inject(TenantDetailPageComponent);

  readonly tenant = this.parent.tenant;

  readonly vehicles = computed(() => {
    const vList = this.tenant()?.vehicles || [];
    return vList.filter((v): v is Vehicle => typeof v === 'object');
  });

  readonly pets = computed(() => {
    const pList = this.tenant()?.pets || [];
    return pList.filter((p): p is Pet => typeof p === 'object');
  });

  readonly emergencyContacts = computed(() => this.tenant()?.emergencyContacts || []);

  emergencyContactSubtitle(contact: EmergencyContact): string {
    return [contact.relationship, contact.email].filter(Boolean).join(' • ');
  }

  getStatusColor(status: string): 'primary' | 'accent' | 'warn' {
    return status === 'ACTIVE' ? 'primary' : 'warn';
  }

  getAge(dateOfBirth?: string): number | null {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age -= 1;
    }
    return age >= 0 ? age : null;
  }

  vehicleLabel(v: Vehicle): string {
    const parts = [v.year, v.make, v.model].filter(Boolean).join(' ');
    return v.licensePlate ? `${parts} (${v.licensePlate})` : parts;
  }

  petLabel(p: Pet): string {
    return [p.name, p.type, p.breed].filter(Boolean).join(' — ');
  }
}
