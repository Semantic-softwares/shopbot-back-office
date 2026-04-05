import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { rxResource } from '@angular/core/rxjs-interop';
import { EstatePropertyService } from '../../../../../../../shared/services/estate-property.service';

@Component({
  selector: 'app-property-files',
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
export class PropertyFilesComponent {
  private route = inject(ActivatedRoute);
  private propertyService = inject(EstatePropertyService);

  private propertyId = this.route.parent?.snapshot.paramMap.get('id')
    || this.route.snapshot.paramMap.get('id')
    || '';

  propertyResource = rxResource({
    params: () => ({ id: this.propertyId }),
    stream: ({ params }) => this.propertyService.getPropertyById(params.id),
  });

  readonly attachments = computed(() => this.propertyResource.value()?.data?.attachments || []);
  readonly gallery = computed(() => this.propertyResource.value()?.data?.gallery || []);
  readonly isLoading = computed(() => this.propertyResource.isLoading());

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
