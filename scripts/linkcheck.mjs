// G1 link-check: scans every *.html in the repo (index.html, cases/*.html), extracts all href
// attributes, then:
//   - external (http/https) hrefs: fetched with `curl -sIL` (follow redirects) -> must return 200
//   - internal relative hrefs: must resolve to an existing file in the repo
//   - bare "#" stubs: always a failure (no dead controls ship)
// Run: node scripts/linkcheck.mjs
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { devNull } from 'node:os';

const root = resolve(import.meta.dirname, '..');

function htmlFiles(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    if (e.startsWith('.')) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...htmlFiles(p));
    else if (e.endsWith('.html')) out.push(p);
  }
  return out.sort();
}

const files = htmlFiles(root);
const hrefs = new Map(); // href -> [files]
for (const f of files) {
  for (const m of readFileSync(f, 'utf8').matchAll(/href="([^"]*)"/g)) {
    if (!hrefs.has(m[1])) hrefs.set(m[1], []);
    hrefs.get(m[1]).push(f.slice(root.length + 1));
  }
}

let fail = 0;
console.log('== G1 link-check ==');
console.log(`files scanned: ${files.length}\n`);

console.log('-- external hrefs (curl -sIL, must be 200) --');
for (const [href, where] of [...hrefs].filter(([h]) => /^https?:\/\//.test(h)).sort()) {
  const r = spawnSync('curl', ['-sIL', '-o', devNull, '-w', '%{http_code} %{url_effective}', '--max-time', '30', href], { encoding: 'utf8' });
  const line = `${r.status === 0 ? r.stdout.trim() : 'CURL-ERR (exit ' + r.status + ')'}  ${href}  [in: ${where.join(', ')}]`;
  console.log(line);
  if (r.status !== 0 || !r.stdout.trim().startsWith('200')) fail++;
}

console.log('\n-- other scheme hrefs --');
for (const [href, where] of [...hrefs].filter(([h]) => /^[a-z]+:/i.test(h) && !/^https?:\/\//.test(h)).sort()) {
  if (/^mailto:/i.test(href)) { console.log(`OK    ${href}  [in: ${where.join(', ')}]`); continue; }
  console.log(`FAIL  unrecognised scheme  ${href}  [in: ${where.join(', ')}]`); fail++;
}

console.log('\n-- internal hrefs (must resolve to a file or in-page anchor) --');
for (const [href, where] of [...hrefs].filter(([h]) => !/^[a-z]+:/i.test(h)).sort()) {
  if (href === '#') { console.log(`FAIL  "${href}" is a dead stub  [in: ${where.join(', ')}]`); fail++; continue; }
  const [path, anchor] = href.split('#');
  if (path) {
    const target = resolve(dirname(resolve(root, where[0])), path);
    if (!existsSync(target)) { console.log(`FAIL  missing file  ${href}  [in: ${where.join(', ')}]`); fail++; continue; }
  }
  console.log(`OK    ${href}  [in: ${where.join(', ')}]`);
}

console.log(`\nresult: ${fail === 0 ? 'PASS' : `FAIL (${fail} problem(s))`}`);
process.exit(fail === 0 ? 0 : 1);
