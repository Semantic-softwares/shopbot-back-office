import { exponentOf, fromMinor, parseMajor, sumRows, toMinor, varianceKind } from './register-money';

describe('register money on the screen', () => {
  it('converts between major and minor units without float dust', () => {
    expect(toMinor(11300, 2)).toBe(1130000);
    expect(toMinor(0.1 + 0.2, 2)).toBe(30);
    expect(toMinor(5000, 0)).toBe(5000);
    expect(fromMinor(1630050, 2)).toBe(16300.5);
  });

  it('knows which currencies have no minor unit', () => {
    expect(exponentOf('RWF')).toBe(0);
    expect(exponentOf('MUR')).toBe(2);
    expect(exponentOf(undefined)).toBe(2);
  });

  it('reads what a person types, including thousands separators and a decimal comma', () => {
    expect(parseMajor('1,250.50')).toBe(1250.5);
    expect(parseMajor('1250,50')).toBe(1250.5);
    expect(parseMajor(' 500 ')).toBe(500);
    expect(parseMajor('')).toBeNull();
    expect(parseMajor('abc')).toBeNull();
    expect(parseMajor('-5')).toBeNull();
  });

  it('adds a count of notes and coins and ignores nonsense quantities', () => {
    expect(sumRows([{ valueMinor: 100000, quantity: 4 }, { valueMinor: 50000, quantity: 5 }, { valueMinor: 100, quantity: -3 }, { valueMinor: 100, quantity: 2.9 }])).toBe(650200);
  });

  it('classifies a difference', () => {
    expect([varianceKind(0), varianceKind(-1), varianceKind(1)]).toEqual(['balanced', 'shortage', 'surplus']);
  });
});
