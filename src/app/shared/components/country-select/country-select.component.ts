import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { COUNTRIES } from './countries';

@Component({
  selector: 'app-country-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
  ],
  templateUrl: './country-select.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CountrySelectComponent),
      multi: true,
    },
  ],
})
export class CountrySelectComponent implements ControlValueAccessor, OnInit {
  readonly searchControl = new FormControl<string>('');
  readonly countries = COUNTRIES;
  readonly filterText = signal<string>('');
  readonly isDisabled = signal<boolean>(false);

  readonly filteredCountries = computed(() => {
    const text = this.filterText().toLowerCase();
    if (!text) return this.countries;
    return this.countries.filter(
      (c) =>
        c.name.toLowerCase().includes(text) ||
        c.code.toLowerCase().includes(text),
    );
  });

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    this.searchControl.valueChanges.subscribe((value) => {
      this.filterText.set(value || '');
    });
  }

  writeValue(value: string): void {
    this.searchControl.setValue(value || '', { emitEvent: false });
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
    if (isDisabled) {
      this.searchControl.disable({ emitEvent: false });
    } else {
      this.searchControl.enable({ emitEvent: false });
    }
  }

  onOptionSelected(countryName: string): void {
    this.onChange(countryName);
    this.onTouched();
  }

  onBlur(): void {
    this.onTouched();
  }
}
