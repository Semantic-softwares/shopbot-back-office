import { Injectable } from '@angular/core';
import { storedAppLanguage } from '../i18n/app-languages';

export type ReleaseItemType = 'new' | 'improved' | 'fixed';
type Localised = Record<string, string>;

export interface ReleaseNotesFile { releases: { id: string; date: string; title: Localised; items: { type: ReleaseItemType; text: Localised }[] }[] }
export interface Release { id: string; date: string; title: string; items: { type: ReleaseItemType; text: string }[] }

const SEEN_KEY = 'shopbot.lastSeenRelease';

/**
 * What changed in each release. The list lives in `assets/release-notes.json`, newest first; add an entry at the top for every
 * deployment. It is read from the network (not the service-worker cache) so the app that is still running can show the notes of
 * the version that is about to replace it.
 */
@Injectable({ providedIn: 'root' })
export class ReleaseNotesService {
  /** Fetches the list in the person's language (English when a translation is missing). */
  async load(): Promise<Release[]> {
    try {
      const url = new URL('assets/release-notes.json', document.baseURI);
      url.searchParams.set('ngsw-bypass', 'true');
      url.searchParams.set('t', String(Date.now()));
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) return [];
      const file = (await res.json()) as ReleaseNotesFile;
      const lang = storedAppLanguage().code;
      const pick = (t: Localised) => t?.[lang] || t?.['en'] || '';
      return (file.releases ?? []).map((r) => ({ id: r.id, date: r.date, title: pick(r.title), items: (r.items ?? []).map((i) => ({ type: i.type, text: pick(i.text) })) }));
    } catch {
      return [];
    }
  }

  lastSeen(): string | null {
    try { return localStorage.getItem(SEEN_KEY); } catch { return null; }
  }

  markSeen(id: string | undefined): void {
    if (!id) return;
    try { localStorage.setItem(SEEN_KEY, id); } catch { /* private window: the list simply shows again next time */ }
  }

  /** Releases newer than the last one this person was shown. With none recorded, only the latest. */
  unseen(all: Release[]): Release[] {
    const seen = this.lastSeen();
    const at = seen ? all.findIndex((r) => r.id === seen) : -1;
    return at === -1 ? all.slice(0, 1) : all.slice(0, at);
  }
}
