/**
 * Store.selfOrderSettings.landingPage — the public home page at
 * store.shopbot.africa/<slug>. Read by shopbot-storefront's
 * store-landing/landing-page.ts, whose defaults these must match: blank
 * text fields fall back there too, so an untouched store and a store that
 * saved these defaults look the same.
 */
export interface LandingHighlight {
  icon: string;
  title: string;
  subtitle: string;
}

export interface LandingPageSettings {
  /** Blank = the store's name. */
  logoText: string;
  accentColor: string;
  backgroundType: 'image' | 'video';
  /** Blank = the store's banner. Also the video's still frame while it loads. */
  backgroundImage: string;
  backgroundVideo: string;
  /** Blank = no badge. */
  badgeText: string;
  headline: string;
  /** Second, accent-coloured headline line. Blank = no second line. */
  headlineAccent: string;
  /** Blank = the store description, or a generic line. */
  subtext: string;
  showOrderButton: boolean;
  orderButtonText: string;
  showMenuButton: boolean;
  menuButtonText: string;
  showHighlights: boolean;
  highlights: LandingHighlight[];
}

export const LANDING_HIGHLIGHT_ICONS: { value: string; label: string }[] = [
  { value: 'delivery_dining', label: 'Delivery' },
  { value: 'eco', label: 'Fresh' },
  { value: 'star', label: 'Rating' },
  { value: 'touch_app', label: 'Easy ordering' },
  { value: 'schedule', label: 'Fast' },
  { value: 'local_fire_department', label: 'Grill / hot' },
  { value: 'restaurant', label: 'Dining' },
  { value: 'local_cafe', label: 'Coffee' },
  { value: 'local_bar', label: 'Drinks' },
  { value: 'cake', label: 'Desserts' },
  { value: 'verified', label: 'Quality' },
  { value: 'favorite', label: 'Loved' },
  { value: 'payments', label: 'Payment' },
  { value: 'storefront', label: 'Pickup' },
];

export const DEFAULT_LANDING_PAGE: LandingPageSettings = {
  logoText: '',
  accentColor: '#f97316',
  backgroundType: 'image',
  backgroundImage: '',
  backgroundVideo: '',
  badgeText: '',
  headline: 'Fresh food,',
  headlineAccent: 'made with love',
  subtext: '',
  showOrderButton: true,
  orderButtonText: 'Order Now',
  showMenuButton: true,
  menuButtonText: 'View Menu',
  showHighlights: true,
  highlights: [
    { icon: 'delivery_dining', title: 'Fast delivery', subtitle: 'Straight to your door' },
    { icon: 'eco', title: 'Fresh ingredients', subtitle: 'Prepared to order' },
    { icon: 'touch_app', title: 'Easy ordering', subtitle: 'Done in a few taps' },
  ],
};

/** A saved (possibly partial or missing) value merged over the defaults. */
export function withLandingDefaults(saved?: Partial<LandingPageSettings> | null): LandingPageSettings {
  const merged = { ...DEFAULT_LANDING_PAGE, ...(saved ?? {}) };
  const highlights = saved?.highlights?.length ? saved.highlights : DEFAULT_LANDING_PAGE.highlights;
  // Always three rows to edit; a blank title hides that one on the page.
  const blank: LandingHighlight = { icon: 'star', title: '', subtitle: '' };
  merged.highlights = [0, 1, 2].map((i) => ({ ...blank, ...(highlights[i] as LandingHighlight | undefined) }));
  return merged;
}
