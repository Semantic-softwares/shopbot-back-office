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
import { ChannelService } from '../../../../shared/services/orders.service';
import { Channel } from '../../../../shared/models/channel.model';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { MatChip, MatChipsModule } from '@angular/material/chips';
import { CreateChannelComponent } from '../modals/create-channel/create-channel.component';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-channels',
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
  templateUrl: './channels.component.html',
})
export class ChannelsComponent {
  private channelService = inject(ChannelService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  public displayedColumns = ['name', 'description', 'feedback_types', 'status', 'actions'];
  public searchTerm = signal('');
  public loading = signal(true);
  
  public channels = rxResource({
    loader: () => this.channelService.getChannels()
  });

  public filteredChannels = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.channels.value()!.filter(channel => 
      channel.name.toLowerCase().includes(term) ||
      channel.description.toLowerCase().includes(term)
    );
  });

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  onAdd(): void {
    const dialogRef = this.dialog.open(CreateChannelComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.channelService.createChannel(result).subscribe(() => {
          this.channels.reload();
        });
      }
    });
  }

  onEdit(channel: Channel): void {
    const dialogRef = this.dialog.open(CreateChannelComponent, {
      width: '600px',
      data: channel
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.channelService.editChannel(result).subscribe(() => {
          this.channels.reload();
        });
      }
    });
  }

  onDelete(channel: Channel): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: { message: `Are you sure you want to delete ${channel.name}?` }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.channelService.deleteChannel(channel._id).subscribe(() => {
          this.channels.reload();
        });
      }
    });
  }

  onReload(): void {
    this.channels.reload();
  }

    onStatusToggle(touchPoint: Channel, event: MatSlideToggleChange) {
      const updatedTouchPoint = {
        ...touchPoint,
        status: event.checked
      };
      
      this.channelService.editChannel(updatedTouchPoint).subscribe({
        next: () => {
          this.snackBar.open('Channel status updated successfully', 'Close', {
            duration: 3000
          });
          this.channels.reload();
        },
        error: () => {
          this.snackBar.open('Failed to update channel status', 'Close', {
            duration: 3000
          });
        }
      });
    }
}
