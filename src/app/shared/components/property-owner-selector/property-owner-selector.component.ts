import {
  ChangeDetectorRef,
  Component,
  inject,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RentalOwner } from '../../models/estate.model';
import { RentalOwnerFormModalComponent } from '../rental-owner-form-modal/rental-owner-form-modal.component';

@Component({
  selector: 'app-property-owner-selector',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
  ],
  templateUrl: './property-owner-selector.component.html',
})
export class PropertyOwnerSelectorComponent {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) ownersArray!: FormArray;
  @Input() title = 'PROPERTY OWNERS';
  @Input() subtitle = 'Who is the property owner?';

  get totalOwnershipPercentage(): number {
    let total = 0;
    for (let i = 0; i < this.ownersArray.length; i++) {
      total += Number(this.ownersArray.at(i).get('ownershipPercentage')?.value) || 0;
    }
    return total;
  }

  get ownershipExceeds100(): boolean {
    return this.totalOwnershipPercentage > 100;
  }

  getOwnerGroup(index: number): FormGroup {
    return this.ownersArray.at(index) as FormGroup;
  }

  openAddOwnerModal(): void {
    const dialogRef = this.dialog.open(RentalOwnerFormModalComponent, {
      width: '600px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((owner: RentalOwner | undefined) => {
      if (owner) {
        this.addOwnerToList(owner);
      }
    });
  }

  addOwnerToList(owner: RentalOwner): void {
    const exists = this.ownersArray.controls.some(
      (c) => c.get('ownerId')?.value === owner._id,
    );
    if (exists) {
      this.snackBar.open('This owner is already added', 'Close', { duration: 3000 });
      return;
    }

    const ownerGroup = this.fb.group({
      ownerId: [owner._id],
      ownerName: [this.getOwnerDisplayName(owner)],
      ownerEmail: [owner.email || ''],
      isCompany: [owner.isCompany],
      ownershipPercentage: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
    });
    this.ownersArray.push(ownerGroup);
    this.cdr.markForCheck();
  }

  removeOwner(index: number): void {
    this.ownersArray.removeAt(index);
    this.cdr.markForCheck();
  }

  getOwnerDisplayName(owner: RentalOwner): string {
    if (owner.isCompany && owner.companyName) {
      return owner.companyName;
    }
    return `${owner.firstName} ${owner.lastName}`;
  }
}
