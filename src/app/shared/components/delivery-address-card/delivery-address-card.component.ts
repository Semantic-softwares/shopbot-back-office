import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ShippingDetails } from '../../models/order.model';

declare const google: any;

// Storefront delivery orders only — shows staff exactly where the customer
// is, so they can hand a rider the pin rather than typing a free-text
// address: a real interactive map (not a Static Maps API image — that
// product isn't enabled for this key, which rendered as a broken image),
// a copy-address button, and a "Get directions" link into Google Maps.
@Component({
  selector: 'app-delivery-address-card',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './delivery-address-card.component.html',
})
export class DeliveryAddressCardComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) shipping!: ShippingDetails;

  @ViewChild('mapEl') private mapEl?: ElementRef<HTMLDivElement>;

  protected readonly copied = signal(false);
  protected readonly mapFailed = signal(false);

  private pollHandle?: ReturnType<typeof setInterval>;

  protected readonly addressLabel = computed(() => {
    const s = this.shipping;
    return (
      s.name ||
      [s.locality, s.administrativeArea, s.country].filter(Boolean).join(', ') ||
      (s.latitude != null && s.longitude != null ? `${s.latitude.toFixed(5)}, ${s.longitude.toFixed(5)}` : 'Unknown location')
    );
  });

  protected readonly directionsUrl = computed(() => {
    const { latitude, longitude } = this.shipping;
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  });

  ngAfterViewInit(): void {
    // The JS API script tag in index.html loads async/defer, so it may not
    // be ready yet when this card mounts (e.g. a direct deep link straight
    // to an order's details page) — poll briefly rather than assuming it's
    // already on `window`.
    let attempts = 0;
    this.pollHandle = setInterval(() => {
      attempts++;
      if (typeof google !== 'undefined' && google.maps) {
        clearInterval(this.pollHandle);
        this.renderMap();
      } else if (attempts > 50) {
        clearInterval(this.pollHandle);
        this.mapFailed.set(true);
      }
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.pollHandle) clearInterval(this.pollHandle);
  }

  private renderMap(): void {
    const el = this.mapEl?.nativeElement;
    const { latitude, longitude } = this.shipping;
    if (!el || latitude == null || longitude == null) {
      this.mapFailed.set(true);
      return;
    }
    const position = { lat: latitude, lng: longitude };
    const map = new google.maps.Map(el, {
      center: position,
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: true,
    });
    new google.maps.Marker({ position, map });
  }

  async copyAddress(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.addressLabel());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // Clipboard access blocked — the address is already on screen.
    }
  }
}
