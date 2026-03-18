import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormControl,
} from '@angular/forms';
import {
  MatDialogModule,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import {
  Webhook,
  WebhookEvent,
  WebhookService,
} from '../../../../../../shared/services/webhook.service';
import { StoreStore } from '../../../../../../shared/stores/store.store';
import { rxResource } from '@angular/core/rxjs-interop';
import { toSignal } from '@angular/core/rxjs-interop';
import { tap, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-webhook-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatAutocompleteModule,
  ],
  templateUrl: './webhook-form-dialog.html',
  styleUrl: './webhook-form-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebhookFormDialogComponent {
  private fb = inject(FormBuilder);
  private webhookService = inject(WebhookService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);
  public dialogRef = inject(MatDialogRef<WebhookFormDialogComponent>);
  @Inject(MAT_DIALOG_DATA) data?: { webhook: Webhook | null } = inject(
    MAT_DIALOG_DATA,
  ) as { webhook: Webhook | null };
  eventAutocompleteControl = new FormControl('');
  // Convert FormControl value changes to signal for reactivity in computed()
  protected eventSearchValue = toSignal(
    this.eventAutocompleteControl.valueChanges.pipe(
      startWith(''),
      tap((value) => console.log('Search value changed:', value))
    )
  );
  saving = signal(false);
  loading = signal(false);
  selectedEvents = signal<WebhookEvent[]>([]);

  public availableEvents = rxResource({
    stream: () => {
      return this.webhookService.getAvailableEvents();
    },
  });

  public filteredEvents = computed(() => {
    const searchValue = (this.eventSearchValue() || '').toLowerCase();
    const selectedIds = this.selectedEvents().map((e) => e.id);
    return this.availableEvents
      .value()
      ?.data?.filter(
        (event) =>
          !selectedIds.includes(event.id) &&
          (event.title?.toLowerCase().includes(searchValue) ||
            event.id.toLowerCase().includes(searchValue)),
      );
  });

  public webhookForm = this.fb.group({
    url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
    property_id: [this.storeStore.selectedStore()?.channex?.propertyId, Validators.required],
    is_active: [true, Validators.required],
    send_data: [false, Validators.required],
    headers: [''],
    request_params: [''],
  });

webhook = rxResource({
  params: () => {
    const webhook = this.data?.webhook;
    const store = this.storeStore.selectedStore();
    const propertyId = store?.channex?.propertyId;

    // New mode -> no request
    if (!webhook?.id || !propertyId) {
      return undefined;
    }

    // Edit mode -> request allowed
    return {
      webhookId: webhook.id,
      propertyId,
    };
  },

  stream: ({ params }) => {
    return this.webhookService.getWebhook(
      params.webhookId,
      params.propertyId
    ).pipe(
      tap(() => {
        this.initializeForm();
      })
    );
  },
});

  private initializeForm(): void {
    // Use the fetched webhook data if available, otherwise use the data from dialog
    const webhook = this.data?.webhook;

    // Parse events from webhook data (can be array or need to parse from event_mask)
    let events: WebhookEvent[] = [];
    if (webhook?.events && Array.isArray(webhook.events)) {
      events = webhook.events;
    } else if (webhook?.attributes?.event_mask) {
      // Parse semicolon-separated event_mask string
      const eventIds = webhook.attributes.event_mask
        .split(';')
        .map((e: string) => e.trim())
        .filter((e: string) => e);
      events = eventIds.map((id: string) => ({ id, title: id }));
    }

    this.selectedEvents.set(events);

    this.webhookForm.patchValue({
      url: webhook?.attributes?.callback_url || webhook?.url || '',
      property_id:
        webhook?.property_id ||
        this.storeStore.selectedStore()?.channex?.propertyId ||
        '',
      is_active: webhook?.attributes?.is_active ?? webhook?.is_active ?? true,
      send_data: webhook?.attributes?.send_data || false,
      headers: webhook?.attributes?.headers
        ? JSON.stringify(webhook.attributes.headers)
        : null,
      request_params: webhook?.attributes?.request_params
        ? JSON.stringify(webhook.attributes.request_params)
        : null,
    });
  }

  onSubmit(): void {
    if (this.webhookForm.invalid || this.selectedEvents().length === 0) {
      this.snackBar.open(
        'Please fill in all required fields and select at least one event',
        'Close',
        { duration: 3000 },
      );
      return;
    }

    this.saving.set(true);
    const formValue = this.webhookForm.value;
    const store = this.storeStore.selectedStore();
    const propertyId = store?.channex?.propertyId;

    if (!propertyId) {
      this.snackBar.open('Property ID not found', 'Close', { duration: 3000 });
      this.saving.set(false);
      return;
    }

    // Parse headers and request_params from JSON strings
    let headers: any = {};
    let requestParams: any = {};
    
    if (formValue.headers) {
      try {
        headers = typeof formValue.headers === 'string' 
          ? JSON.parse(formValue.headers) 
          : formValue.headers || {};
      } catch (e) {
        this.snackBar.open('Invalid JSON in headers field', 'Close', { duration: 3000 });
        this.saving.set(false);
        return;
      }
    }
    
    if (formValue.request_params) {
      try {
        requestParams = typeof formValue.request_params === 'string'
          ? JSON.parse(formValue.request_params)
          : formValue.request_params || {};
      } catch (e) {
        this.snackBar.open('Invalid JSON in request_params field', 'Close', { duration: 3000 });
        this.saving.set(false);
        return;
      }
    }

    // Use the webhook ID from currentWebhook if available, otherwise from dialog data
    const webhookId = this.data?.webhook?.id;

    const webhook: Webhook = {
      url: formValue.url!,
      events: this.selectedEvents(),
      is_active: formValue.is_active!,
      property_id: propertyId,
      headers,
      request_params: requestParams,
    } as any;

    if (webhookId) {
      // Update existing webhook
      this.webhookService.updateWebhook(webhookId, webhook).subscribe({
        next: (response) => {
          this.snackBar.open('Webhook updated successfully', 'Close', {
            duration: 3000,
          });
          this.saving.set(false);
          this.dialogRef.close(response.data);
        },
        error: (error) => {
          console.error('Failed to update webhook:', error);
          this.snackBar.open('Failed to update webhook', 'Close', {
            duration: 3000,
          });
          this.saving.set(false);
        },
      });
    } else {
      // Create new webhook
      this.webhookService.createWebhook(webhook).subscribe({
        next: (response) => {
          this.snackBar.open('Webhook created successfully', 'Close', {
            duration: 3000,
          });
          this.saving.set(false);
          this.dialogRef.close(response.data);
        },
        error: (error) => {
          console.error('Failed to create webhook:', error);
          this.snackBar.open('Failed to create webhook', 'Close', {
            duration: 3000,
          });
          this.saving.set(false);
        },
      });
    }
  }

  addEvent(event: WebhookEvent): void {
    const current = this.selectedEvents();
    if (!current.some((e) => e.id === event.id)) {
      this.selectedEvents.set([...current, event]);
      this.eventAutocompleteControl.setValue('');
    }
  }

  removeEvent(event: WebhookEvent): void {
    const current = this.selectedEvents();
    this.selectedEvents.set(current.filter((e) => e.id !== event.id));
  }

  getEventLabel(event: WebhookEvent): string {
    return event.title || event.id;
  }
}
