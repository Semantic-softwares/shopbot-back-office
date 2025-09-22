import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CreateServiceComponent } from '../modals/create-service/create-service.component';

@Component({
  selector: 'app-list-services',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    FormsModule,
    MatProgressSpinner
  ],
  templateUrl: './list-services.component.html'
})
export class ListServicesComponent {
  loading = signal(true);
  searchTerm = signal('');
  services = signal<any[]>([]);
  filteredServices = signal<any[]>([]);

  displayedColumns: string[] = [
    'name',
    'category',
    'price',
    'status',
    'provider',
    'description',
    'actions'
  ];

  constructor(private dialog: MatDialog) {}

  ngOnInit() {
    setTimeout(() => {
      this.services.set([
        {
          name: 'Cloud Storage',
          category: 'Cloud Services',
          price: '$99/month',
          status: 'Active',
          provider: 'AWS',
          description: 'Secure cloud storage solution'
        }
      ]);
      this.filteredServices.set(this.services());
      this.loading.set(false);
    }, 1500);
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchTerm.set(value);
    this.filteredServices.set(
      this.services().filter(service => 
        service.name.toLowerCase().includes(value) ||
        service.category.toLowerCase().includes(value) ||
        service.provider.toLowerCase().includes(value)
      )
    );
  }

  onAdd() {
    const dialogRef = this.dialog.open(CreateServiceComponent, {
      width: '600px',
      data: { service: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newServices = [...this.services()];
        newServices.push(result);
        this.services.set(newServices);
        this.filteredServices.set(newServices);
      }
    });
  }

  onEdit(service: any) {
    const dialogRef = this.dialog.open(CreateServiceComponent, {
      width: '600px',
      data: { service }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newServices = this.services().map(s => 
          s === service ? { ...result } : s
        );
        this.services.set(newServices);
        this.filteredServices.set(newServices);
      }
    });
  }

  onDelete(service: any) {
    // Implement delete confirmation
  }
}
