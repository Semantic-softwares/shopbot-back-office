import { Injectable, inject, ApplicationRef, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, first, interval, concat } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ReleaseNotesService } from './release-notes.service';
import { WhatsNewDialogComponent, WhatsNewResult } from '../components/whats-new-dialog/whats-new-dialog.component';

/**
 * PWA Update Service
 * 
 * Handles checking for new app versions and prompting the user to update.
 * - Checks every 30 seconds after the app stabilizes
 * - Shows a dialog listing what is new (and fixed) when a new version is available
 * - Reloads the app when the user confirms; "Later" asks again in 30 minutes
 */
@Injectable({
  providedIn: 'root',
})
export class PwaUpdateService {
  private swUpdate = inject(SwUpdate);
  private snackBar = inject(MatSnackBar);
  private appRef = inject(ApplicationRef);
  private dialog = inject(MatDialog);
  private notes = inject(ReleaseNotesService);
  private prompt: MatDialogRef<WhatsNewDialogComponent, WhatsNewResult> | null = null;

  readonly updateAvailable = signal<boolean>(false);

  initialize(): void {
    if (!this.swUpdate.isEnabled) {
      console.log('🔄 Service Worker not enabled (dev mode or unsupported browser)');
      return;
    }

    console.log('🔄 PWA Update Service initialized');

    // First run with release notes: remember where this install is, so only later releases are announced.
    if (!this.notes.lastSeen()) this.notes.load().then((all) => this.notes.markSeen(all[0]?.id));

    // Listen for version ready events
    this.swUpdate.versionUpdates
      .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
      .subscribe((evt) => {
        console.log('🆕 New version available:', evt.latestVersion.hash);
        this.updateAvailable.set(true);
        this.promptUpdate();
      });

    // Handle unrecoverable state (corrupted cache)
    this.swUpdate.unrecoverable.subscribe((evt) => {
      console.error('⚠️ Service Worker unrecoverable state:', evt.reason);
      const ref = this.snackBar.open(
        $localize`An error occurred. Please reload the app.`,
        $localize`Reload`,
        { duration: 0 }
      );
      ref.onAction().subscribe(() => {
        document.location.reload();
      });
    });

    // Poll for updates every 30 seconds after app stabilizes
    this.startPeriodicUpdateCheck();
  }

  private startPeriodicUpdateCheck(): void {
    const appIsStable$ = this.appRef.isStable.pipe(first((isStable) => isStable === true));
    const every30Seconds$ = interval(30 * 1000);
    const every30SecondsOnceStable$ = concat(appIsStable$, every30Seconds$);

    every30SecondsOnceStable$.subscribe(async () => {
      try {
        const updateFound = await this.swUpdate.checkForUpdate();
        if (updateFound) {
          console.log('🔍 Update check: new version found');
        }
      } catch (err) {
        console.error('🔍 Update check failed:', err);
      }
    });
  }

  /** Lists what is new since the last release this person saw, and lets them update now or later. */
  private async promptUpdate(): Promise<void> {
    if (this.prompt) return;
    const all = await this.notes.load();
    const releases = this.notes.unseen(all);
    this.prompt = this.dialog.open(WhatsNewDialogComponent, { width: '560px', maxWidth: '95vw', autoFocus: 'first-tabbable', data: { releases, mode: 'update' } });
    this.prompt.afterClosed().subscribe((choice) => {
      this.prompt = null;
      if (choice === 'update') {
        this.notes.markSeen(all[0]?.id);
        this.activateUpdate();
      } else {
        // Leave it for a while, then ask again; closing the dialog must not hide an update forever.
        setTimeout(() => this.promptUpdate(), 30 * 60 * 1000);
      }
    });
  }

  /** The release history, opened from the user menu. Nothing is installed from here. */
  async showWhatsNew(): Promise<void> {
    const all = await this.notes.load();
    this.dialog.open(WhatsNewDialogComponent, { width: '560px', maxWidth: '95vw', data: { releases: all.slice(0, 5), mode: 'browse' } });
  }

  async activateUpdate(): Promise<void> {
    try {
      await this.swUpdate.activateUpdate();
      document.location.reload();
    } catch (err) {
      console.error('Failed to activate update:', err);
      document.location.reload();
    }
  }
}
