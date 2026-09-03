import { Component, Inject, OnInit, computed, inject, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { rxResource } from '@angular/core/rxjs-interop';
import { TableService, downloadPdfBlob } from '../../../../../../shared/services/table.service';
import { QrTemplateService } from '../../../../../../shared/services/qr-template.service';
import { StoreStore } from '../../../../../../shared/stores/store.store';
import { Table } from '../../../../../../shared/models';

export interface TableQrDialogData {
  /** Omitted for the bulk export, which covers every table in the store. */
  table?: Table;
  mode: 'single' | 'bulk';
}

@Component({
  selector: 'app-table-qr-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './table-qr-dialog.component.html',
})
export class TableQrDialogComponent implements OnInit {
  private tableService = inject(TableService);
  private qrTemplateService = inject(QrTemplateService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);

  public qrDataUrl = signal<string | null>(null);
  public qrUrl = signal<string | null>(null);
  public isLoading = signal(true);
  public isDownloading = signal(false);

  /**
   * Staff choose size and language at print time; the design itself is the
   * admin's call and comes from the store's saved settings, so it isn't
   * offered here.
   */
  public selectedSize = signal<string>('A6');
  public selectedLanguage = signal<string>('en');

  protected readonly optionsResource = rxResource({
    stream: () => this.qrTemplateService.getOptions(),
  });

  /** Only the sizes the store's chosen design actually supports. */
  protected readonly sizes = computed(() => this.optionsResource.value()?.sizes ?? []);
  protected readonly languages = computed(() => this.optionsResource.value()?.languages ?? []);

  protected readonly title = computed(() =>
    this.data.mode === 'bulk' ? 'Print QR codes for all tables' : `QR code — ${this.data.table?.name}`,
  );

  constructor(
    public dialogRef: MatDialogRef<TableQrDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TableQrDialogData,
  ) {}

  ngOnInit(): void {
    // Seed the pickers from whatever the admin configured as this store's
    // defaults, so the common case is one click.
    const saved = this.storeStore.selectedStore()?.selfOrderSettings?.qrTemplate;
    if (saved?.defaultSize) this.selectedSize.set(saved.defaultSize);
    if (saved?.defaultLanguage) this.selectedLanguage.set(saved.defaultLanguage);

    // The on-screen QR preview only applies to a single table.
    if (this.data.mode !== 'single' || !this.data.table) {
      this.isLoading.set(false);
      return;
    }

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
    const options = { size: this.selectedSize(), language: this.selectedLanguage() };
    this.isDownloading.set(true);

    const request$ =
      this.data.mode === 'bulk'
        ? this.tableService.getStoreTablesQrPdf(this.storeStore.selectedStore()!._id, options)
        : this.tableService.getTableQrPdf(this.data.table!._id, options);

    request$.subscribe({
      next: (blob) => {
        this.isDownloading.set(false);
        downloadPdfBlob(
          blob,
          this.data.mode === 'bulk'
            ? `tables-qr-${options.size}.pdf`
            : `table-${this.data.table!.name}-qr-${options.size}.pdf`,
        );
        this.dialogRef.close(true);
      },
      error: async (err) => {
        this.isDownloading.set(false);
        this.snackBar.open(await this.readError(err), 'Close', { duration: 5000 });
      },
    });
  }

  /**
   * The endpoint streams a blob, so an error body arrives as a Blob too and
   * has to be read back as text before its message is usable.
   */
  private async readError(err: any): Promise<string> {
    try {
      if (err?.error instanceof Blob) {
        const parsed = JSON.parse(await err.error.text());
        if (parsed?.message) return parsed.message;
      }
    } catch {
      // Fall through to the generic message.
    }
    return 'Could not generate the QR PDF';
  }

  close(): void {
    this.dialogRef.close();
  }
}
