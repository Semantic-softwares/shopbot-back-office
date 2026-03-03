import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { StationsService } from '../../../../../shared/services/station.service';
import { PrinterService, Printer } from '../../../../../shared/services/printer.service';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { PrinterFormModalComponent } from '../../../settings/printers/printer-form-modal/printer-form-modal.component';

@Component({
  selector: 'app-create-station',
  templateUrl: './create-station.component.html',
  styleUrls: ['./create-station.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    PageHeaderComponent,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    RouterModule,
],
})
export class CreateStationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private stationsService = inject(StationsService);
  private printerService = inject(PrinterService);
  public storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);

  public isSubmitting = signal(false);
  public isEditMode = signal(false);
  public stationId = signal<string | null>(null);
  public availablePrinters = signal<Printer[]>([]);
  public loadingPrinters = signal(false);

  public pageTitle = computed(() =>
    this.isEditMode() ? 'Edit Station' : 'Create Station'
  );
  public submitButtonText = computed(() =>
    this.isEditMode() ? 'Update Station' : 'Create Station'
  );

  stationForm: FormGroup;

  stationTypes = [
    { value: 'preparation', label: 'Preparation' },
    { value: 'bar', label: 'Bar' },
    { value: 'pastry', label: 'Pastry' },
    { value: 'grill', label: 'Grill' },
    { value: 'other', label: 'Other' },
  ];

  paperSizes = [
    { value: '80mm', label: '80mm (Standard)' },
    { value: '58mm', label: '58mm (Compact)' },
  ];

  constructor() {
    this.stationForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      type: ['preparation', Validators.required],
      store: [this.storeStore.selectedStore()?._id, Validators.required],
      active: [true],
      settings: this.fb.group({
        autoPrint: [true],
        paperSize: ['80mm'],
        copiesPerOrder: [1, [Validators.required, Validators.min(1)]],
      }),
      printers: this.fb.array([]),
    });
  }

  ngOnInit() {
    const storeId = this.storeStore.selectedStore()?._id;
    if (storeId) {
      this.loadAvailablePrinters(storeId);
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.stationId.set(id);
      this.loadStation(id);
    }
  }

  private loadAvailablePrinters(storeId: string) {
    this.loadingPrinters.set(true);
    this.printerService.findByStore(storeId).subscribe({
      next: (printers) => {
        this.availablePrinters.set(printers);
        this.loadingPrinters.set(false);
      },
      error: (error) => {
        console.error('Error loading printers:', error);
        this.loadingPrinters.set(false);
      },
    });
  }

  get printers(): FormArray {
    return this.stationForm.get('printers') as FormArray;
  }

  createPrinterFormGroup(printerId?: string): FormGroup {
    return this.fb.group({
      printerId: [printerId || '', Validators.required],
    });
  }

  addPrinter() {
    this.printers.push(this.createPrinterFormGroup());
  }

  removePrinter(index: number) {
    this.printers.removeAt(index);
  }

  getPrinterDetails(printerId: string): Printer | undefined {
    return this.availablePrinters().find((p) => p._id === printerId);
  }

  isPrinterSelected(printerId: string): boolean {
    return this.printers.value.some((p: any) => p.printerId === printerId);
  }

  togglePrinter(printerId: string) {
    const index = this.printers.value.findIndex((p: any) => p.printerId === printerId);
    if (index >= 0) {
      this.removePrinter(index);
    } else {
      this.printers.push(this.createPrinterFormGroup(printerId));
    }
  }

  private loadStation(id: string) {
    this.stationsService.getStation(id).subscribe({
      next: (station: any) => {
        this.stationForm.patchValue({
          name: station.name,
          description: station.description,
          type: station.type,
          active: station.active,
          settings: {
            autoPrint: station.settings?.autoPrint ?? true,
            paperSize: station.settings?.paperSize || '80mm',
            copiesPerOrder: station.settings?.copiesPerOrder || 1,
          },
        });

        // Load printers
        if (station.printers && station.printers.length > 0) {
          (station.printers as any[]).forEach((printer) => {
            this.printers.push(this.createPrinterFormGroup(printer._id));
          });
        }
      },
      error: (error) => {
        this.snackBar.open('Error loading station', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
      },
    });
  }

  public onSubmit() {
    if (!this.stationForm.valid) {
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.stationForm.getRawValue();
    
    // Extract printer IDs from the printers array
    const printerIds = formValue.printers.map((p: any) => p.printerId);
    const stationData = {
      ...formValue,
      printers: printerIds,
    };

    const stationId = this.stationId();

    const request$ = this.isEditMode()
      ? this.stationsService.updateStation(stationId!, stationData)
      : this.stationsService.createStation(stationData);

    request$.subscribe({
      next: (response) => {
        this.snackBar.open(
          `Station ${this.isEditMode() ? 'updated' : 'created'} successfully`,
          'Close',
          {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          }
        );
        this.router.navigate(['/menu/erp/items/stations']);
      },
      error: (error) => {
        this.snackBar.open(
          `Error ${this.isEditMode() ? 'updating' : 'creating'} station`,
          'Close',
          {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          }
        );
        this.isSubmitting.set(false);
      },
    });
  }

  onCancel() {
    this.router.navigate(['/menu/erp/items/stations']);
  }

  openCreatePrinterDialog() {
    const dialogRef = this.dialog.open(PrinterFormModalComponent, {
      width: '600px',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Refresh available printers after creation
        const storeId = this.storeStore.selectedStore()?._id;
        if (storeId) {
          this.loadAvailablePrinters(storeId);
        }
      }
    });
  }
}
