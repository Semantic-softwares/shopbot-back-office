import { Component, effect, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { StorefrontStore } from '../../data-access/storefront.store';
import { OrderStatusDialogComponent } from '../order-status-dialog/order-status-dialog.component';

// Floating, always-visible entry point to the table's live order — replaces
// the old inline banner, which could easily be scrolled out of view right
// when another phone at the table adds something. Badges + chimes on
// StorefrontStore.hasUnseenOrderUpdate(), then opens the full view in a modal.
@Component({
  selector: 'app-storefront-order-status-fab',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './order-status-fab.component.html',
})
export class OrderStatusFabComponent {
  protected readonly store = inject(StorefrontStore);
  private readonly dialog = inject(MatDialog);
  private audioContext: AudioContext | null = null;
  // Suppresses the chime for whatever hasUnseenOrderUpdate value is already
  // true the moment this component is constructed (e.g. an existing order
  // from other diners on first load) — only a genuine false→true transition
  // *after* mount should ever make a sound.
  private hasSeenFirstEmission = false;

  // A transfer is the one update the guests can't afford to miss — their bill
  // disappears from this page — so it opens itself rather than waiting for a
  // tap on the FAB. Once only, so dismissing it makes it stay dismissed.
  private hasAnnouncedMove = false;

  constructor() {
    effect(() => {
      const unseen = this.store.hasUnseenOrderUpdate();
      if (unseen && this.hasSeenFirstEmission) {
        this.playChime();
      }
      this.hasSeenFirstEmission = true;
    });

    effect(() => {
      if (this.store.orderStatus()?.movedToTableName && !this.hasAnnouncedMove) {
        this.hasAnnouncedMove = true;
        this.playChime();
        this.open();
      }
    });
  }

  open(): void {
    this.store.markOrderSeen();
    this.dialog.open(OrderStatusDialogComponent, { width: '420px', maxWidth: '95vw', autoFocus: false });
  }

  // Small synthesized two-note chime — no binary asset to source/host, and it
  // stays perfectly in sync with the storefront's theme-free, self-contained
  // build. Best-effort: autoplay policies can silently block this on some
  // browsers/first-loads, which is fine — the badge itself never depends on it.
  private playChime(): void {
    try {
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }
      const ctx = this.audioContext;
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }

      const playTone = (frequency: number, startOffset: number, duration: number): void => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        const startTime = ctx.currentTime + startOffset;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      playTone(880, 0, 0.18);
      playTone(1318.5, 0.1, 0.22);
    } catch {
      // Non-fatal — the visual badge already carries the notification.
    }
  }
}
