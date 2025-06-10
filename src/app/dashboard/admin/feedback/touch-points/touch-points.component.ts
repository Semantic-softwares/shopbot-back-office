import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { rxResource } from '@angular/core/rxjs-interop';
import { TouchPointService } from '../../../../shared/services/touch-point.service';
import { TouchPoint } from '../../../../shared/models/touch-point.model';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { MatChipsModule } from '@angular/material/chips';
import { CreateTouchPointComponent } from '../modals/create-touch-point/create-touch-point.component';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-touch-points',
  standalone: true,
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
    HasPermissionDirective,
    MatChipsModule,
    MatSlideToggleModule,
  ],
  templateUrl: './touch-points.component.html',
})
export class TouchPointsComponent {
  private touchPointService = inject(TouchPointService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  
  public displayedColumns = ['name', 'description', 'status', 'actions'];
  public searchTerm = signal('');
  public loading = signal(true);
  
  public touchPoints = rxResource({
    loader: () => this.touchPointService.getTouchPoints()
  });

  public filteredTouchPoints = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.touchPoints.value()!.filter(touchPoint => 
      touchPoint.name.toLowerCase().includes(term) ||
      touchPoint.description.toLowerCase().includes(term)
    );
  });

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  onAdd(): void {
    const dialogRef = this.dialog.open(CreateTouchPointComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.touchPointService.createTouchPoint(result).subscribe(() => {
          this.touchPoints.reload();
        });
      }
    });
  }

  onEdit(touchPoint: TouchPoint): void {
    const dialogRef = this.dialog.open(CreateTouchPointComponent, {
      width: '600px',
      data: touchPoint
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.touchPointService.editTouchPoint(result).subscribe(() => {
          this.touchPoints.reload();
        });
      }
    });
  }

  onDelete(touchPoint: TouchPoint): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: { message: `Are you sure you want to delete ${touchPoint.name}?` }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.touchPointService.deleteTouchPoint(touchPoint._id).subscribe(() => {
          this.touchPoints.reload();
        });
      }
    });
  }

  onReload(): void {
    this.touchPoints.reload();
  }

  onStatusToggle(touchPoint: TouchPoint, event: MatSlideToggleChange) {
    const updatedTouchPoint = {
      ...touchPoint,
      status: event.checked
    };
    
    this.touchPointService.editTouchPoint(updatedTouchPoint).subscribe({
      next: () => {
        this.snackBar.open('Touch point status updated successfully', 'Close', {
          duration: 3000
        });
        this.touchPoints.reload();
      },
      error: () => {
        this.snackBar.open('Failed to update touch point status', 'Close', {
          duration: 3000
        });
      }
    });
  }
}
