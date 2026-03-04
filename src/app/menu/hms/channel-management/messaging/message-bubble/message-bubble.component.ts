import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Message } from '../../../../../shared/services/messaging.service';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './message-bubble.component.html',
  styleUrl: './message-bubble.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageBubbleComponent {
  @Input() message!: Message;
  @Input() formatTime!: (timestamp: string) => string;
  @Input() senderName: string = '';
  @Output() retry = new EventEmitter<Message>();

  /**
   * Get sender initials for avatar
   */
  get senderInitials(): string {
    if (!this.senderName) {
      return this.message.sender === 'property' ? 'P' : 'G';
    }

    const names = this.senderName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return this.senderName.substring(0, 2).toUpperCase();
  }

  /**
   * Get alignment class based on sender
   */
  get alignmentClass(): string {
    return this.message.sender === 'property' ? 'flex justify-end' : 'flex justify-start';
  }

  /**
   * Get avatar styling based on sender
   */
  get avatarClass(): string {
    return this.message.sender === 'property'
      ? 'bg-blue-500 text-white'
      : 'bg-gray-300 text-gray-800';
  }

  /**
   * Get bubble styling based on sender
   */
  get bubbleClass(): string {
    return this.message.sender === 'property'
      ? 'bg-blue-500 text-white'
      : 'bg-white text-gray-900 border border-gray-200';
  }

  /**
   * Get timestamp text color based on sender
   */
  get timestampClass(): string {
    return this.message.sender === 'property'
      ? 'text-blue-200'
      : 'text-gray-500';
  }

  /**
   * Get attachment link color based on sender
   */
  get attachmentLinkClass(): string {
    return this.message.sender === 'property'
      ? 'text-blue-200'
      : 'text-blue-600';
  }
}
