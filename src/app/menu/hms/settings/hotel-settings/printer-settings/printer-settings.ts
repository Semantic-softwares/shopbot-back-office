import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import { StoreStore } from '../../../../../shared/stores/store.store';
import { StoreService } from '../../../../../shared/services/store.service';
import { BluetoothPrinterService, PrinterConfiguration } from '../../../../../shared/services/bluetooth-printer.service';
import { MatDialogClose } from "@angular/material/dialog";

@Component({
  selector: 'app-printer-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  templateUrl: './printer-settings.html',
  styleUrl: './printer-settings.scss',
})
export class PrinterSettings implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private storeService = inject(StoreService);
  private printerService = inject(BluetoothPrinterService);
  public storeStore = inject(StoreStore);

  loading = signal(false);
  saving = signal(false);
  printerConnecting = signal(false);
  printerConnected = signal(false);
  connectedPrinter = signal<{ name: string; id: string } | null>(null);
  
  printerSettingsForm!: FormGroup;

  paperSizeOptions = [
    { value: '58mm', label: '58mm (2.3 inches)' },
    { value: '80mm', label: '80mm (3.1 inches)' },
    { value: '112mm', label: '112mm (4.4 inches)' }
  ];

  printQualityOptions = [
    { value: 'draft', label: 'Draft (Fast)' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High Quality' }
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.loadSettings();
    this.checkPrinterStatus();
  }

  private initializeForm(): void {
    this.printerSettingsForm = this.fb.group({
      paperSize: ['80mm', Validators.required],
      printQuality: ['normal', Validators.required],
      autocut: [true],
      headerText: [''],
      footerText: ['Thank you for your stay!'],
      includeLogo: [true],
      fontSize: [12, [Validators.required, Validators.min(8), Validators.max(20)]],
      lineSpacing: [1.2, [Validators.required, Validators.min(1), Validators.max(3)]]
    });
  }

  private loadSettings(): void {
    this.loading.set(true);
    
    const store = this.storeStore.selectedStore();
    if (store?.hotelSettings?.printerConfiguration) {
      this.printerSettingsForm.patchValue(store.hotelSettings.printerConfiguration);
    }
    
    this.loading.set(false);
  }

  private checkPrinterStatus(): void {
    const printerInfo = this.printerService.getConnectedDeviceInfo();
    if (printerInfo) {
      this.connectedPrinter.set(printerInfo);
      this.printerConnected.set(true);
    }
  }

  async connectPrinter(): Promise<void> {
    this.printerConnecting.set(true);
    try {
      await this.printerService.connectToPrinter();
      const printerInfo = this.printerService.getConnectedDeviceInfo();
      if (printerInfo) {
        this.connectedPrinter.set(printerInfo);
        this.printerConnected.set(true);
        this.snackBar.open('Printer connected successfully!', 'Close', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error connecting to printer:', error);
      this.snackBar.open('Failed to connect to printer.', 'Close', { duration: 5000 });
    } finally {
      this.printerConnecting.set(false);
    }
  }

  disconnectPrinter(): void {
    this.printerService.disconnectPrinter();
    this.connectedPrinter.set(null);
    this.printerConnected.set(false);
    this.snackBar.open('Printer disconnected', 'Close', { duration: 3000 });
  }

  getCurrentPrinterConfiguration(): PrinterConfiguration {
    const store = this.storeStore.selectedStore();
    const storedConfig = store?.hotelSettings?.printerConfiguration;
    
    return {
      paperSize: this.printerSettingsForm.get('paperSize')?.value || storedConfig?.paperSize || '80mm',
      printQuality: this.printerSettingsForm.get('printQuality')?.value || storedConfig?.printQuality || 'normal',
      autocut: this.printerSettingsForm.get('autocut')?.value ?? storedConfig?.autocut ?? true,
      headerText: this.printerSettingsForm.get('headerText')?.value || storedConfig?.headerText || '',
      footerText: this.printerSettingsForm.get('footerText')?.value || storedConfig?.footerText || 'Thank you for your stay!',
      includeLogo: this.printerSettingsForm.get('includeLogo')?.value ?? storedConfig?.includeLogo ?? true,
      fontSize: this.printerSettingsForm.get('fontSize')?.value || storedConfig?.fontSize || 12,
      lineSpacing: this.printerSettingsForm.get('lineSpacing')?.value || storedConfig?.lineSpacing || 1.2
    };
  }

  async testPrint(): Promise<void> {
    try {
      const printerConfig = this.getCurrentPrinterConfiguration();
      await this.printerService.testPrint(printerConfig);
      this.snackBar.open('Test print sent successfully!', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Error during test print:', error);
      this.snackBar.open('Test print failed.', 'Close', { duration: 5000 });
    }
  }

  async testPaperUtilization(): Promise<void> {
    try {
      const printerConfig = this.getCurrentPrinterConfiguration();
      await this.printerService.testPaperUtilization(printerConfig);
      this.snackBar.open('Paper utilization test sent!', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Error during paper utilization test:', error);
      this.snackBar.open('Paper utilization test failed.', 'Close', { duration: 5000 });
    }
  }

  async uploadLogo(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          if (e.target?.result) {
            await this.printerService.uploadLogo(e.target.result as ArrayBuffer);
            this.snackBar.open('Logo uploaded successfully!', 'Close', { duration: 3000 });
          }
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error('Error uploading logo:', error);
        this.snackBar.open('Failed to upload logo.', 'Close', { duration: 5000 });
      }
    }
  }

  savePrinterSettings(): void {
    if (this.printerSettingsForm.valid && this.storeStore.selectedStore()) {
      this.saving.set(true);
      
      const currentStore = this.storeStore.selectedStore()!;
      const printerConfig = this.printerSettingsForm.value;
      
      const storeUpdatePayload = {
        hotelSettings: {
          ...currentStore.hotelSettings,
          printerConfiguration: printerConfig
        }
      };

      this.storeService.updateStore(currentStore._id, storeUpdatePayload).subscribe({
        next: () => {
          this.storeService.getStore(currentStore._id).subscribe({
            next: (updatedStore) => {
              this.storeStore.updateStore(updatedStore);
              this.storeService.saveStoreLocally(updatedStore);
              this.saving.set(false);
              this.snackBar.open('Printer settings saved successfully!', 'Close', { duration: 3000 });
            },
            error: (fetchError) => {
              console.error('Error fetching updated store:', fetchError);
              this.saving.set(false);
              this.snackBar.open('Settings saved but failed to update local data.', 'Close', { duration: 5000 });
            }
          });
        },
        error: (error) => {
          console.error('Error saving printer settings:', error);
          this.saving.set(false);
          this.snackBar.open('Failed to save printer settings.', 'Close', { duration: 5000 });
        }
      });
    }
  }
}
