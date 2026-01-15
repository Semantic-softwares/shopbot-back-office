import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
})
export class SearchComponent {
  // Two-way binding for filter value using model()
  filter = model<string>('');

  // Input properties
  searchText = input<string>('Search...');
  leftIcon = input<string>('search');
  rightIcon = input<string>('close');
  showRightIcon = input<boolean>(true);
  showLeftIcon = input<boolean>(true);

  // Output events
  leftTap = output<Event>();
  rightTap = output<Event>();

  onLeftTap(event: Event): void {
    this.leftTap.emit(event);
  }

  onRightTap(event: Event): void {
    this.rightTap.emit(event);
  }

  clearFilter(): void {
    console.log('Clearing search filter');
    this.filter.set('');
  }
}
