import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Tenant } from '../../../../../shared/models/estate.model';
import { CreateTenantDialogComponent } from '../../../../../shared/components/create-tenant-dialog/create-tenant-dialog.component';

@Component({
  selector: 'app-lease-step-tenants',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lease-step-tenants.component.html',
})
export class LeaseStepTenantsComponent {
  private dialog = inject(MatDialog);

  @Input({ required: true }) tenantsGroup!: FormGroup;
  @Input() tenants: Tenant[] = [];
  readonly tenantSearchControl = new FormControl<string>('', { nonNullable: true });

  tenantLabel(tenant: Tenant): string {
    return `${tenant.firstName} ${tenant.middleName || ''} ${tenant.lastName}`.replace(/\s+/g, ' ').trim();
  }

  selectedTenantIds(): string[] {
    return (this.tenantsGroup.get('tenantIds')?.value as string[] | null) || [];
  }

  selectedTenantLabel(tenantId: string): string {
    const tenant = this.tenants.find((item) => item._id === tenantId);
    return tenant ? this.tenantLabel(tenant) : tenantId;
  }

  filteredTenants(): Tenant[] {
    const selected = new Set(this.selectedTenantIds());
    const search = this.tenantSearchControl.value.trim().toLowerCase();

    return this.tenants.filter((tenant) => {
      if (selected.has(tenant._id)) return false;
      if (!search) return true;

      const fullName = this.tenantLabel(tenant).toLowerCase();
      return fullName.includes(search) || (tenant.email || '').toLowerCase().includes(search);
    });
  }

  selectTenant(event: MatAutocompleteSelectedEvent): void {
    this.addTenant(event.option.value as string);
  }

  removeTenant(tenantId: string): void {
    const tenantIds = this.selectedTenantIds().filter((id) => id !== tenantId);
    this.tenantsGroup.get('tenantIds')?.setValue(tenantIds);
    this.tenantsGroup.get('tenantIds')?.markAsTouched();
    this.tenantsGroup.get('tenantIds')?.markAsDirty();
  }

  private addTenant(tenantId: string): void {
    if (!tenantId) return;

    const existing = this.selectedTenantIds();
    if (existing.includes(tenantId)) {
      this.tenantSearchControl.setValue('');
      return;
    }

    this.tenantsGroup.get('tenantIds')?.setValue([...existing, tenantId]);
    this.tenantsGroup.get('tenantIds')?.markAsTouched();
    this.tenantsGroup.get('tenantIds')?.markAsDirty();
    this.tenantSearchControl.setValue('');
  }

  openCreateTenantDialog(): void {
    const ref = this.dialog.open(CreateTenantDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      disableClose: true,
    });

    ref.afterClosed().subscribe((tenant: Tenant | null) => {
      if (!tenant) return;
      this.tenants = [...this.tenants, tenant];
      this.addTenant(tenant._id);
    });
  }
}
