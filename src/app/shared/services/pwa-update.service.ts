import { Injectable, inject, ApplicationRef, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, first, interval, concat } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * PWA Update Service
 * 
 * Handles checking for new app versions and prompting the user to update.
 * - Checks every 30 seconds after the app stabilizes
 * - Shows a snackbar when a new version is available
 * - Reloads the app when the user confirms
 */
@Injectable({
  providedIn: 'root',
})
export class PwaUpdateService {
  private swUpdate = inject(SwUpdate);
  private snackBar = inject(MatSnackBar);
  private appRef = inject(ApplicationRef);

  readonly updateAvailable = signal<boolean>(false);

  initialize(): void {
    if (!this.swUpdate.isEnabled) {
      console.log('🔄 Service Worker not enabled (dev mode or unsupported browser)');
      return;
    }

    console.log('🔄 PWA Update Service initialized');

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
        'An error occurred. Please reload the app.',
        'Reload',
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

  private promptUpdate(): void {
    const snackBarRef = this.snackBar.open(
      '🚀 A new version is available!',
      'Update Now',
      {
        duration: 0,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['pwa-update-snackbar'],
      }
    );

    snackBarRef.onAction().subscribe(() => {
      this.activateUpdate();
    });
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
