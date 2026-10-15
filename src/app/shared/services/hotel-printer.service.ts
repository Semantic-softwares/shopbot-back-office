import { Injectable, inject } from '@angular/core';
import { BluetoothPrinterService, PrinterConfiguration } from './bluetooth-printer.service';
import { StoreStore } from '../stores/store.store';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class HotelPrinterService {
  private bluetoothPrinterService = inject(BluetoothPrinterService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);

  /**
   * Get the current hotel's printer configuration from the store
   */
  getHotelPrinterConfiguration(): PrinterConfiguration {
    const store = this.storeStore.selectedStore();
    const storedConfig = store?.hotelSettings?.printerConfiguration;
    
    // Return stored configuration with fallbacks
    return {
      paperSize: (storedConfig?.paperSize as '58mm' | '80mm' | '112mm') || '80mm',
      printQuality: (storedConfig?.printQuality as 'draft' | 'normal' | 'high') || 'normal',
      autocut: storedConfig?.autocut ?? true,
      headerText: storedConfig?.headerText || '',
      footerText: storedConfig?.footerText || 'Thank you for your stay!',
      includeLogo: storedConfig?.includeLogo ?? true,
      fontSize: storedConfig?.fontSize || 12,
      lineSpacing: storedConfig?.lineSpacing || 1.2
    };
  }

  /**
   * Print a reservation using hotel printer settings
   */
  async printReservation(reservation: any): Promise<void> {
    try {
      const store = this.storeStore.selectedStore();
      if (!store) {
        throw new Error('No store selected');
      }

      const printerConfig = this.getHotelPrinterConfiguration();
      await this.bluetoothPrinterService.printReservation(reservation, store, printerConfig);
      this.snackBar.open($localize`Reservation printed successfully!`, $localize`Close`, { duration: 3000 });
    } catch (error) {
      console.error('Error printing reservation:', error);
      this.snackBar.open($localize`Failed to print reservation. Please check printer connection.`, $localize`Close`, { duration: 5000 });
      throw error;
    }
  }

  /**
   * Perform test print using hotel printer settings
   */
  async testPrint(): Promise<void> {
    try {
      const printerConfig = this.getHotelPrinterConfiguration();
      await this.bluetoothPrinterService.testPrint(printerConfig);
      this.snackBar.open($localize`Test print sent successfully with hotel settings!`, $localize`Close`, { duration: 3000 });
    } catch (error) {
      console.error('Error during test print:', error);
      this.snackBar.open($localize`Test print failed. Please check printer connection.`, $localize`Close`, { duration: 5000 });
      throw error;
    }
  }

  /**
   * Test paper utilization using hotel printer settings
   */
  async testPaperUtilization(): Promise<void> {
    try {
      const printerConfig = this.getHotelPrinterConfiguration();
      await this.bluetoothPrinterService.testPaperUtilization(printerConfig);
      this.snackBar.open($localize`Paper utilization test sent successfully!`, $localize`Close`, { duration: 3000 });
    } catch (error) {
      console.error('Error during paper utilization test:', error);
      this.snackBar.open($localize`Paper utilization test failed. Please check printer connection.`, $localize`Close`, { duration: 5000 });
      throw error;
    }
  }

  /**
   * Connect to Bluetooth printer
   */
  async connectPrinter() {
    return this.bluetoothPrinterService.connectToPrinter();
  }

  /**
   * Disconnect from Bluetooth printer
   */
  async disconnectPrinter() {
    return this.bluetoothPrinterService.disconnectPrinter();
  }

  /**
   * Check if printer is connected
   */
  isConnected(): boolean {
    return this.bluetoothPrinterService.isConnected();
  }

  /**
   * Get connected device info
   */
  getConnectedDeviceInfo() {
    return this.bluetoothPrinterService.getConnectedDeviceInfo();
  }

  /**
   * Check if Bluetooth is supported
   */
  isBluetoothSupported(): boolean {
    return this.bluetoothPrinterService.isBluetoothSupported();
  }

  /**
   * Upload logo to printer memory
   */
  async uploadLogo(logoData: string | ArrayBuffer): Promise<void> {
    try {
      await this.bluetoothPrinterService.uploadLogo(logoData);
      this.snackBar.open($localize`Logo uploaded to printer successfully!`, $localize`Close`, { duration: 3000 });
    } catch (error) {
      console.error('Error uploading logo:', error);
      this.snackBar.open($localize`Failed to upload logo. Please check printer connection.`, $localize`Close`, { duration: 5000 });
      throw error;
    }
  }
}