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
        console.log('New print job created:', data);
        
        this.snackBar.open(`New print job created for Order #${data.orderNumber || 'N/A'}`, 'View', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
        this.loadData(); // Reload data
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

      // Generate receipt data
      const receiptData = this.generatePrintJobReceipt(job);
      
      // Send to printer
      await this.bluetoothPrinterService.sendToPrinter(receiptData);

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

  private formatCurrency(amount: number, currencyCode: string): string {
    // Format number with thousand separators and 2 decimal places
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return `${currencyCode} ${formatted}`;
  }

  private generatePrintJobReceipt(job: PrintJob): string {
    // Get ESC/POS commands
    const COMMANDS = {
      INIT: '\x1B\x40',
      ALIGN_CENTER: '\x1B\x61\x01',
      ALIGN_LEFT: '\x1B\x61\x00',
      TEXT_DOUBLE_SIZE: '\x1B\x21\x30',
      TEXT_NORMAL: '\x1B\x21\x00',
      BOLD_ON: '\x1B\x45\x01',
      BOLD_OFF: '\x1B\x45\x00',
      FEED_LINE: '\x0A',
      CUT_PAPER: '\x1D\x56\x00',
    };

    console.log('=== PRINT JOB DEBUG ===');
    console.log('Full job object:', job);
    
    // Get order object (should be full order with all data)
    const order = typeof job.order === 'object' ? job.order : null;
    console.log('Order object exists:', !!order);
    console.log('Order cart products:', order ? (order as any).cart?.products : null);
    
    if (!order) {
      console.error('❌ No order object found in print job');
      return COMMANDS.INIT + 'ERROR: No order data\n' + COMMANDS.CUT_PAPER;
    }

    // Generate receipt
    let receipt = '';
    
    // Initialize
    receipt += COMMANDS.INIT;
    
    // Header with store info
    receipt += COMMANDS.ALIGN_CENTER;
    receipt += COMMANDS.TEXT_DOUBLE_SIZE;
    receipt += COMMANDS.BOLD_ON;
    
    const store = (order as any).store;
    if (store && store.name) {
      receipt += `${store.name}\n`;
    }
    
    receipt += 'KITCHEN ORDER\n';
    receipt += COMMANDS.BOLD_OFF;
    receipt += COMMANDS.TEXT_NORMAL;
    
    receipt += COMMANDS.ALIGN_LEFT;
    receipt += '================================\n';
    
    // Order info
    receipt += COMMANDS.BOLD_ON;
    receipt += `Order: #${(order as any).reference || (order as any)._id}\n`;
    receipt += COMMANDS.BOLD_OFF;
    receipt += `Station: ${this.getStationName(job.station)}\n`;
    receipt += `Time: ${this.formatDate((order as any).createdAt || new Date())}\n`;
    
    // Order type
    if ((order as any).type) {
      receipt += `Type: ${(order as any).type}\n`;
    }
    
    // Sales channel
    if ((order as any).salesChannel) {
      receipt += `Channel: ${(order as any).salesChannel}\n`;
    }
    
    // Table info
    if ((order as any).table) {
      const table = (order as any).table;
      receipt += `Table: ${table.number || table.name || table}\n`;
    }
    
    // Guest/Customer info
    if ((order as any).guest) {
      const guest = (order as any).guest;
      if (guest.name) receipt += `Guest: ${guest.name}\n`;
      if (guest.room) receipt += `Room: ${guest.room}\n`;
    }
    
    // Staff/Server info
    if ((order as any).staff) {
      const staff = (order as any).staff;
      const staffName = staff.name || staff.firstName || staff;
      receipt += `Server: ${staffName}\n`;
    }
    
    receipt += '================================\n';
    
    // Items from order.cart.products
    const products = (order as any).cart?.products || [];
    
    if (products.length > 0) {
      receipt += COMMANDS.BOLD_ON;
      receipt += 'ITEMS:\n';
      receipt += COMMANDS.BOLD_OFF;
      
      products.forEach((product: any, index: number) => {
        console.log(`  Product ${index + 1}:`, product);
        
        const productName = product.name;
        const quantity = product.quantity || 1;
        const price = product.price || 0;
        
        // Get store currency code (e.g., "NGN", "USD")
        const currency = store?.currencyCode || 'USD';
        
        receipt += `${quantity}x ${productName}`;
        if (price > 0) {
          receipt += ` - ${this.formatCurrency(price, currency)}`;
        }
        receipt += '\n';
        
        // Add options/modifiers with prices and quantities
        if (product.options && Array.isArray(product.options) && product.options.length > 0) {
          product.options.forEach((opt: any) => {
            // Handle both flat and nested option structures
            if (opt.options && Array.isArray(opt.options)) {
              // Nested structure (option group with items)
              opt.options.forEach((optItem: any) => {
                if (optItem.selected) {
                  const optName = optItem.name;
                  const optQty = optItem.quantity || 1;
                  const optPrice = optItem.price || 0;
                  
                  receipt += `   + ${optQty}x ${optName}`;
                  if (optPrice > 0) {
                    receipt += ` (${this.formatCurrency(optPrice, currency)})`;
                  }
                  receipt += '\n';
                }
              });
            } else {
              // Flat structure
              const optName = opt.optionItemName || opt.name || opt;
              const optQty = opt.quantity || 1;
              const optPrice = opt.price || 0;
              
              if (optQty > 1) {
                receipt += `   + ${optQty}x ${optName}`;
              } else {
                receipt += `   + ${optName}`;
              }
              
              if (optPrice > 0) {
                receipt += ` (${this.formatCurrency(optPrice, currency)})`;
              }
              receipt += '\n';
            }
          });
        }
        
        // Add product notes
        if (product.notes) {
          receipt += `   Note: ${product.notes}\n`;
        }
        
        receipt += '\n';
      });
    } else {
      console.log('✗ No products found in order.cart.products');
      receipt += 'No items in order\n';
    }
    
    receipt += '================================\n';
    
    // Order financial summary
    const subtotal = (order as any).subTotal || (order as any).subtotal;
    const tax = (order as any).tax;
    const discount = (order as any).discount;
    const shippingFee = (order as any).shippingFee;
    const serviceFee = (order as any).serviceFee;
    const total = (order as any).total;
    const currency = store?.currencyCode || 'USD';
    
    receipt += COMMANDS.BOLD_ON;
    receipt += 'ORDER SUMMARY:\n';
    receipt += COMMANDS.BOLD_OFF;
    
    if (subtotal !== undefined) {
      receipt += `Subtotal:            ${this.formatCurrency(subtotal, currency)}\n`;
    }
    
    if (tax && tax > 0) {
      receipt += `Tax:                 ${this.formatCurrency(tax, currency)}\n`;
    }
    
    if (discount && discount > 0) {
      receipt += `Discount:           -${this.formatCurrency(discount, currency)}\n`;
    }
    
    if (shippingFee && shippingFee > 0) {
      receipt += `Shipping:            ${this.formatCurrency(shippingFee, currency)}\n`;
    }
    
    if (serviceFee && serviceFee > 0) {
      receipt += `Service Fee:         ${this.formatCurrency(serviceFee, currency)}\n`;
    }
    
    if (total !== undefined) {
      receipt += '--------------------------------\n';
      receipt += COMMANDS.BOLD_ON;
      receipt += `TOTAL:               ${this.formatCurrency(total, currency)}\n`;
      receipt += COMMANDS.BOLD_OFF;
    }
    
    // Payment info
    if ((order as any).payment) {
      receipt += `Payment: ${(order as any).payment}\n`;
    }
    
    if ((order as any).paymentStatus) {
      receipt += `Status: ${(order as any).paymentStatus}\n`;
    }
    
    receipt += '================================\n';
    
    // Order notes
    if ((order as any).note || (order as any).orderInstruction) {
      receipt += COMMANDS.BOLD_ON;
      receipt += 'NOTES:\n';
      receipt += COMMANDS.BOLD_OFF;
      receipt += `${(order as any).note || (order as any).orderInstruction}\n`;
      receipt += '================================\n';
    }
    
    receipt += COMMANDS.ALIGN_CENTER;
    receipt += `Job #${job._id.substring(job._id.length - 6)}\n`;
    receipt += COMMANDS.FEED_LINE;
    receipt += COMMANDS.FEED_LINE;
    
    // Cut paper
    receipt += COMMANDS.CUT_PAPER;
    
    console.log('=== END DEBUG ===');
    return receipt;
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
