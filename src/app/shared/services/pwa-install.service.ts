import { Injectable, inject, signal } from '@angular/core';
import { Platform } from '@angular/cdk/platform';

/**
 * PWA Install Service
 * 
 * Handles the "Add to Home Screen" / "Install App" prompt.
 * - Captures the `beforeinstallprompt` event
 * - Provides a method to trigger the install prompt
 * - Tracks whether the app is already installed
 */
@Injectable({
  providedIn: 'root',
})
export class PwaInstallService {
  private platform = inject(Platform);
  
  private deferredPrompt: any = null;

  /** Whether the install prompt is available */
  readonly canInstall = signal<boolean>(false);

  /** Whether the app is running as an installed PWA */
  readonly isInstalled = signal<boolean>(false);

  /** Whether to show iOS install instructions */
  readonly showIosInstall = signal<boolean>(false);

  initialize(): void {
    // Check if already running as installed PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    
    this.isInstalled.set(isStandalone);

    if (isStandalone) {
      console.log('📱 App is running as installed PWA');
      return;
    }

    // Listen for the beforeinstallprompt event (Chrome, Edge, etc.)
    window.addEventListener('beforeinstallprompt', (event: Event) => {
      event.preventDefault();
      this.deferredPrompt = event;
      this.canInstall.set(true);
      console.log('📱 Install prompt captured — app can be installed');
    });

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      console.log('✅ App installed successfully');
      this.deferredPrompt = null;
      this.canInstall.set(false);
      this.isInstalled.set(true);
    });

    // Check for iOS Safari (no beforeinstallprompt support)
    this.checkIosSafari();
  }

  /**
   * Trigger the native install prompt (Chrome/Edge)
   * Returns true if the user accepted, false otherwise
   */
  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.warn('📱 No install prompt available');
      return false;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    
    console.log(`📱 Install prompt outcome: ${outcome}`);
    
    if (outcome === 'accepted') {
      this.deferredPrompt = null;
      this.canInstall.set(false);
      return true;
    }
    
    return false;
  }

  /**
   * Dismiss the install prompt (user chose not to install)
   * Stores flag in localStorage so we don't nag again for 7 days
   */
  dismissInstall(): void {
    const dismissedAt = Date.now();
    localStorage.setItem('pwa-install-dismissed', String(dismissedAt));
  }

  /** Check if the install prompt was recently dismissed */
  wasRecentlyDismissed(): boolean {
    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    if (!dismissedAt) return false;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return (Date.now() - Number(dismissedAt)) < sevenDays;
  }

  private checkIosSafari(): void {
    const isIos = this.platform.IOS;
    const isInBrowser = !((window.navigator as any).standalone === true);
    
    if (isIos && isInBrowser) {
      this.showIosInstall.set(true);
      console.log('📱 iOS Safari detected — show manual install instructions');
    }
  }
}
