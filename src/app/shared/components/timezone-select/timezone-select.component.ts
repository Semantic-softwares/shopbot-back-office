import { ChangeDetectionStrategy, Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { allTimezones, deviceTimezone, filterTimezones, isKnownTimezone, timeIn, timezoneLabel } from '../../utils/timezones';

/**
 * Pick a timezone from a searchable list (type a city, a country or an offset). Use it like any form field:
 *
 *   <app-timezone-select formControlName="timezone" label="Timezone" />
 *
 * The value is the zone's IANA name, for example "Indian/Mauritius". A hotel that was set up with a fixed offset
 * ("UTC+4") shows it as such until a zone is chosen. An empty value means "not set".
 */
@Component({
  selector: 'app-timezone-select',
  imports: [FormsModule, MatAutocompleteModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TimezoneSelectComponent), multi: true }],
  template: `
    <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
      <mat-label>{{ label() }}</mat-label>
      <input matInput type="text" autocomplete="off" data-testid="timezone-input"
        [ngModel]="text()" (ngModelChange)="onType($event)" (blur)="onBlur()" [disabled]="disabled()"
        [matAutocomplete]="auto" [placeholder]="placeholder()" [attr.aria-label]="label()" />
      <mat-icon matSuffix>schedule</mat-icon>
      <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onPick($event)" autoActiveFirstOption>
        @for (o of matches(); track o.value) {
          <mat-option [value]="o.value" data-testid="timezone-option">
            <span>{{ o.name }}</span>
            <span class="ml-2 text-xs opacity-60">{{ o.offset }}</span>
          </mat-option>
        } @empty {
          <mat-option disabled><ng-container i18n>No timezone matches. Try a city or a country.</ng-container></mat-option>
        }
      </mat-autocomplete>
    </mat-form-field>

    <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-xs text-on-surface-variant">
      @if (value()) {
        <span data-testid="timezone-now"><ng-container i18n>It is {{ nowThere() }} there right now.</ng-container></span>
      } @else {
        <span data-testid="timezone-unset">{{ hint() }}</span>
      }
      @if (device() && device() !== value() && !disabled()) {
        <button type="button" matButton class="!h-7 !min-w-0 !px-2 !text-xs" (click)="useDevice()" data-testid="timezone-device">
          <ng-container i18n>Use this device's timezone</ng-container> ({{ device() }})
        </button>
      }
    </div>
  `,
})
export class TimezoneSelectComponent implements ControlValueAccessor {
  readonly label = input($localize`Timezone`);
  readonly placeholder = input($localize`Search a city, a country or an offset`);
  /** Shown under the field while nothing is chosen. */
  readonly hint = input($localize`No timezone is set yet. Dates and scheduled reminders use UTC until you choose one.`);

  protected readonly value = signal('');
  protected readonly text = signal('');
  protected readonly disabled = signal(false);
  private readonly typed = signal('');
  private readonly zones = allTimezones();
  protected readonly device = signal(isKnownTimezone(deviceTimezone()) ? deviceTimezone() : '');

  /** The zones offered: everything when the box shows the chosen zone, otherwise what matches what was typed. */
  protected readonly matches = computed(() => filterTimezones(this.zones, this.typed()));
  protected readonly nowThere = computed(() => (this.value() ? timeIn(this.value()) : ''));

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(v: string | null): void {
    this.value.set(v ?? '');
    this.text.set(v ? timezoneLabel(v) : '');
    this.typed.set('');
  }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled.set(isDisabled); }

  protected onType(v: string): void {
    this.text.set(v);
    this.typed.set(v);
    // Clearing the box clears the choice; anything else only counts once a zone is picked from the list.
    if (!v.trim() && this.value()) { this.value.set(''); this.onChange(''); }
  }

  protected onPick(e: MatAutocompleteSelectedEvent): void {
    this.choose(String(e.option.value));
  }

  protected useDevice(): void {
    this.choose(this.device());
  }

  private choose(zone: string): void {
    this.value.set(zone);
    this.text.set(timezoneLabel(zone));
    this.typed.set('');
    this.onChange(zone);
    this.onTouched();
  }

  /** Leaving the box with half-typed text puts the chosen zone back, so what is shown is always what is saved. */
  protected onBlur(): void {
    this.text.set(this.value() ? timezoneLabel(this.value()) : '');
    this.typed.set('');
    this.onTouched();
  }
}
