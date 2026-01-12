import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StationsService } from '../../../../../shared/services/station.service';
import { Station } from '../../../../../shared/models';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { ConfirmationDialogComponent } from '../../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-station-details',
  templateUrl: './station-details.component.html',
  styleUrls: ['./station-details.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
  ],
})
export class StationDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private stationsService = inject(StationsService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  station = signal<Station | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadStation(id);
    }
  }

  loadStation(id: string) {
    this.loading.set(true);
    this.error.set(null);

    this.stationsService.getStation(id).subscribe({
      next: (station) => {
        this.station.set(station);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load station details');
        this.loading.set(false);
      },
    });
  }

  editStation() {
    this.router.navigate(['../../edit', this.station()?._id], { relativeTo: this.route });
  }

  deleteStation() {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Station',
        message: `Are you sure you want to delete "${this.station()?.name}"? This action cannot be undone.`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && this.station()) {
        this.stationsService.deleteStation(this.station()!._id).subscribe({
          next: () => {
            this.snackBar.open('Station deleted successfully', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
            });
            this.router.navigate(['../list'], { relativeTo: this.route });
          },
          error: (error) => {
            this.snackBar.open('Error deleting station', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
            });
          },
        });
      }
    });
  }

  goBack() {
    this.router.navigate(['../list'], { relativeTo: this.route });
  }

  getStationTypeLabel(type: string): string {
    const types: Record<string, string> = {
      preparation: 'Preparation',
      bar: 'Bar',
      pastry: 'Pastry',
      grill: 'Grill',
      other: 'Other',
    };
    return types[type] || type;
  }

  getStationTypeClass(type: string): string {
    const classes: Record<string, string> = {
      preparation: 'bg-blue-100 text-blue-800',
      bar: 'bg-purple-100 text-purple-800',
      pastry: 'bg-pink-100 text-pink-800',
      grill: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return classes[type] || classes['other'];
  }

  getPrinterStatusClass(status: string): string {
    const classes: Record<string, string> = {
      online: 'text-green-600',
      offline: 'text-gray-400',
      error: 'text-red-600',
      unknown: 'text-gray-400',
    };
    return classes[status] || classes['unknown'];
  }
}
