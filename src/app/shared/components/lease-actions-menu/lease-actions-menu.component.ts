import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Lease, LeaseStatus } from '../../models/estate.model';

@Component({
  selector: 'app-lease-actions-menu',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './lease-actions-menu.component.html',
  styleUrl: './lease-actions-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaseActionsMenuComponent {
  @Input({ required: true }) lease!: Lease;
  @Input() triggerVariant: 'icon' | 'stroked' = 'icon';
  @Input() triggerLabel = 'Actions';
  @Input() ariaLabel = 'Lease actions';
  @Input() showView = true;
  @Input() showEdit = true;
  @Input() showDelete = true;

  @Output() readonly view = new EventEmitter<void>();
  @Output() readonly edit = new EventEmitter<void>();
  @Output() readonly completeDraft = new EventEmitter<void>();
  @Output() readonly endLease = new EventEmitter<void>();
  @Output() readonly delete = new EventEmitter<void>();
  @Output() readonly changed = new EventEmitter<void>();

  readonly isDraft = computed(() => this.lease?.status === LeaseStatus.DRAFT);
  readonly isActive = computed(() => this.lease?.status === LeaseStatus.ACTIVE);

  onView(event: Event): void {
    event.stopPropagation();
    this.view.emit();
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.edit.emit();
  }

  onCompleteDraft(event: Event): void {
    event.stopPropagation();
    this.completeDraft.emit();
  }

  onEndLease(event: Event): void {
    event.stopPropagation();
    this.endLease.emit();
    this.changed.emit();
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.delete.emit();
    this.changed.emit();
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}