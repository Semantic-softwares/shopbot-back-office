import { isMauritiusStore } from './blink-context.service';
import { normaliseMauritiusMobile } from './blink.models';

describe('Blink mobile numbers (Mauritius)', () => {
  it('accepts 8 digits starting with 5, with or without +230 and spaces', () => {
    expect(normaliseMauritiusMobile('5858 0000')).toBe('58580000');
    expect(normaliseMauritiusMobile('+230 5858 0000')).toBe('58580000');
    expect(normaliseMauritiusMobile('230-5858-0000')).toBe('58580000');
  });
  it('refuses anything else', () => {
    for (const bad of ['', '1234', '4858 0000', '5858 000', '5858 00000', 'abcdefgh']) expect(normaliseMauritiusMobile(bad)).toBeNull();
  });
});

describe('Blink is for Mauritius stores in rupees only', () => {
  it('accepts Mauritius with MUR', () => {
    expect(isMauritiusStore({ country: 'Mauritius', currencyCode: 'MUR' })).toBeTrue();
    expect(isMauritiusStore({ country: ' mauritius ', currencyCode: 'mur' })).toBeTrue();
    expect(isMauritiusStore({ country: '', currencyCode: 'MUR', contactInfo: { country: 'MU' } })).toBeTrue();
  });
  it('refuses other countries, other currencies and missing data', () => {
    expect(isMauritiusStore({ country: 'Rwanda', currencyCode: 'MUR' })).toBeFalse();
    expect(isMauritiusStore({ country: 'Mauritius', currencyCode: 'USD' })).toBeFalse();
    expect(isMauritiusStore({ country: 'Mauritius' })).toBeFalse();
    expect(isMauritiusStore(null)).toBeFalse();
  });
});
