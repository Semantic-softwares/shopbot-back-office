import { denominationsFor } from './register-denominations';

describe('denominations on the screen', () => {
  it('lists MUR notes and coins, highest first', () => {
    const mur = denominationsFor('MUR');
    expect(mur[0]).toEqual({ valueMinor: 200000, kind: 'note' });
    expect(mur.map((d) => d.valueMinor)).toEqual([...mur.map((d) => d.valueMinor)].sort((a, b) => b - a));
    expect(mur.some((d) => d.kind === 'coin' && d.valueMinor === 100)).toBe(true);
  });

  it('is currency-aware: RWF has no minor unit, unknown currencies still get a list, a store override wins', () => {
    expect(denominationsFor('RWF')[0]).toEqual({ valueMinor: 5000, kind: 'note' });
    expect(denominationsFor('XYZ').length).toBeGreaterThan(5);
    expect(denominationsFor('MUR', [{ valueMinor: 7, kind: 'coin' }])).toEqual([{ valueMinor: 7, kind: 'coin' }]);
  });
});
