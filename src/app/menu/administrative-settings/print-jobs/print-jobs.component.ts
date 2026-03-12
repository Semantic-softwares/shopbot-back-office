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
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PrintJobService } from '../../../shared/services/print-job.service';
import { StationsService } from '../../../shared/services/station.service';
import { SocketService } from '../../../shared/services/socket.service';
import { StoreStore } from '../../../shared/stores/store.store';
import { PrintJob, PrintJobStats } from '../../../shared/models/print-job.model';
import { Station } from '../../../shared/models/station.model';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

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

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    // Don't unsubscribe from socket listeners - they are global in menu.component
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

  public getStationName(station: Station | string | null): string {
    // Handle null stations (master print jobs)
    if (!station) {
      return 'Master Receipt';
    }
    
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
}
