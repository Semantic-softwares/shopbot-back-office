import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RentalOwnerDetailComponent } from '../../rental-owner-detail.component';

@Component({
  selector: 'app-rental-owner-files',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './files.component.html',
})
export class RentalOwnerFilesComponent {
  private parent = inject(RentalOwnerDetailComponent);

  readonly attachments = computed(() => this.parent.owner()?.attachments || []);

  getFileName(url: string): string {
    return url.split('/').pop() || 'file';
  }

  getFileIcon(url: string): string {
    const ext = url.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['pdf'].includes(ext)) return 'picture_as_pdf';
    if (['doc', 'docx'].includes(ext)) return 'description';
    if (['xls', 'xlsx'].includes(ext)) return 'table_chart';
    return 'insert_drive_file';
  }
}
