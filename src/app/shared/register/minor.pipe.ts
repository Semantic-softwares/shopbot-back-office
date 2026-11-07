import { Pipe, PipeTransform } from '@angular/core';
import { fromMinor } from './register-money';

/** Whole minor units (as the server holds register money) to the amount to show: `{{ x | minor: exponent | currency: symbol : 'symbol' : digits }}`. */
@Pipe({ name: 'minor' })
export class MinorPipe implements PipeTransform {
  transform(minor: number | null | undefined, exponent = 2): number | null {
    return minor === null || minor === undefined ? null : fromMinor(minor, exponent);
  }
}
