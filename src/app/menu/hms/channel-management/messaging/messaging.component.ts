import { Component, computed, inject, signal, OnInit, OnDestroy, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ScrollingModule, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Subscription } from 'rxjs';
import { StoreStore } from '../../../../shared/stores/store.store';
import { MessagingService, MessageThread, Message, PaginationMeta } from '../../../../shared/services/messaging.service';
import { SocketService } from '../../../../shared/services/socket.service';
import { MessageBubbleComponent } from './message-bubble/message-bubble.component';
import { MessageInputComponent } from './message-input/message-input.component';

@Component({
  selector: 'app-messaging',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatInputModule,
    MatFormFieldModule,
    MatTabsModule,
    MatListModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    ScrollingModule,
    MessageBubbleComponent,
    MessageInputComponent,
    RouterModule
  ],
  templateUrl: './messaging.component.html',
  styleUrl: './messaging.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessagingComponent implements OnInit, OnDestroy {
  private storeStore = inject(StoreStore);
  private messagingService = inject(MessagingService);
  private socketService = inject(SocketService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private socketSubscription?: Subscription;

  @ViewChild(CdkVirtualScrollViewport) messagesScrollContainer?: CdkVirtualScrollViewport;

  // Store context
  protected selectedStore = this.storeStore.selectedStore;
  protected storeId = computed(() => this.selectedStore()?._id || '');

  // Tab state
  protected isActiveTab = signal(true); // true = Active, false = Closed

  // Messaging state
  protected messageThreads = signal<MessageThread[]>([]);
  protected selectedThread = signal<MessageThread | null>(null);
  protected threadMessages = signal<Message[]>([]);
  protected isLoadingThreads = signal(false);
  protected isLoadingMessages = signal(false);
  protected isSendingMessage = signal(false);
  protected isLoadingMoreMessages = signal(false);

  // Thread ID from URL that needs to be selected once threads finish loading
  private pendingThreadId = signal<string | null>(null);

  // Pagination state
  protected currentPage = signal(1);
  protected pageLimit = signal(50);
  protected paginationMeta = signal<PaginationMeta | null>(null);

  // Computed pagination values
  protected totalPages = computed(() => {
    const meta = this.paginationMeta();
    if (!meta) return 0;
    return Math.ceil(meta.total / meta.limit);
  });

  protected hasMoreMessages = computed(() => {
    return this.currentPage() < this.totalPages();
  });

  // Form
  protected messageForm: FormGroup;

  constructor() {
    this.messageForm = this.fb.group({
      messageText: ['', [Validators.required, Validators.minLength(1)]],
    });
  }

  ngOnInit(): void {
    // Read tab state from query params
    this.route.queryParams.subscribe((params) => {
      const isActive = params['is_active'] !== 'false'; // Default to true
      this.isActiveTab.set(isActive);
      this.loadThreads();
    });

    // Listen to route params for threadId
    this.route.params.subscribe((params) => {
      const threadId = params['threadId'];
      if (threadId) {
        this.pendingThreadId.set(threadId);

        // If threads are already loaded, select immediately
        const thread = this.messageThreads().find(t => t.id === threadId);
        if (thread) {
          this.selectedThread.set(thread);
          this.loadThreadMessages(thread.id);
          this.pendingThreadId.set(null);
        }
        // Otherwise loadThreads() will handle it when it completes
      }
    });

    // Subscribe to real-time messages from socket
    this.socketSubscription = this.socketService.hotelMessage$.subscribe((data) => {
      this.handleRealtimeMessage(data);
    });
  }

  ngOnDestroy(): void {
    this.socketSubscription?.unsubscribe();
  }

  /**
   * Handle a real-time message pushed via socket.
   * If the user is viewing the same thread, append the message to the chat.
   * Update thread list's last_message preview in-place without full reload.
   */
  private handleRealtimeMessage(data: any): void {
    const currentThread = this.selectedThread();

    // If the user is viewing the thread that received the message, append it
    if (currentThread && data.threadId === currentThread.id) {
      const newMessage: Message = {
        id: data.messageId,
        message: data.message,
        sender: data.sender,
        attachments: data.attachments || [],
        inserted_at: data.insertedAt || new Date().toISOString(),
      };

      // Check if this is a message we sent optimistically (property sender with same text)
      // If so, skip appending — the optimistic message is already visible
      if (data.sender === 'property') {
        const isDuplicate = this.threadMessages().some(
          (m) => m._tempId && m.message === data.message
        );
        if (isDuplicate) {
          return; // Our optimistic message already covers this
        }
      }

      // Append to end of messages list
      this.threadMessages.update((msgs) => [...msgs, newMessage]);

      // Scroll to bottom to show new message
      setTimeout(() => this.scrollToBottom(), 100);
    }

    // Update last_message preview in the thread list without a full reload
    this.messageThreads.update((threads) =>
      threads.map((t) =>
        t.id === data.threadId
          ? {
              ...t,
              last_message: {
                message: data.message,
                attachments: data.attachments || [],
                inserted_at: data.insertedAt || new Date().toISOString(),
                sender: data.sender,
              },
              last_message_received_at: data.insertedAt || new Date().toISOString(),
            }
          : t
      )
    );
  }

  /**
   * Handle tab change
   */
  protected onTabChange(tabIndex: number): void {
    const isActive = tabIndex === 0; // 0 = Active, 1 = Closed
    this.isActiveTab.set(isActive);
    
    // Update URL without reloading
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { is_active: !isActive ? 'false' : 'true' },
      queryParamsHandling: 'merge',
    });

    // Reset pagination and load threads
    this.currentPage.set(1);
    this.loadThreads();
  }

  /**
   * Load all message threads
   */
  protected loadThreads(): void {
    const storeId = this.storeId();
    if (!storeId) return;

    this.isLoadingThreads.set(true);

    this.messagingService.getMessageThreads(storeId).subscribe({
      next: (response) => {
        // Handle both direct array and wrapped response
        let threads = (Array.isArray(response.data) ? response.data : response) as MessageThread[];
        
        // Filter by is_closed status based on active tab
        threads = threads.filter(t => {
          if (this.isActiveTab()) {
            return !t.is_closed; // Active conversations
          } else {
            return t.is_closed; // Closed conversations
          }
        });

        this.messageThreads.set(threads);
        this.isLoadingThreads.set(false);
        
        // Check if there's a pending thread ID from the URL to auto-select
        const threadId = this.pendingThreadId();
        if (threadId) {
          const thread = threads.find(t => t.id === threadId);
          if (thread) {
            this.selectedThread.set(thread);
            this.loadThreadMessages(thread.id);
            this.pendingThreadId.set(null);
          } else {
            // Thread not found in current tab — fetch thread details from API
            // so the chat panel still opens (e.g. thread may be closed or from other tab)
            this.fetchAndSelectThread(threadId);
            this.pendingThreadId.set(null);
          }
        }
      },
      error: (error) => {
        console.error('Failed to load message threads:', error);
        this.showError('Failed to load message threads');
        this.isLoadingThreads.set(false);
      },
    });
  }

  /**
   * Select thread and load its messages
   */
  protected selectThread(thread: MessageThread): void {
    this.selectedThread.set(thread);
    // Navigate to the thread route
    this.router.navigate([thread.id], { relativeTo: this.route });
    this.loadThreadMessages(thread.id);
  }

  /**
   * Fetch a single thread by ID from the API and select it.
   * Used when a thread ID is in the URL but wasn't found in the loaded thread list
   * (e.g. page refresh, deep link from notification, or thread is in the other tab).
   */
  private fetchAndSelectThread(threadId: string): void {
    const storeId = this.storeId();
    if (!storeId) return;

    this.messagingService.getMessageThread(storeId, threadId).subscribe({
      next: (response) => {
        const thread = (response.data ?? response) as MessageThread;
        if (thread) {
          this.selectedThread.set(thread);
          this.loadThreadMessages(threadId);
        }
      },
      error: (error) => {
        console.error('Failed to fetch thread:', error);
        this.showError('Could not load conversation');
      },
    });
  }

  /**
   * Load messages for selected thread with pagination reset
   */
  private loadThreadMessages(threadId: string, page: number = 1): void {
    const storeId = this.storeId();
    if (!storeId) return;

    // Set loading state
    const isInitialLoad = page === 1;
    if (isInitialLoad) {
      this.isLoadingMessages.set(true);
    } else {
      this.isLoadingMoreMessages.set(true);
    }

    this.messagingService.getThreadMessages(storeId, threadId, page, this.pageLimit()).subscribe({
      next: (response) => {
        // Handle both direct array and wrapped response
        const messages = (Array.isArray(response.data) ? response.data : response) as Message[];
        
        // Store pagination metadata
        if (response.meta) {
          this.paginationMeta.set(response.meta);
        }
        
        if (isInitialLoad) {
          // First page - replace all messages
          this.threadMessages.set(messages);
          this.currentPage.set(1);
        } else {
          // Additional page - prepend messages (older messages at top)
          this.threadMessages.set([...messages, ...this.threadMessages()]);
          this.currentPage.set(page);
        }

        this.isLoadingMessages.set(false);
        this.isLoadingMoreMessages.set(false);

        // Scroll to bottom on initial load — use a longer delay
        // to ensure the virtual scroll viewport has rendered all items
        if (isInitialLoad) {
          setTimeout(() => this.scrollToBottom(), 300);
        }
      },
      error: (error) => {
        console.error('Failed to load thread messages:', error);
        this.showError('Failed to load messages');
        this.isLoadingMessages.set(false);
        this.isLoadingMoreMessages.set(false);
      },
    });
  }

  /**
   * Load older messages (previous page)
   */
  protected loadPreviousMessages(): void {
    const threadId = this.selectedThread()?.id;
    if (!threadId || this.isLoadingMoreMessages()) return;

    const meta = this.paginationMeta();
    if (!meta || meta.page >= meta.total / meta.limit) {
      // No more messages to load
      return;
    }

    const nextPage = this.currentPage() + 1;
    this.loadThreadMessages(threadId, nextPage);
  }

  /**
   * Send message to selected thread (optimistic UI)
   */
  protected sendMessage(): void {
    const storeId = this.storeId();
    const thread = this.selectedThread();

    if (!storeId || !thread || this.messageForm.invalid) return;

    const messageText = this.messageForm.value.messageText.trim();
    if (!messageText) return;

    // Generate a temporary ID for matching later
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create optimistic message and append immediately
    const optimisticMessage: Message = {
      _tempId: tempId,
      _status: 'sending',
      message: messageText,
      sender: 'property',
      attachments: [],
      inserted_at: new Date().toISOString(),
    };

    // Append to chat instantly
    this.threadMessages.update((msgs) => [...msgs, optimisticMessage]);

    // Clear input immediately so user can keep typing
    this.messageForm.reset();

    // Scroll to bottom to show the new message
    setTimeout(() => this.scrollToBottom(), 50);

    // Send to API
    this.messagingService
      .sendMessageToThread(storeId, thread.id, messageText)
      .subscribe({
        next: (response) => {
          // Update the optimistic message to "sent"
          this.threadMessages.update((msgs) =>
            msgs.map((m) =>
              m._tempId === tempId
                ? { ...m, _status: 'sent' as const, id: response?.data?.id }
                : m
            )
          );

          // Clear the _status after a short delay so the "sent" indicator fades
          setTimeout(() => {
            this.threadMessages.update((msgs) =>
              msgs.map((m) =>
                m._tempId === tempId
                  ? { ...m, _status: undefined, _tempId: undefined }
                  : m
              )
            );
          }, 2000);
        },
        error: (error) => {
          console.error('Failed to send message:', error);
          // Mark as failed
          this.threadMessages.update((msgs) =>
            msgs.map((m) =>
              m._tempId === tempId
                ? { ...m, _status: 'failed' as const }
                : m
            )
          );
          this.showError('Failed to send message');
        },
      });
  }

  /**
   * Retry sending a failed message
   */
  protected retrySendMessage(failedMessage: Message): void {
    const storeId = this.storeId();
    const thread = this.selectedThread();

    if (!storeId || !thread || !failedMessage._tempId || !failedMessage.message) return;

    const tempId = failedMessage._tempId;

    // Mark as sending again
    this.threadMessages.update((msgs) =>
      msgs.map((m) =>
        m._tempId === tempId ? { ...m, _status: 'sending' as const } : m
      )
    );

    this.messagingService
      .sendMessageToThread(storeId, thread.id, failedMessage.message)
      .subscribe({
        next: (response) => {
          this.threadMessages.update((msgs) =>
            msgs.map((m) =>
              m._tempId === tempId
                ? { ...m, _status: 'sent' as const, id: response?.data?.id }
                : m
            )
          );

          setTimeout(() => {
            this.threadMessages.update((msgs) =>
              msgs.map((m) =>
                m._tempId === tempId
                  ? { ...m, _status: undefined, _tempId: undefined }
                  : m
              )
            );
          }, 2000);
        },
        error: (error) => {
          console.error('Failed to resend message:', error);
          this.threadMessages.update((msgs) =>
            msgs.map((m) =>
              m._tempId === tempId
                ? { ...m, _status: 'failed' as const }
                : m
            )
          );
          this.showError('Failed to send message');
        },
      });
  }

  /**
   * Close message thread
   */
  protected closeThread(): void {
    const storeId = this.storeId();
    const thread = this.selectedThread();

    if (!storeId || !thread) return;

    if (!confirm('Are you sure you want to close this conversation?')) return;

    this.messagingService.closeThread(storeId, thread.id).subscribe({
      next: () => {
        this.showSuccess('Thread closed successfully');
        this.selectedThread.set(null);
        this.threadMessages.set([]);
        this.loadThreads();
      },
      error: (error) => {
        console.error('Failed to close thread:', error);
        this.showError('Failed to close thread');
      },
    });
  }

  /**
   * Mark thread as no reply needed (Booking.com only)
   */
  protected markNoReplyNeeded(): void {
    const storeId = this.storeId();
    const thread = this.selectedThread();

    if (!storeId || !thread) return;

    this.messagingService.markNoReplyNeeded(storeId, thread.id).subscribe({
      next: () => {
        this.showSuccess('Thread marked as no reply needed');
        this.loadThreads();
      },
      error: (error) => {
        console.error('Failed to mark thread:', error);
        this.showError('Failed to mark thread as no reply needed');
      },
    });
  }

  /**
   * Format timestamp
   */
  protected formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Format date
   */
  protected formatDate(timestamp: string): string {
    const date = new Date(timestamp);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString();
  }

  /**
   * Handle virtual scroll events
   */
  protected onMessagesScroll(index: number): void {
    // When scrolling to the top (near index 0), load more messages
    if (index < 2 && !this.isLoadingMoreMessages()) {
      this.loadPreviousMessages();
    }
  }

  /**
   * Handle attachment button click
   */
  protected onAttachmentClick(): void {
    this.showSuccess('Attachment feature coming soon');
    // TODO: Implement file upload functionality
  }

  /**
   * Scroll to bottom of messages with smooth animation
   */
  private scrollToBottom(): void {
    if (this.messagesScrollContainer) {
      const el = this.messagesScrollContainer.elementRef.nativeElement as HTMLElement;
      if (el) {
        setTimeout(() => {
          el.scrollTo({
            top: el.scrollHeight,
            behavior: 'smooth',
          });
        }, 0);
      }
    }
  }

  /**
   * Get provider logo URL based on provider name
   */
  protected getProviderLogo(provider: string): string | null {
    const logoMap: Record<string, string> = {
      BookingCom: 'https://cdn.brandfetch.io/id9mEmLNcV/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1725855381233',
      Airbnb: 'https://cdn.brandfetch.io/idkuvXnjOH/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1717146459610',
      Agoda: 'https://cdn.brandfetch.io/idrJbkwvG0/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1724730098837',
      Expedia: 'https://cdn.brandfetch.io/idAGaivHFH/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1740983477322',
    };
    return logoMap[provider] || null;
  }

  /**
   * Get sender name for a message
   */
  protected getSenderName(message: Message): string {
    // For property messages, use default "Property"
    if (message.sender === 'property') {
      return this.selectedThread()?.title || 'Property';
    }

    // For guest messages, try to extract from thread title or use "Guest"
    // Assuming thread title might contain guest name
    return 'Guest';
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 7000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }
}
