import { Component, Inject, OnInit, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TableService } from '../../../../../../shared/services/table.service';
import { Table } from '../../../../../../shared/models';

@Component({
  selector: 'app-table-qr-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './table-qr-dialog.component.html',
})
export class TableQrDialogComponent implements OnInit {
  public qrDataUrl = signal<string | null>(null);
  public qrUrl = signal<string | null>(null);
  public isLoading = signal(true);
  public isDownloading = signal(false);

  constructor(
    public dialogRef: MatDialogRef<TableQrDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { table: Table },
    private tableService: TableService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.tableService.getTableQrCode(this.data.table._id).subscribe({
      next: ({ qrDataUrl, url }) => {
        this.qrDataUrl.set(qrDataUrl);
        this.qrUrl.set(url);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Could not generate a QR code for this table', 'Close', { duration: 3000 });
      },
    });
  }

  copyLink(): void {
    const url = this.qrUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    this.snackBar.open('Link copied', 'Close', { duration: 2000 });
  }

  downloadPdf(): void {
    this.isDownloading.set(true);
    this.tableService.getTableQrPdf(this.data.table._id).subscribe({
      next: ({ url }) => {
        this.isDownloading.set(false);
        window.open(url, '_blank');
      },
      error: () => {
        this.isDownloading.set(false);
        this.snackBar.open('Could not generate the QR PDF', 'Close', { duration: 3000 });
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
