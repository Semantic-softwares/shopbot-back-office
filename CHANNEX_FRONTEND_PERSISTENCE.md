# Frontend: Database-Backed Draft Management Implementation

## Overview

The frontend has been updated to use a **hybrid persistence strategy**:
1. **localStorage** for fast session cache (UX optimization)
2. **Database** for reliable persistent storage (primary source)

This document guides you through updating the frontend component to work with the new database-backed persistence.

## Current Frontend State

### File: `inventory-rates.component.ts`

The component currently has:
- ✅ All restriction form logic
- ✅ Day-of-week selection
- ✅ Signal-based state management
- ⏳ localStorage auto-save (needs update)
- ⏳ Manual draft recovery (can be improved)

### What Needs Updating:
1. `savePricingDraft()` - Use new backend endpoint
2. `loadPricingDraft()` - Check localStorage first, then database
3. New: `listDrafts()` - Show draft history
4. New: `markDraftAsSynced()` - Update status after sync
5. New: `recordDraftError()` - Log failed syncs

## Implementation Steps

### Step 1: Add Draft ID Signal

```typescript
export class InventoryRatesComponent {
  // ... existing signals

  // Track the current draft ID in database
  protected currentDraftId = signal<string | null>(null);
  
  // Track draft sync status
  protected draftSyncStatus = signal<'draft' | 'submitted' | 'synced' | 'error'>('draft');
}
```

### Step 2: Update savePricingDraft()

```typescript
/**
 * Save draft to database
 * Auto-called when user stops editing (debounced)
 */
async savePricingDraft(): Promise<void> {
  try {
    if (!this.storeId()) {
      return;
    }

    const draftData = {
      rates: Object.fromEntries(
        Array.from(this.rateData.entries()).map(([k, v]) => [
          k,
          Object.fromEntries(v),
        ])
      ),
      availability: Object.fromEntries(
        Array.from(this.availabilityData.entries()).map(([k, v]) => [
          k,
          Object.fromEntries(v),
        ])
      ),
      restrictions: Object.fromEntries(
        Array.from(this.restrictionData.entries()).map(([k, v]) => [
          k,
          Object.fromEntries(v),
        ])
      ),
      selectedDays: Array.from(this.selectedDays()),
      selectedRatePlanId: this.selectedRatePlanId(),
      selectedCurrency: this.selectedCurrency(),
    };

    // Also save to localStorage for quick recovery
    const cacheKey = `draft_${this.storeId()}_${this.startDate()}_${this.endDate()}`;
    localStorage.setItem(cacheKey, JSON.stringify(draftData));

    // Save to database
    const response = await this.http
      .post<any>(
        `/admin/channex/stores/${this.storeId()}/pricing-draft`,
        {
          startDate: this.startDate(),
          endDate: this.endDate(),
          data: draftData,
        }
      )
      .toPromise();

    if (response?.success) {
      // Store draft ID for later reference
      this.currentDraftId.set(response.draftId);
      this.draftSyncStatus.set('draft');
      
      this.showSuccessMessage('Draft saved to database');
    }
  } catch (error) {
    this.logger.error('Failed to save draft to database:', error);
    // Keep localStorage backup in case of API failure
  }
}
```

### Step 3: Update loadPricingDraft()

```typescript
/**
 * Load draft on component init
 * Try localStorage first (fast), fall back to database
 */
async loadPricingDraft(): Promise<void> {
  try {
    const cacheKey = `draft_${this.storeId()}_${this.startDate()}_${this.endDate()}`;

    // 1. Try localStorage first (fast recovery)
    const cachedDraft = localStorage.getItem(cacheKey);
    if (cachedDraft) {
      try {
        const draftData = JSON.parse(cachedDraft);
        this.populateDraftData(draftData);
        this.showInfoMessage('Loaded draft from cache');
        
        // Still fetch from database in background to get latest version
        this.loadDraftFromDatabase();
        return;
      } catch (e) {
        // Invalid cache, clear it
        localStorage.removeItem(cacheKey);
      }
    }

    // 2. Load from database
    await this.loadDraftFromDatabase();
  } catch (error) {
    this.logger.error('Failed to load draft:', error);
  }
}

/**
 * Load draft from database
 */
private async loadDraftFromDatabase(): Promise<void> {
  try {
    const response = await this.http
      .get<any>(
        `/admin/channex/stores/${this.storeId()}/pricing-draft`,
        {
          params: {
            startDate: this.startDate(),
            endDate: this.endDate(),
          },
        }
      )
      .toPromise();

    if (response?.data) {
      this.populateDraftData(response.data);
      this.currentDraftId.set(response.data._id);
      this.draftSyncStatus.set(response.data.status || 'draft');

      // Update cache with latest
      const cacheKey = `draft_${this.storeId()}_${this.startDate()}_${this.endDate()}`;
      localStorage.setItem(cacheKey, JSON.stringify(response.data));

      this.showInfoMessage('Loaded draft from database');
    }
  } catch (error) {
    this.logger.warn('No draft found in database:', error);
  }
}

/**
 * Populate form from draft data
 */
private populateDraftData(draftData: any): void {
  if (!draftData) return;

  // Convert JSON back to Maps
  if (draftData.rates) {
    this.rateData.set(new Map(
      Object.entries(draftData.rates).map(([k, v]: [string, any]) => [
        k,
        new Map(Object.entries(v)),
      ])
    ));
  }

  if (draftData.availability) {
    this.availabilityData.set(new Map(
      Object.entries(draftData.availability).map(([k, v]: [string, any]) => [
        k,
        new Map(Object.entries(v)),
      ])
    ));
  }

  if (draftData.restrictions) {
    this.restrictionData.set(new Map(
      Object.entries(draftData.restrictions).map(([k, v]: [string, any]) => [
        k,
        new Map(Object.entries(v)),
      ])
    ));
  }

  if (draftData.selectedDays) {
    this.selectedDays.set(new Set(draftData.selectedDays));
  }

  if (draftData.selectedRatePlanId) {
    this.selectedRatePlanId.set(draftData.selectedRatePlanId);
  }

  if (draftData.selectedCurrency) {
    this.selectedCurrency.set(draftData.selectedCurrency);
  }
}
```

### Step 4: Add Draft History Management

```typescript
/**
 * List all drafts for current store
 */
async listDrafts(status?: string): Promise<any[]> {
  try {
    const params: any = { limit: 20 };
    if (status) {
      params.status = status;
    }

    const response = await this.http
      .get<any>(
        `/admin/channex/stores/${this.storeId()}/pricing-drafts`,
        { params }
      )
      .toPromise();

    return response?.data || [];
  } catch (error) {
    this.logger.error('Failed to list drafts:', error);
    return [];
  }
}

/**
 * Load a specific draft for recovery/review
 */
async loadDraftById(draftId: string): Promise<any> {
  try {
    const response = await this.http
      .get<any>(
        `/admin/channex/stores/${this.storeId()}/pricing-drafts/${draftId}`
      )
      .toPromise();

    if (response?.data) {
      this.populateDraftData(response.data);
      this.currentDraftId.set(draftId);
      this.draftSyncStatus.set(response.data.status);
    }

    return response?.data;
  } catch (error) {
    this.logger.error('Failed to load draft:', error);
    return null;
  }
}

/**
 * Delete a specific draft
 */
async deleteDraft(draftId: string): Promise<void> {
  try {
    await this.http
      .delete<any>(
        `/admin/channex/stores/${this.storeId()}/pricing-drafts/${draftId}`
      )
      .toPromise();

    this.showSuccessMessage('Draft deleted');
  } catch (error) {
    this.logger.error('Failed to delete draft:', error);
  }
}
```

### Step 5: Update Sync Workflow

```typescript
/**
 * Push restrictions to Channex
 * Mark draft as synced on success
 */
async saveChanges(): Promise<void> {
  if (!this.validateForm()) {
    return;
  }

  try {
    this.showLoadingMessage('Syncing with Channex...');

    // 1. Push to Channex
    const syncResult = await this.pushRestrictionsToChannex();

    if (syncResult.success) {
      // 2. Mark draft as synced in database
      if (this.currentDraftId()) {
        await this.markDraftAsSynced(this.currentDraftId()!);
      }

      // 3. Clear unsaved changes indicator
      this.hasUnsavedChanges.set(false);

      // 4. Update UI
      this.draftSyncStatus.set('synced');
      this.showSuccessMessage('Changes synced to Channex successfully');

      // 5. Clear cache
      const cacheKey = `draft_${this.storeId()}_${this.startDate()}_${this.endDate()}`;
      localStorage.removeItem(cacheKey);
    } else {
      // Record sync error
      if (this.currentDraftId()) {
        await this.recordDraftError(this.currentDraftId()!, syncResult.error);
      }
      this.draftSyncStatus.set('error');
      this.showErrorMessage(`Sync failed: ${syncResult.error}`);
    }
  } catch (error) {
    this.logger.error('Error during sync:', error);
    
    // Record error
    if (this.currentDraftId()) {
      await this.recordDraftError(this.currentDraftId()!, error.message);
    }

    this.draftSyncStatus.set('error');
    this.showErrorMessage('Failed to sync changes');
  }
}

/**
 * Mark draft as synced after successful Channex push
 */
private async markDraftAsSynced(draftId: string): Promise<void> {
  try {
    await this.http
      .patch<any>(
        `/admin/channex/stores/${this.storeId()}/pricing-drafts/${draftId}/sync`,
        {}
      )
      .toPromise();
  } catch (error) {
    this.logger.warn('Failed to mark draft as synced:', error);
  }
}

/**
 * Record sync error for troubleshooting
 */
private async recordDraftError(draftId: string, errorMessage: string): Promise<void> {
  try {
    await this.http
      .post<any>(
        `/admin/channex/stores/${this.storeId()}/pricing-drafts/${draftId}/error`,
        { error: errorMessage }
      )
      .toPromise();
  } catch (error) {
    this.logger.warn('Failed to record draft error:', error);
  }
}
```

### Step 6: Add Auto-Save with Debounce

```typescript
// Add to component imports
import { debounceTime, Subject } from 'rxjs';

export class InventoryRatesComponent implements OnInit, OnDestroy {
  // ... existing code

  private autoSaveSubject = new Subject<void>();
  private destroy$ = new Subject<void>();

  ngOnInit() {
    // ... existing init code

    // Auto-save on form changes (debounced every 2 seconds)
    this.autoSaveSubject
      .pipe(debounceTime(2000), takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.hasUnsavedChanges()) {
          this.savePricingDraft();
        }
      });
  }

  /**
   * Call this when any form field changes
   */
  onFormChange(): void {
    this.hasUnsavedChanges.set(true);
    this.autoSaveSubject.next();  // Trigger debounced auto-save
  }

  ngOnDestroy() {
    // Save any unsaved changes before leaving
    if (this.hasUnsavedChanges()) {
      this.savePricingDraft();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

## Template Updates

### Show Sync Status Badge

```html
<!-- Add to template -->
<div class="flex items-center gap-2">
  @if (draftSyncStatus() === 'draft') {
    <span class="badge badge-warning">Draft</span>
  } @else if (draftSyncStatus() === 'synced') {
    <span class="badge badge-success">Synced</span>
  } @else if (draftSyncStatus() === 'error') {
    <span class="badge badge-danger">Sync Failed</span>
  }
</div>
```

### Draft History Modal

```html
<!-- Add draft history list -->
@if (showDraftHistory()) {
  <div class="modal">
    <h2>Draft History</h2>
    <table>
      <thead>
        <tr>
          <th>Date Range</th>
          <th>Status</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        @for (draft of draftHistory(); track draft._id) {
          <tr>
            <td>{{ draft.startDate }} to {{ draft.endDate }}</td>
            <td>
              <span [class]="'badge badge-' + getStatusColor(draft.status)">
                {{ draft.status }}
              </span>
            </td>
            <td>{{ draft.createdAt | date:'short' }}</td>
            <td>
              <button (click)="loadDraftById(draft._id)">Load</button>
              <button (click)="deleteDraft(draft._id)">Delete</button>
            </td>
          </tr>
        }
      </tbody>
    </table>
  </div>
}
```

## Data Flow Diagram

```
User Opens Component
        ↓
Load Draft from Database
  ├─ Check localStorage (fast)
  │  └─ If found, populate form immediately
  │  └─ Continue to fetch latest from DB
  └─ Fetch from Database
     └─ Populate form with latest version
     └─ Update localStorage cache

User Edits Form
        ↓
On Form Change (debounced 2s)
        ↓
Auto-Save to Database
  ├─ Save to localStorage immediately
  └─ Send to backend API
     └─ Backend creates/updates InventoryDraft

User Clicks "Sync to Channex"
        ↓
Push to Channex API
  ├─ If success
  │  ├─ Mark draft as synced
  │  ├─ Clear localStorage cache
  │  └─ Show success message
  └─ If failure
     ├─ Record error in database
     ├─ Keep localStorage for retry
     └─ Show error message with retry button

User Leaves Component
        ↓
Save any unsaved changes
└─ Call savePricingDraft() before destroy
```

## Error Handling Best Practices

### Network Error Recovery
```typescript
async saveWithRetry(maxAttempts = 3): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await this.savePricingDraft();
      return;  // Success
    } catch (error) {
      lastError = error as Error;
      this.logger.warn(`Save attempt ${attempt} failed:`, error);

      if (attempt < maxAttempts) {
        // Wait before retry (exponential backoff)
        await this.delay(1000 * Math.pow(2, attempt - 1));
      }
    }
  }

  // All attempts failed
  this.recordDraftError(this.currentDraftId()!, lastError?.message || 'Unknown error');
  throw lastError;
}

private delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### UI Feedback
```typescript
// Show loading spinner during API calls
showLoading = signal(false);

async savePricingDraft(): Promise<void> {
  this.showLoading.set(true);
  try {
    // ... save logic
  } finally {
    this.showLoading.set(false);
  }
}
```

## Migration Checklist

- [ ] Update `savePricingDraft()` to use backend endpoint
- [ ] Update `loadPricingDraft()` to check localStorage first, then DB
- [ ] Add `currentDraftId` signal
- [ ] Add `draftSyncStatus` signal
- [ ] Implement `listDrafts()` method
- [ ] Implement `loadDraftById()` for recovery
- [ ] Implement `deleteDraft()` method
- [ ] Update `saveChanges()` to mark draft as synced
- [ ] Add `markDraftAsSynced()` method
- [ ] Add `recordDraftError()` method
- [ ] Add auto-save with debounce
- [ ] Update component destroy to save unsaved changes
- [ ] Update template with sync status badge
- [ ] Add draft history UI (optional)
- [ ] Test localStorage + DB sync
- [ ] Test error recovery
- [ ] Test page reload with draft recovery

## Testing Scenarios

### Scenario 1: Happy Path
1. User opens component
2. Draft loads from DB
3. User edits form
4. Auto-save fires
5. User clicks sync
6. Draft marked as synced
7. Cache cleared
✅ Expected: Draft persisted in DB, synced to Channex

### Scenario 2: Network Failure During Save
1. User edits form
2. Auto-save fires
3. Network error occurs
4. Error recorded in DB
5. localStorage cache remains
✅ Expected: Can retry, draft not lost

### Scenario 3: Page Reload
1. User has unsaved changes
2. Page refreshes
3. Component loads draft
4. Checks localStorage first
5. Falls back to DB
✅ Expected: Latest draft recovered

### Scenario 4: Multi-Tab Usage
1. Tab A makes edits and saves
2. Tab B reloads
3. Tab B loads from DB (gets latest from Tab A)
✅ Expected: DB ensures data consistency

## Production Deployment

1. **Create InventoryDraft schema** (✅ Already done)
2. **Register model in module** (Needed)
3. **Create MongoDB indexes** (Needed)
4. **Update backend service** (✅ Already done)
5. **Update controller endpoints** (✅ Already done)
6. **Deploy backend** (Next step)
7. **Update frontend component** (Follow steps above)
8. **Deploy frontend** (Final step)
9. **Monitor and verify** (Post-deployment)

## Support & Troubleshooting

### Common Issues

**Q: Draft not saving to database**
A: Check API endpoint is accessible, verify InventoryDraft model is registered

**Q: Draft loads from cache but not updated from DB**
A: Background DB fetch may still be pending, show loading indicator

**Q: Sync status not updating**
A: Ensure `markDraftAsSynced()` is called after successful Channex push

**Q: Can't recover old drafts**
A: Check `listDrafts()` endpoint returns all drafts, verify TTL hasn't expired

