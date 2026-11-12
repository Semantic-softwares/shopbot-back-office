
export interface Category  {
    _id?: string;
    name: string;
    activate?: boolean;
    position?: number;
    color?: string;
    icon?: string;
    items?: number;
    /** The top-level category this is a sub-category of; null/absent for a top-level category. */
    parent?: string | null;
    /** How many sub-categories it has (top-level only). */
    childCount?: number;
    /** Products placed directly in it plus in its sub-categories. */
    totalItems?: number;
  }