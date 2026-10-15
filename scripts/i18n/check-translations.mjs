// Lists UI text that has no translation yet, per language.
//   npm run i18n:check            -> report, exit 0
//   npm run i18n:check -- --strict -> exit 1 when anything is missing (for CI)
//
// Sources of translatable text:
//   1. `ng extract-i18n`  — i18n attributes in templates and $localize`…` in TypeScript
//   2. 'literal' | tr     — strings inside template expressions, which the extractor cannot see
// Both are matched to src/assets/i18n/app/<lang>.json by Angular message id.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = process.cwd();
const require = createRequire(path.join(root, 'package.json'));
const { computeMsgId } = await import(require.resolve('@angular/compiler'));
const LANGS = ['fr', 'it', 'rw'];
const strict = process.argv.includes('--strict');

// 1. extractor
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-'));
execFileSync('npx', ['ng', 'extract-i18n', '--format', 'json', '--output-path', tmp], { cwd: root, stdio: 'ignore' });
const messages = new Map(Object.entries(JSON.parse(fs.readFileSync(path.join(tmp, 'messages.json'), 'utf8')).translations));

// 2. `tr` pipe literals — 'text' | tr
const walk = (dir, out = []) => {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (/\.(html|ts)$/.test(f) && !f.endsWith('.spec.ts')) out.push(p);
  }
  return out;
};
for (const file of walk(path.join(root, 'src/app'))) {
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(/'((?:[^'\\]|\\.)*)'\s*\|\s*tr\b/g)) messages.set(computeMsgId(m[1], ''), m[1]);
}

// Text that is not prose (symbols, numbers, acronyms, emails, URLs) is intentionally left alone.
const needsTranslation = (t) =>
  /\p{L}{2,}/u.test(t.replace(/\{\$[A-Z_0-9a-z]+\}/g, ' ')) &&
  !/^\s*[A-Z0-9][A-Z0-9 /&+.-]{0,5}\s*$/.test(t) && // ERP, POS, API…
  !/@|^\s*https?:\/\//.test(t) &&                  // emails and URLs used as example placeholders
  !/^\s*(\{\$\w+\}\s*)?(KB|MB|OTA)\b/.test(t);       // units / brand tokens
const storefront = /^storefront\./;

let missingTotal = 0;
for (const lang of LANGS) {
  const file = path.join(root, `src/assets/i18n/app/${lang}.json`);
  const have = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')).translations : {};
  const missing = [...messages].filter(([id, text]) => !storefront.test(id) && needsTranslation(text) && !(id in have));
  missingTotal += missing.length;
  console.log(`\n${lang}: ${missing.length} missing`);
  missing.slice(0, 40).forEach(([id, text]) => console.log(`  ${id}  ${text.replace(/\s+/g, ' ').trim().slice(0, 100)}`));
  if (missing.length > 40) console.log(`  … and ${missing.length - 40} more`);
}
fs.rmSync(tmp, { recursive: true, force: true });
if (strict && missingTotal) process.exit(1);
