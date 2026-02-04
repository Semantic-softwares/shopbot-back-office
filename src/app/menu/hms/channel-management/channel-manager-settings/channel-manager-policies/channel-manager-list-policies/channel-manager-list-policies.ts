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
import { HotelPolicyService } from '../../../../../../shared/services/hotel-policy.service';
import { StoreStore } from '../../../../../../shared/stores/store.store';

@Component({
  selector: 'app-channel-manager-list-policies',
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
  templateUrl: './channel-manager-list-policies.html',
  styleUrl: './channel-manager-list-policies.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChannelManagerListPolicies {
  private hotelPolicyService = inject(HotelPolicyService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private storeStore = inject(StoreStore);
  private route = inject(ActivatedRoute);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<any>;

  searchText = '';
  displayedColumns: string[] = ['title', 'currency', 'checkin_time', 'checkout_time', 'max_guests', 'actions'];
  dataSource = new MatTableDataSource<any>([]);

  policies = rxResource({
    params: () => ({ propertyId: this.storeStore.selectedStore()?.channex?.propertyId }),
    stream: ({ params }) => {
      return this.hotelPolicyService.getHotelPolicies(params.propertyId);
    }
  });

  constructor() {
    effect(() => {
      const response = this.policies.value();
      if (response?.data) {
        // Flatten the JSON:API response by mapping attributes to root level
        const flattenedPolicies = response.data.map((policy: any) => ({
          id: policy.id,
          ...policy.attributes,
          // Keep attributes for template compatibility
          attributes: policy.attributes,
        }));
        this.dataSource.data = flattenedPolicies;
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

  createPolicy() {
    this.router.navigate(['../create'], { relativeTo: this.route });
  }

  editPolicy(policy: any) {
    this.router.navigate(['../edit', policy.id], { relativeTo: this.route });
  }

  deletePolicy(policy: any) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Delete Policy',
        message: `Are you sure you want to delete the policy "${policy.attributes?.title}"?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.hotelPolicyService.deleteHotelPolicy(policy.id).subscribe({
          next: () => {
            this.snackBar.open('Policy deleted successfully', 'Close', { duration: 3000 });
            this.policies.reload();
          },
          error: (error) => {
            const errorMessage = error.error?.message || 'Failed to delete policy';
            this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
          },
        });
      }
    });
  }
}
