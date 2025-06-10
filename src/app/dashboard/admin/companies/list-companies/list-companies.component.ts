import { CommonModule } from '@angular/common';
import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { CreateCompanyComponent } from '../modals/create-company/create-company.component';
import { Company } from '../../../../shared/models/company.model';
import { CompanyService } from '../../../../shared/services/company.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import {MatChipsModule} from '@angular/material/chips';

@Component({
  selector: 'app-list-companies',
  templateUrl: './list-companies.component.html',
  styleUrls: ['./list-companies.component.scss'],
  imports: [
    CommonModule,
    MatTableModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatCardModule,
    FormsModule,
    MatProgressSpinner,
    MatChipsModule
  ],
})
export class ListCompaniesComponent {
  private companyService = inject(CompanyService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  displayedColumns: string[] = [
    'name',
    'email',
    'industry',
    'phone',
    'address',
    'primaryTech',
    'accountManager',
    'salesRep',
    'actions',
  ];

  public companies = rxResource({
    loader: () => this.companyService.getAllCompanies(),
  });

  public searchTerm = signal('');

  public filteredCompanies = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return (
      this.companies
        .value()
        ?.filter(
          (company) =>
            company.name.toLowerCase().includes(term) ||
            company.email.toLowerCase().includes(term) ||
            company.industry.toLowerCase().includes(term) ||
            company.primaryTech.name?.toLowerCase().includes(term) ||
            company.accountManager.name?.toLowerCase().includes(term) ||
            company.salesRep.name?.toLowerCase().includes(term)
        ) ?? []
    );
  });

  constructor(private dialog: MatDialog) {}

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  onAdd() {
    const dialogRef = this.dialog.open(CreateCompanyComponent, {
      width: '800px',
      data: { company: null },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.companies.reload();
      }
    });
  }

  onEdit(company: Company) {
    const dialogRef = this.dialog.open(CreateCompanyComponent, {
      width: '800px',
      data: { company },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.companies.reload();
      }
    });
  }

  onDelete(company: Company): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: { message: `Are you sure you want to delete ${company.name}?` },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.companyService.deleteCompany(company._id!).subscribe(() => {
          this.companies.reload();
        });
      }
    });
  }

  onViewDetails(company: Company): void {
    this.router.navigate(['./details', company._id], {
      relativeTo: this.route.parent,
    });
  }
}
