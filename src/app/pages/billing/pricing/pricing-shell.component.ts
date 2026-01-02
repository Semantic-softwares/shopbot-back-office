import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Parent component for pricing and billing routes
 * Holds the subscriptionResolver at this level to avoid multiple resolver calls
 */
@Component({
  selector: 'app-pricing-shell',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './pricing-shell.component.html',
})
export class PricingShellComponent {}
