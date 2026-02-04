import { ChangeDetectionStrategy, Component, effect, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTable } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { ConfirmationDialogComponent } from '../../../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { NoRecordComponent } from '../../../../../../shared/components/no-record/no-record.component';
import { PageHeaderComponent } from '../../../../../../shared/components/page-header/page-header.component';
import { TaxSetService } from '../../../../../../shared/services/tax-set.service';
import { StoreStore } from '../../../../../../shared/stores/store.store';
import { Action } from 'rxjs/internal/scheduler/Action';

@Component({
  selector: 'app-channel-manager-list-tax-sets',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    PageHeaderComponent,
    NoRecordComponent,
    FormsModule,
  ],
  templateUrl: './channel-manager-list-tax-sets.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChannelManagerListTaxSets {
  private taxSetService = inject(TaxSetService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private storeStore = inject(StoreStore);
  private route = inject(ActivatedRoute);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<any>;

  searchText = '';
  displayedColumns: string[] = ['title', 'currency', 'taxes_count', 'actions'];
  dataSource = new MatTableDataSource<any>([]);

  taxSets = rxResource({
    params: () => ({ propertyId: this.storeStore.selectedStore()?.channex?.propertyId }),
    stream: ({ params }) => {
      return this.taxSetService.getTaxSets(params.propertyId);
    }
  });

  constructor() {
    effect(() => {
      const response = this.taxSets.value();
      if (response?.data) {
        // Flatten the JSON:API response by mapping attributes to root level
        const flattenedTaxSets = response.data.map((taxSet: any) => ({
          id: taxSet.id,
          ...taxSet.attributes,
          // Keep attributes for template compatibility
          attributes: taxSet.attributes,
        }));
        this.dataSource.data = flattenedTaxSets;
      }
    });
  }

  ngAfterViewInit() {
    if (this.dataSource && this.paginator && this.sort) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }

  applyFilter() {
    if (this.dataSource) {
      this.dataSource.filter = this.searchText.trim().toLowerCase();
      if (this.paginator) {
        this.paginator.firstPage();
      }
    }
  }

  createTaxSet() {
    this.router.navigate(['../create'], { relativeTo: this.route });
  }

  editTaxSet(taxSet: any) {
    this.router.navigate(['../edit', taxSet.id], { relativeTo: this.route });
  }

  deleteTaxSet(taxSet: any) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Delete Tax Set',
        message: `Are you sure you want to delete the tax set "${taxSet.attributes?.title}"?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.taxSetService.deleteTaxSet(taxSet.id).subscribe({
          next: () => {
            this.snackBar.open('Tax set deleted successfully', 'Close', { duration: 3000 });
            this.taxSets.reload();
          },
          error: (error) => {
            const errorMessage = error.error?.message || 'Failed to delete tax set';
            this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
          },
        });
      }
    });
  }
}
