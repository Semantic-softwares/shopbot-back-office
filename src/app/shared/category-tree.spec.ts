import { Category } from './models/category.model';
import { childrenOf, flatTree, groups, idsUnder, pathLabel, topLevel } from './category-tree';

describe('category tree helpers', () => {
  const all: Category[] = [
    { _id: 'd', name: 'Drinks' },
    { _id: 'f', name: 'Food', parent: null },
    { _id: 'w', name: 'Whisky', parent: 'd' },
    { _id: 'b', name: 'Beers', parent: 'd' },
    { _id: 'x', name: 'Stray', parent: 'gone' },
  ];

  it('top level are the categories without a known parent (a stray sub-category is kept, not lost)', () => {
    expect(topLevel(all).map((c) => c._id)).toEqual(['d', 'f', 'x']);
  });

  it('children of a category, none for one without', () => {
    expect(childrenOf(all, 'd').map((c) => c._id)).toEqual(['w', 'b']);
    expect(childrenOf(all, 'f')).toEqual([]);
    expect(childrenOf(all, null)).toEqual([]);
  });

  it('ids under a top-level category include itself and its sub-categories', () => {
    expect(idsUnder(all, 'd')).toEqual(['d', 'w', 'b']);
    expect(idsUnder(all, 'f')).toEqual(['f']);
    expect(idsUnder(all, undefined)).toEqual([]);
  });

  it('labels sub-categories with their parent', () => {
    expect(pathLabel(all, 'w')).toBe('Drinks › Whisky');
    expect(pathLabel(all, 'd')).toBe('Drinks');
    expect(pathLabel(all, 'x')).toBe('Stray');
    expect(pathLabel(all, 'nope')).toBe('');
  });

  it('flattens for display with depth, children under their parent', () => {
    expect(flatTree(all).map((r) => `${r.depth}:${r.category.name}`)).toEqual(['0:Drinks', '1:Whisky', '1:Beers', '0:Food', '0:Stray']);
    expect(groups(all)[0].children).toHaveLength(2);
  });
});
