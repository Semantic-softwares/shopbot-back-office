import { Pipe, PipeTransform } from '@angular/core';

/**
 * Translates a string that lives inside a template expression, where the
 * `i18n` attribute can't reach — e.g. `[title]="isEdit ? 'Edit' : 'New'"`.
 *
 * It goes through the same $localize lookup as every other message, so the
 * strings are translated by id from the same language file. The language is
 * fixed for the lifetime of the page (changing it reloads), so the pipe is pure.
 *
 * Strings that have no translation (including data that merely passes through,
 * like a product name) come back unchanged.
 */
// Reached through globalThis on purpose: `ng extract-i18n` statically scans for `$localize(...)`
// calls and rejects one whose argument isn't a literal template. This lookup is by design
// dynamic; the strings it translates are collected separately (see the i18n docs).
const runtimeLocalize = (globalThis as any)['$localize'] as (parts: TemplateStringsArray) => string;

@Pipe({ name: 'tr', standalone: true })
export class TrPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return value ?? '';
    // A leading ":" would be read by $localize as the start of message metadata.
    if (value.startsWith(':')) return value;
    return runtimeLocalize(Object.assign([value], { raw: [value] }) as unknown as TemplateStringsArray);
  }
}
