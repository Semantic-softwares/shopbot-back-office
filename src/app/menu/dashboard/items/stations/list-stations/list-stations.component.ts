import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { rxResource } from '@angular/core/rxjs-interop';
import { StationsService } from '../../../../../shared/services/station.service';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { CreateStationComponent } from '../create-station/create-station.component';
import { Station } from '../../../../../shared/models';
import { MatListModule } from "@angular/material/list";

@Component({
  selector: 'app-list-stations',
  templateUrl: './list-stations.component.html',
  styleUrls: ['./list-stations.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatMenuModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    PageHeaderComponent,
    MatListModule
],
})
export class ListStationsComponent {
  private stationsService = inject(StationsService);
  public storeStore = inject(StoreStore);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
    private route = inject(ActivatedRoute);


  displayedColumns: string[] = ['name', 'type', 'printers', 'autoPrint', 'active', 'actions'];

  public stations = rxResource({
    params: () => ({
      storeId: this.storeStore.selectedStore()?._id,
    }),
    stream: ({ params }) =>
      this.stationsService.getStations(params.storeId!),
  });

  totalStations = computed(() => this.stations.value()?.length || 0);
  activeStations = computed(() => 
    this.stations.value()?.filter(s => s.active).length || 0
  );
  totalPrinters = computed(() => 
    this.stations.value()?.reduce((sum, s) => 
      sum + (s.printers?.filter(p => p.enabled).length || 0), 0) || 0
  );
  autoPrintEnabled = computed(() => 
    this.stations.value()?.filter(s => s.settings?.autoPrint).length || 0
  );

  createStation() {
    this.router.navigate(['../create'], { relativeTo: this.route });
  }

  editStation(station: Station) {
    this.router.navigate(['../edit', station._id], { relativeTo: this.route });
  }

  viewStation(station: Station) {
    this.router.navigate(['../details', station._id], { relativeTo: this.route });
  }

  deleteStation(station: Station) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Station',
        message: `Are you sure you want to delete "${station.name}"? This action cannot be undone.`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.stationsService.deleteStation(station._id).subscribe({
          next: () => {
            this.snackBar.open('Station deleted successfully', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
            });
            this.stations.reload();
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

  reloadData() {
    this.stations.reload();
  }

  getPrinterCount(station: Station): number {
    return station.printers?.filter(p => p.enabled)?.length || 0;
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
}
