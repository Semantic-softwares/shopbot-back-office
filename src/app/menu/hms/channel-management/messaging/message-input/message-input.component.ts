import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './message-input.component.html',
  styleUrl: './message-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageInputComponent {
  @Input() messageForm!: FormGroup;
  @Input() isSending: boolean = false;
  @Input() isDisabled: boolean = false;
  @Output() sendMessage = new EventEmitter<void>();
  @Output() attachmentClick = new EventEmitter<void>();

  private fb = inject(FormBuilder);

  /**
   * Handle message send with Ctrl+Enter or button click
   */
  protected onSendClick(): void {
    if (this.messageForm.valid && !this.isSending && !this.isDisabled) {
      this.sendMessage.emit();
    }
  }

  /**
   * Handle Ctrl+Enter key combination
   */
  protected onKeyDown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.onSendClick();
    }
  }

  /**
   * Handle attachment button click
   */
  protected onAttachmentClick(): void {
    this.attachmentClick.emit();
  }
}
