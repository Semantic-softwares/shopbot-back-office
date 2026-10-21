# Release notes ("What's new")

When a new version of the app is ready, a dialog lists what changed and lets the person update now or later. The same list is
available from the user menu (avatar → What's new).

**For every deployment, add an entry at the TOP of `src/assets/release-notes.json`:**

```json
{
  "id": "2026.10.22",
  "date": "2026-10-22",
  "title": { "en": "…", "fr": "…", "it": "…", "rw": "…" },
  "items": [
    { "type": "new",      "text": { "en": "…", "fr": "…", "it": "…", "rw": "…" } },
    { "type": "improved", "text": { "en": "…" } },
    { "type": "fixed",    "text": { "en": "…" } }
  ]
}
```

- `type` is `new`, `improved` or `fixed`. A language that is missing falls back to English.
- `id` must be unique; entries are shown newest first. Someone who skipped several updates sees every release since the last one
  they were shown, each with its own list.
- The file is fetched from the network (bypassing the service-worker cache), so the version that is still running can show the
  notes of the one about to replace it.
