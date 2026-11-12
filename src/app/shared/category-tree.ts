import { Category } from './models/category.model';

/**
 * Categories come as one flat list; a sub-category carries the id of its parent. Two levels only.
 * These pure helpers turn the list into what each screen needs. A sub-category whose parent is missing from the list
 * (for example a stale offline copy) is treated as top-level so nothing disappears.
 */

const parentId = (c: Category): string | null => (c.parent ? String(c.parent) : null);

/** Categories shown in the first row: those without a (known) parent. */
export function topLevel(all: Category[]): Category[] {
  const ids = new Set(all.map((c) => c._id));
  return all.filter((c) => !parentId(c) || !ids.has(parentId(c)!));
}

/** The sub-categories of one category, in the order they came. */
export function childrenOf(all: Category[], id: string | null | undefined): Category[] {
  if (!id) return [];
  return all.filter((c) => parentId(c) === id);
}

/** The id of a top-level category and of each of its sub-categories: the products "under" it. */
export function idsUnder(all: Category[], id: string | null | undefined): string[] {
  if (!id) return [];
  return [id, ...childrenOf(all, id).map((c) => c._id!)];
}

/** "Drinks › Whisky" for a sub-category, the plain name otherwise. */
export function pathLabel(all: Category[], idOrCategory: string | Category | null | undefined): string {
  const c = typeof idOrCategory === 'string' ? all.find((x) => x._id === idOrCategory) : idOrCategory;
  if (!c) return '';
  const p = parentId(c) ? all.find((x) => x._id === parentId(c)) : undefined;
  return p ? `${p.name} › ${c.name}` : c.name;
}

export interface CategoryGroup {
  /** The top-level category. */
  parent: Category;
  /** Its sub-categories (empty when it has none). */
  children: Category[];
}

/** Top-level categories each with their sub-categories: what grouped pickers and the Categories page show. */
export function groups(all: Category[]): CategoryGroup[] {
  return topLevel(all).map((parent) => ({ parent, children: childrenOf(all, parent._id) }));
}

/** The groups flattened to display order, children right after their parent, with a depth for indenting. */
export function flatTree(all: Category[]): Array<{ category: Category; depth: 0 | 1 }> {
  return groups(all).flatMap((g) => [{ category: g.parent, depth: 0 as const }, ...g.children.map((c) => ({ category: c, depth: 1 as const }))]);
}
