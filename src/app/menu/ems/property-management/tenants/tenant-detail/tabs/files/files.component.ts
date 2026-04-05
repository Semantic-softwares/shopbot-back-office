import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TenantDetailPageComponent } from '../../tenant-detail-page.component';

@Component({
  selector: 'app-tenant-files',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatIconModule,
  ],
  templateUrl: './files.component.html',
})
export class TenantFilesComponent {
  private parent = inject(TenantDetailPageComponent);

  readonly attachments = computed(() => this.parent.tenant()?.attachments || []);

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
