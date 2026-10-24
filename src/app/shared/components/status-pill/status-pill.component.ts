import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type PillKind = 'subscription' | 'invoice';
type Tone = 'green' | 'blue' | 'amber' | 'red' | 'slate';

interface PillDef {
  label: string;
  tone: Tone;
}

const SUBSCRIPTION: Record<string, PillDef> = {
  TRIAL: { label: $localize`On trial`, tone: 'blue' },
  ACTIVE: { label: $localize`Active`, tone: 'green' },
  PAST_DUE: { label: $localize`Payment late`, tone: 'amber' },
  EXPIRED: { label: $localize`Locked`, tone: 'red' },
  SUSPENDED: { label: $localize`Suspended`, tone: 'red' },
  CANCELLED: { label: $localize`Cancelled`, tone: 'slate' },
  NONE: { label: $localize`No subscription`, tone: 'slate' },
};

const INVOICE: Record<string, PillDef> = {
  PENDING: { label: $localize`Open`, tone: 'amber' },
  PAID: { label: $localize`Paid`, tone: 'green' },
  CANCELLED: { label: $localize`Void`, tone: 'slate' },
  UNCOLLECTIBLE: { label: $localize`Written off`, tone: 'red' },
  FAILED: { label: $localize`Failed`, tone: 'red' },
};

/** One look for a subscription's or an invoice's state, in light and dark mode. */
@Component({
  selector: 'app-status-pill',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<span class="pill" [class]="'pill--' + def().tone" [attr.data-status]="value() ?? 'NONE'">{{ def().label }}</span>`,
  styles: `
    :host { display: inline-flex; }
    .pill { display: inline-flex; align-items: center; border-radius: 999px; padding: 2px 10px; font-size: 12px; font-weight: 600; line-height: 1.5; white-space: nowrap; }
    .pill--green { background: light-dark(#dcfce7, #14532d); color: light-dark(#166534, #bbf7d0); }
    .pill--blue { background: light-dark(#dbeafe, #1e3a8a); color: light-dark(#1e40af, #bfdbfe); }
    .pill--amber { background: light-dark(#fef3c7, #78350f); color: light-dark(#92400e, #fde68a); }
    .pill--red { background: light-dark(#fee2e2, #7f1d1d); color: light-dark(#991b1b, #fecaca); }
    .pill--slate { background: light-dark(#e2e8f0, #334155); color: light-dark(#334155, #e2e8f0); }
  `,
})
export class StatusPillComponent {
  readonly value = input<string | null | undefined>(null);
  readonly kind = input<PillKind>('subscription');

  protected readonly def = computed<PillDef>(() => {
    const table = this.kind() === 'invoice' ? INVOICE : SUBSCRIPTION;
    const key = this.value() ?? 'NONE';
    return table[key] ?? { label: key, tone: 'slate' };
  });
}
