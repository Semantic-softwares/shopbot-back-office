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
import { StoreStore } from '../../../../../shared/stores/store.store';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';

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
  public storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  public isSubmitting = signal(false);
  public isEditMode = signal(false);
  public stationId = signal<string | null>(null);

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
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.stationId.set(id);
      this.loadStation(id);
    }
  }

  get printers(): FormArray {
    return this.stationForm.get('printers') as FormArray;
  }

  createPrinterFormGroup(printer?: any): FormGroup {
    return this.fb.group({
      id: [printer?.id || this.generatePrinterId()],
      name: [printer?.name || '', Validators.required],
      ipAddress: [
        printer?.ipAddress || '',
        [Validators.required, Validators.pattern(/^(\d{1,3}\.){3}\d{1,3}$/)],
      ],
      port: [printer?.port || 9100, Validators.required],
      enabled: [printer?.enabled !== undefined ? printer.enabled : true],
      status: [printer?.status || 'offline'],
    });
  }

  addPrinter() {
    this.printers.push(this.createPrinterFormGroup());
  }

  removePrinter(index: number) {
    this.printers.removeAt(index);
  }

  generatePrinterId(): string {
    return `printer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
          station.printers.forEach((printer: any) => {
            this.printers.push(this.createPrinterFormGroup(printer));
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
    const stationId = this.stationId();

    const request$ = this.isEditMode()
      ? this.stationsService.updateStation(stationId!, formValue)
      : this.stationsService.createStation(formValue);

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
}
