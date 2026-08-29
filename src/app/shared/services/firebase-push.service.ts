import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SocketService } from './socket.service';

/**
 * Web push token registration for staff on-duty table-order alerts — the
 * browser-tab-closed/backgrounded backstop to the real-time socket alert
 * (see SocketService#tableNewOrder$, IncomingTableOrderAlertComponent).
 *
 * Deliberately lazy: nothing Firebase-related loads or runs until
 * requestPermissionAndRegister() is actually called (from the toolbar's
 * on-duty toggle, when switching ON) — and that call itself no-ops safely if
 * environment.firebaseConfig hasn't been filled in yet (see environment.ts).
 */
@Injectable({ providedIn: 'root' })
export class FirebasePushService {
  private readonly http = inject(HttpClient);
  private readonly socketService = inject(SocketService);
  private registered = false;

  private isConfigured(): boolean {
    return !!(environment.firebaseConfig?.apiKey && environment.vapidKey);
  }

  async requestPermissionAndRegister(): Promise<void> {
    if (this.registered || !this.isConfigured() || !('serviceWorker' in navigator) || !('Notification' in window)) {
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('🔕 [PUSH] Notification permission not granted');
        return;
      }

      const { initializeApp } = await import('firebase/app');
      const { getMessaging, getToken, onMessage } = await import('firebase/messaging');

      const app = initializeApp(environment.firebaseConfig);
      const messaging = getMessaging(app);
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

      const token = await getToken(messaging, {
        vapidKey: environment.vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (!token) {
        console.warn('🔕 [PUSH] No FCM token returned');
        return;
      }

      // Foreground delivery. Firebase deliberately does NOT display a
      // notification while the tab is focused — the service worker's
      // onBackgroundMessage only runs when the page is backgrounded/closed —
      // so without this handler a focused tab silently swallows the push.
      // Displayed through the SW registration (not `new Notification()`) so it
      // renders identically to the background case.
      onMessage(messaging, (payload) => {
        const title = payload.notification?.title || 'New table order';
        const body = payload.notification?.body || '';
        console.log('🔔 [PUSH] foreground message received:', title, body);

        // Shown through the SW registration so the click lands in the SW's
        // notificationclick handler, which deep-links to the order details —
        // a `new Notification()` here would not get that behaviour.
        registration.showNotification(title, {
          body,
          icon: '/icons/icon-192x192.png',
          data: payload.data,
          tag: payload.data?.['orderId'] ? `table-order-${payload.data['orderId']}` : undefined,
        });

        // Also raise the in-app toast + looping sound. The socket normally
        // gets there first and this dedupes by orderId, but when the socket is
        // down this push becomes the only thing that surfaces the order.
        if (payload.data?.['type'] === 'table_new_order') {
          this.socketService.pushTableOrderAlert({
            orderId: payload.data['orderId'],
            tableId: payload.data['tableId'] || '',
            tableName: payload.data['tableName'] || body || 'A table',
            itemCount: Number(payload.data['itemCount']) || 0,
            itemPreview: [],
            createdAt: new Date().toISOString(),
          });
        }
      });

      this.http.post(`${environment.apiUrl}/merchants/me/web-push-token`, { token }).subscribe({
        next: () => {
          this.registered = true;
          console.log('✅ [PUSH] Web push token registered');
        },
        error: (err) => console.warn('🔕 [PUSH] Failed to register token with backend:', err.message),
      });
    } catch (err: any) {
      console.warn('🔕 [PUSH] Web push setup failed:', err?.message || err);
    }
  }
}
