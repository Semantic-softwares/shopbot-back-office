import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Printer, PrinterService } from '../../../../../shared/services/printer.service';
import { StoreStore } from '../../../../../shared/stores/store.store';

@Component({
  selector: 'app-printer-form-modal',
  templateUrl: './printer-form-modal.component.html',
  styleUrls: ['./printer-form-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatCheckboxModule,
    MatTabsModule,
    MatSnackBarModule,
  ],
})
export class PrinterFormModalComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<PrinterFormModalComponent>);
  private fb = inject(FormBuilder);
  private printerService = inject(PrinterService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);
  data = inject(MAT_DIALOG_DATA) as { printer?: Printer; isEditMode: boolean };

  isSubmitting = signal(false);
  printerForm: FormGroup;

  connectionTypes = [
    { value: 'network', label: 'Network (TCP/IP)' },
    { value: 'usb-os', label: 'USB (OS Device)' },
    { value: 'usb-raw', label: 'USB (Raw Driver)' },
    { value: 'bluetooth', label: 'Bluetooth' },
  ];

  roles = [
    { value: 'station', label: 'Station' },
    { value: 'master', label: 'Master' },
    { value: 'backup', label: 'Backup' },
  ];

  paperSizes = [
    { value: 58, label: '58mm (Compact)' },
    { value: 80, label: '80mm (Standard)' },
  ];

  selectedConnectionType = signal<string>('network');

  constructor() {
    this.printerForm = this.fb.group({
      name: ['', Validators.required],
      connectionType: ['network', Validators.required],
      role: ['station', Validators.required],
      isActive: [true],
      capabilities: this.fb.group({
        paperWidth: [80, Validators.required],
        supportsQr: [false],
        supportsLogo: [false],
        supportsCut: [true],
      }),
      connection: this.fb.group({
        ip: [''],
        port: [9100],
        deviceName: [''],
        vendorId: [''],
        productId: [''],
        macAddress: [''],
        channel: [0],
      }),
    });
  }

  ngOnInit() {
    // Ensure initial connection type is set
    if (this.data?.printer?.connectionType) {
      this.selectedConnectionType.set(this.data.printer.connectionType);
    }
    
    // Patch form with printer data if in edit mode
    if (this.data?.printer) {
      console.log('🔧 [PRINTER_FORM] Loading printer data:', this.data.printer.name);
      
      this.printerForm.patchValue({
        name: this.data.printer.name,
        connectionType: this.data.printer.connectionType,
        role: this.data.printer.role,
        isActive: this.data.printer.isActive,
      });
      
      // Patch nested form groups
      const capabilitiesGroup = this.printerForm.get('capabilities');
      if (capabilitiesGroup && this.data.printer.capabilities) {
        capabilitiesGroup.patchValue(this.data.printer.capabilities);
      }
      
      const connectionGroup = this.printerForm.get('connection');
      if (connectionGroup && this.data.printer.connection) {
        connectionGroup.patchValue(this.data.printer.connection);
      }
      
      console.log('✅ [PRINTER_FORM] Form populated with printer data');
    } else {
      console.log('➕ [PRINTER_FORM] Creating new printer');
    }

    // Listen for connection type changes
    this.printerForm.get('connectionType')?.valueChanges.subscribe((type) => {
      this.selectedConnectionType.set(type);
    });
  }

  onSubmit() {
    if (!this.printerForm.valid) {
      this.snackBar.open('Please fill all required fields', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    this.isSubmitting.set(true);
    const storeId = this.storeStore.selectedStore()?._id;

    if (!storeId) {
      this.snackBar.open('Store not selected', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
      this.isSubmitting.set(false);
      return;
    }

    const formValue = this.printerForm.getRawValue();
    const printerData = {
      ...formValue,
      store: storeId,
    };

    const request$ = this.data.printer
      ? this.printerService.update(this.data.printer._id!, printerData)
      : this.printerService.create(printerData);

    request$.subscribe({
      next: (result) => {
        this.snackBar.open(
          `Printer ${this.data.printer ? 'updated' : 'created'} successfully`,
          'Close',
          {
            duration: 3000,
            panelClass: ['success-snackbar'],
          }
        );
        this.dialogRef.close(result);
      },
      error: (error) => {
        this.snackBar.open(
          `Error ${this.data.printer ? 'updating' : 'creating'} printer`,
          'Close',
          {
            duration: 3000,
            panelClass: ['error-snackbar'],
          }
        );
        this.isSubmitting.set(false);
      },
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
