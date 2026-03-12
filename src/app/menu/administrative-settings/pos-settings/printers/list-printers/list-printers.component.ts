import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { rxResource } from '@angular/core/rxjs-interop';
import { Printer, PrinterService } from '../../../../../shared/services/printer.service';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { PrinterFormModalComponent } from '../printer-form-modal/printer-form-modal.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { NoRecordComponent } from '../../../../../shared/components/no-record/no-record.component';

@Component({
  selector: 'app-list-printers',
  templateUrl: './list-printers.component.html',
  styleUrls: ['./list-printers.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatChipsModule,
    MatMenuModule,
    PageHeaderComponent,
    NoRecordComponent,
  ],
})
export class ListPrintersComponent implements OnInit {
  private printerService = inject(PrinterService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  private storeId = computed(() => this.storeStore.selectedStore()?._id);
  private reloadTrigger = signal(0);

  protected printersResource = rxResource({
    params: () => ({
      storeId: this.storeId(),
      trigger: this.reloadTrigger(),
    }),
    stream: ({params}) => {
      const storeId = params.storeId;
      if (!storeId) {
        throw new Error('Store not selected');
      }
      return this.printerService.findByStore(storeId);
    },
  });

  readonly isLoading = this.printersResource.isLoading;
  readonly error = this.printersResource.error;
  readonly printers = computed(() => this.printersResource.value() ?? []);

  displayedColumns: string[] = [
    'name',
    'connectionType',
    'role',
    'status',
    'capabilities',
    'actions',
  ];
  constructor() {
    effect(() => {
      if (this.error()) {
        this.snackBar.open('Error loading printers', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
      }
    });
  }

  ngOnInit() {
    if (!this.storeId()) {
      this.snackBar.open('Store not selected', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
    }
  }

  reload() {
    this.reloadTrigger.update((v) => v + 1);
  }

  openCreatePrinterDialog() {
    const dialogRef = this.dialog.open(PrinterFormModalComponent, {
      width: '600px',
      disableClose: false,
      data: {
        printer: undefined,
        isEditMode: false,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.reload();
      }
    });
  }

  openEditPrinterDialog(printer: Printer) {
    const dialogRef = this.dialog.open(PrinterFormModalComponent, {
      width: '600px',
      disableClose: false,
      data: {
        printer,
        isEditMode: true,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.reload();
      }
    });
  }

  deletePrinter(printerId: string) {
    if (confirm('Are you sure you want to delete this printer?')) {
      this.printerService.remove(printerId).subscribe({
        next: () => {
          this.snackBar.open('Printer deleted successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
          this.reload();
        },
        error: (error) => {
          this.snackBar.open('Error deleting printer', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar'],
          });
        },
      });
    }
  }

  getConnectionTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      network: 'Network (TCP/IP)',
      'usb-os': 'USB (OS)',
      'usb-raw': 'USB (Raw)',
      bluetooth: 'Bluetooth',
    };
    return labels[type] || type;
  }

  getRoleLabel(role: string): string {
    const labels: { [key: string]: string } = {
      station: 'Station',
      master: 'Master',
      backup: 'Backup',
    };
    return labels[role] || role;
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      online: 'check_circle',
      offline: 'error_circle',
      unknown: 'help_circle',
    };
    return icons[status] || 'help_circle';
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      online: 'text-green-500',
      offline: 'text-red-500',
      unknown: 'text-gray-400',
    };
    return colors[status] || 'text-gray-400';
  }
}
