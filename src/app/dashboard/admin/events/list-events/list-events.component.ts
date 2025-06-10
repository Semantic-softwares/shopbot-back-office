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
import { CreateEventComponent } from '../modals/create-event/create-event.component';

@Component({
  selector: 'app-list-events',
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
  templateUrl: './list-events.component.html',
  styleUrls: ['./list-events.component.scss']
})
export class ListEventsComponent {
  loading = signal(true);
  searchTerm = signal('');
  events = signal<any[]>([]);
  filteredEvents = signal<any[]>([]);

  displayedColumns: string[] = [
    'title',
    'date',
    'type',
    'client',
    'company',
    'actions'
  ];

  constructor(private dialog: MatDialog) {}

  ngOnInit() {
    setTimeout(() => {
      this.events.set([
        {
          title: 'Quarterly Review',
          date: '2024-03-15',
          type: 'Meeting',
          client: 'John Doe',
          company: 'Tech Corp'
        },
        // Add more mock data as needed
      ]);
      this.filteredEvents.set(this.events());
      this.loading.set(false);
    }, 1500);
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchTerm.set(value);
    this.filteredEvents.set(
      this.events().filter(event => 
        event.title.toLowerCase().includes(value) ||
        event.client.toLowerCase().includes(value) ||
        event.company.toLowerCase().includes(value)
      )
    );
  }

  onAdd() {
    const dialogRef = this.dialog.open(CreateEventComponent, {
      width: '600px',
      data: { event: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newEvents = [...this.events()];
        newEvents.push(result);
        this.events.set(newEvents);
        this.filteredEvents.set(newEvents);
      }
    });
  }

  onEdit(event: any) {
    const dialogRef = this.dialog.open(CreateEventComponent, {
      width: '600px',
      data: { event }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newEvents = this.events().map(e => 
          e === event ? { ...result } : e
        );
        this.events.set(newEvents);
        this.filteredEvents.set(newEvents);
      }
    });
  }

  onDelete(event: any) {
    // Implement delete confirmation
  }
}
