import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { PrintJobService } from '../../../../shared/services/print-job.service';
import { StationsService } from '../../../../shared/services/station.service';
import { SocketService } from '../../../../shared/services/socket.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { PrintJob, PrintJobStats } from '../../../../shared/models/print-job.model';
import { Station } from '../../../../shared/models/station.model';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { BluetoothPrinterService } from '../../../../shared/services/bluetooth-printer.service';
import { Subscription } from 'rxjs';
import { Store } from '../../../../shared/models';

@Component({
  selector: 'app-print-jobs',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    PageHeaderComponent,
  ],
  templateUrl: './print-jobs.component.html',
  styleUrls: ['./print-jobs.component.scss'],
})
export class PrintJobsComponent implements OnInit, OnDestroy {
  private printJobService = inject(PrintJobService);
  private stationsService = inject(StationsService);
  private socketService = inject(SocketService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private bluetoothPrinterService = inject(BluetoothPrinterService);
  // State
  public printJobs = signal<PrintJob[]>([]);
  public stations = signal<Station[]>([]);
  public stats = signal<PrintJobStats>({
    total: 0,
    pending: 0,
    processing: 0,
    printed: 0,
    failed: 0,
  });
  public loading = signal(false);
  public error = signal<string | null>(null);

  // Bluetooth printer state
  public isBluetoothConnected = signal(false);
  public isBluetoothConnecting = signal(false);
  public connectedPrinterName = signal<string | null>(null);
  public bluetoothSupported = signal(this.bluetoothPrinterService.isBluetoothSupported());

  // Filters
  public selectedStatus = signal<string>('all');
  public selectedStation = signal<string>('all');

  // Computed
  public filteredJobs = computed(() => {
    let jobs = this.printJobs();
    const status = this.selectedStatus();
    const stationId = this.selectedStation();

    if (status !== 'all') {
      jobs = jobs.filter((job) => job.status === status);
    }

    if (stationId !== 'all') {
      jobs = jobs.filter((job) => {
        const jobStationId = typeof job.station === 'string' ? job.station : job.station._id;
        return jobStationId === stationId;
      });
    }

    return jobs;
  });

  // Table
  public displayedColumns = [
    'status',
    'order',
    'station',
    'printer',
    'createdAt',
    'printedAt',
    'retryCount',
    'actions',
  ];

  // Socket subscriptions
  private socketSubscriptions: Subscription[] = [];

  ngOnInit() {
    this.loadData();
    this.setupSocketListeners();
    this.checkBluetoothConnection();
  }

  ngOnDestroy() {
    this.socketSubscriptions.forEach((sub) => sub.unsubscribe());
    // Don't disconnect Bluetooth printer - keep connection persistent
  }

  private checkBluetoothConnection() {
    // Check if Bluetooth printer is already connected in memory (same session)
    const printer = this.bluetoothPrinterService.getConnectedPrinter();
    if (printer && printer.isConnected) {
      this.isBluetoothConnected.set(true);
      this.connectedPrinterName.set(printer.device.name || 'Unknown Printer');
      console.log('Active Bluetooth printer connection found:', printer.device.name);
    } else {
      // Check if there was a previous connection (from localStorage)
      const wasConnected = localStorage.getItem('bluetoothPrinterConnected') === 'true';
      const printerName = localStorage.getItem('bluetoothPrinterName');
      
      if (wasConnected && printerName) {
        // Show notification to reconnect
        const snackBarRef = this.snackBar.open(
          `Reconnect to ${printerName}?`,
          'Connect',
          {
            duration: 10000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          }
        );

        snackBarRef.onAction().subscribe(() => {
          this.connectBluetoothPrinter();
        });
      }
    }
  }

  private loadData() {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    this.loading.set(true);
    this.error.set(null);

    // Load print jobs
    this.printJobService.getPrintJobs(storeId, { limit: 100 }).subscribe({
      next: (jobs) => {
        this.printJobs.set(jobs);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set('Failed to load print jobs');
        this.loading.set(false);
      },
    });

    // Load stats
    this.printJobService.getPrintJobStats(storeId).subscribe({
      next: (stats) => {
        this.stats.set(stats);
      },
      error: (error) => {
        console.error('Failed to load stats:', error);
      },
    });

    // Load stations
    this.stationsService.getStations(storeId).subscribe({
      next: (stations) => {
        this.stations.set(stations);
      },
      error: (error) => {
        console.error('Failed to load stations:', error);
      },
    });
  }

  private setupSocketListeners() {
    // Listen for new print jobs
    const newJobSub = this.socketService.on<any>('printJob:created').subscribe({
      next: async (data) => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📡 [SOCKET EVENT] printJob:created');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📦 Socket Data:', data);
        
        this.snackBar.open(`New print job created for Order #${data.orderNumber || 'N/A'}`, 'View', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
        this.loadData(); // Reload data

        // Auto-print if conditions are met
        await this.handleAutoPrint(data);
      },
    });

    // Listen for completed jobs
    const completedSub = this.socketService.on<any>('printJob:completed').subscribe({
      next: (data) => {
        console.log('Print job completed:', data);
        this.updateJobStatus(data.jobId, 'printed');
      },
    });

    // Listen for failed jobs
    const failedSub = this.socketService.on<any>('printJob:failed').subscribe({
      next: (data) => {
        console.log('Print job failed:', data);
        this.snackBar.open(`Print job failed: ${data.error}`, 'Close', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar'],
        });
        this.updateJobStatus(data.jobId, 'failed', data.error);
      },
    });

    this.socketSubscriptions.push(newJobSub, completedSub, failedSub);
  }

  /**
   * Handle auto-printing based on store settings and conditions
   */
  private async handleAutoPrint(data: any): Promise<void> {
    try {
      console.log('🔍 [AUTO-PRINT] Checking auto-print conditions');
      
      // Extract print job data
      const printJob = data.printJob || data;
      
      if (!printJob) {
        console.warn('⚠️ [AUTO-PRINT] No print job data');
        return;
      }

      console.log('✓ Print Job ID:', printJob._id);
      console.log('✓ Job Status:', printJob.status);

      // Check if order exists
      const order = printJob.order;
      if (!order || typeof order !== 'object') {
        console.warn('⚠️ [AUTO-PRINT] No order object in print job');
        return;
      }

      console.log('✓ Order ID:', order._id);
      console.log('✓ Order Category:', order.category);
      console.log('✓ Payment Status:', order.paymentStatus);

      // Check if order is complete and paid
      const isComplete = order.category === 'Complete';
      const isPaid = order.paymentStatus === 'Paid';

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 [ORDER VALIDATION]');
      console.log('  Complete:', isComplete ? '✅' : '❌');
      console.log('  Paid:', isPaid ? '✅' : '❌');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      if (!isComplete || !isPaid) {
        console.log('⏭️ [AUTO-PRINT] Skipped - Order not complete or not paid');
        return;
      }

      // Check store setting for auto-print
      const printAfterFinish = this.storeStore.selectedStore()?.posSettings?.receiptSettings?.printAfterFinish ?? true;
      console.log('🔍 [STORE SETTING] printAfterFinish:', printAfterFinish);

      if (!printAfterFinish) {
        console.log('⏭️ [AUTO-PRINT] Skipped - Store setting printAfterFinish is disabled');
        return;
      }

      // Check if Bluetooth printer is connected
      const printerConnected = this.bluetoothPrinterService.isConnected();
      console.log('🖨️ [PRINTER CHECK] Bluetooth connected:', printerConnected ? '✅' : '❌');
      
      if (!printerConnected) {
        console.log('⏭️ [AUTO-PRINT] Skipped - Bluetooth printer not connected');
        return;
      }

      // All conditions met - auto-print ONLY via direct Bluetooth
      // NOTE: Do NOT create a new print job here - the socket event already indicates
      // a job exists. Creating another would cause an infinite loop.
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🖨️ [AUTO-PRINTING] Receipt via Bluetooth...');
      console.log('  Order:', order.reference || order._id);
      console.log('  Store:', order.store?.name || 'N/A');
      console.log('  Total:', order.total);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Generate receipt and send directly to Bluetooth printer
      // Do NOT call printOrderReceipt as it would create another job
      const receiptData = this.printJobService.generateOrderReceipt(order);
      await this.bluetoothPrinterService.sendToPrinter(receiptData);
      
      console.log('✅ [AUTO-PRINT] Printed directly via Bluetooth');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
      console.error('❌ [AUTO-PRINT] Failed:', error);
    }
  }

  private updateJobStatus(jobId: string, status: string, error?: string) {
    const jobs = this.printJobs();
    const index = jobs.findIndex((job) => job._id === jobId);
    if (index !== -1) {
      const updatedJobs = [...jobs];
      updatedJobs[index] = {
        ...updatedJobs[index],
        status: status as any,
        error,
        printedAt: status === 'printed' ? new Date() : updatedJobs[index].printedAt,
      };
      this.printJobs.set(updatedJobs);

      // Update stats
      this.loadStats();
    }
  }

  private loadStats() {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    this.printJobService.getPrintJobStats(storeId).subscribe({
      next: (stats) => {
        this.stats.set(stats);
      },
    });
  }

  public reload() {
    this.loadData();
  }

  public retryJob(job: PrintJob) {
    this.printJobService.retryPrintJob(job._id).subscribe({
      next: () => {
        this.snackBar.open('Print job retry initiated', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
        this.loadData();
      },
      error: () => {
        this.snackBar.open('Failed to retry print job', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
      },
    });
  }

  public cancelJob(job: PrintJob) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Cancel Print Job',
        message: `Are you sure you want to cancel this print job?`,
        confirmText: 'Cancel Job',
        cancelText: 'Close',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.printJobService.cancelPrintJob(job._id).subscribe({
          next: () => {
            this.snackBar.open('Print job cancelled', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
            });
            this.loadData();
          },
          error: () => {
            this.snackBar.open('Failed to cancel print job', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
            });
          },
        });
      }
    });
  }



  public getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      pending: 'status-pending',
      processing: 'status-processing',
      printed: 'status-success',
      failed: 'status-error',
    };
    return classes[status] || '';
  }

  public getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: 'accent',
      processing: 'primary',
      printed: '',
      failed: 'warn',
    };
    return colors[status] || '';
  }

  public getStationName(station: Station | string): string {
    if (typeof station === 'string') {
      const found = this.stations().find((s) => s._id === station);
      return found ? found.name : 'Unknown';
    }
    return station.name;
  }

  public getOrderNumber(order: any): string {
    if (typeof order === 'string') {
      return order;
    }
    return order?.orderNumber || order?._id || 'N/A';
  }

  public formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  }

  // Bluetooth Printer Methods
  public async connectBluetoothPrinter() {
    if (!this.bluetoothSupported()) {
      this.snackBar.open('Web Bluetooth is not supported in this browser', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    this.isBluetoothConnecting.set(true);
    
    try {
      const device = await this.bluetoothPrinterService.connectToPrinter();
      this.isBluetoothConnected.set(true);
      this.connectedPrinterName.set(device.device.name || 'Unknown Printer');
      
      this.snackBar.open(`Connected to ${device.device.name || 'printer'}`, 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar'],
      });
    } catch (error: any) {
      console.error('Failed to connect to Bluetooth printer:', error);
      this.snackBar.open(`Failed to connect: ${error.message}`, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    } finally {
      this.isBluetoothConnecting.set(false);
    }
  }

  public async disconnectBluetoothPrinter() {
    try {
      await this.bluetoothPrinterService.disconnectPrinter();
      this.isBluetoothConnected.set(false);
      this.connectedPrinterName.set(null);
      
      this.snackBar.open('Disconnected from printer', 'Close', {
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Failed to disconnect:', error);
      this.snackBar.open(`Failed to disconnect: ${error.message}`, 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
    }
  }

  public async printJobViaBluetooth(job: PrintJob) {
    if (!this.isBluetoothConnected()) {
      this.snackBar.open('Please connect to a Bluetooth printer first', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    try {
      // Update job status to printing
      this.updateJobStatus(job._id, 'processing');

      // Extract order from job
      const order = typeof job.order === 'object' ? job.order : null;
      if (!order) {
        throw new Error('No order found in print job');
      }

      // Print using PrintJobService
      const result = await this.printJobService.printOrderReceipt(order);

      // Update job status to printed
      this.updateJobStatus(job._id, 'printed');
      
      this.snackBar.open('Print job sent successfully', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar'],
      });
    } catch (error: any) {
      console.error('Failed to print via Bluetooth:', error);
      this.updateJobStatus(job._id, 'failed', error.message);
      
      this.snackBar.open(`Print failed: ${error.message}`, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    }
  }

  /**
   * Public method to print any order directly via Bluetooth
   * @param order - The order object to print
   */
  public async printOrder(order: any): Promise<void> {
    if (!this.isBluetoothConnected()) {
      this.snackBar.open('Please connect to a Bluetooth printer first', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
      throw new Error('Bluetooth printer not connected');
    }

    try {
      // Print using PrintJobService
      const result = await this.printJobService.printOrderReceipt(order);
      
      if (result.isPrinterConnected) {
        this.snackBar.open('✅ Order printed successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
      } else {
        this.snackBar.open('📋 Print job created - Receipt will print at counter', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar'],
        });
      }
    } catch (error: any) {
      console.error('❌ [PRINT ORDER] Failed:', error);
      this.snackBar.open(`Print failed: ${error.message}`, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
      throw error;
    }
  }


  public async testBluetoothPrint() {
    if (!this.isBluetoothConnected()) {
      this.snackBar.open('Please connect to a Bluetooth printer first', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    try {
      await this.bluetoothPrinterService.testPrint({
        paperSize: '80mm',
        printQuality: 'normal',
        autocut: true,
        fontSize: 12,
        lineSpacing: 1.2,
        includeLogo: false,
      });
      
      this.snackBar.open('Test print sent successfully', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar'],
      });
    } catch (error: any) {
      console.error('Test print failed:', error);
      this.snackBar.open(`Test print failed: ${error.message}`, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    }
  }
}
