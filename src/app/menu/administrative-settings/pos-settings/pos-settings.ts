import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { BlinkContextService } from '../../../shared/blink/blink-context.service';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-pos-settings',
  standalone: true,
  imports: [RouterModule, MatListModule, MatIconModule, MatCardModule],
  templateUrl: './pos-settings.html',
  styleUrl: './pos-settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PosSettings {
  private readonly blink = inject(BlinkContextService);

  /** Blink is a Mauritius payment method: the page is offered only to stores that may use it. */
  readonly navLinks = computed(() => [
    { path: 'receipt', label: 'Receipt', icon: 'receipt_long' },
    { path: 'printers', label: 'Printer', icon: 'print' },
    { path: 'register', label: $localize`Registers`, icon: 'point_of_sale' },
    ...(this.blink.eligible() ? [{ path: 'blink', label: $localize`Blink payments`, icon: 'bolt' }] : []),
  ]);
}
