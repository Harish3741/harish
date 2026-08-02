// Bundles the museum into a single self-contained HTML file.
//
// The site normally runs straight from source as ES modules, which is the nicer
// way to work on it. This exists for the places that want one file and no
// server: emailing it to someone, dropping it on a host that won't serve
// modules, or publishing it somewhere with a strict content policy.
//
//   node tools/build-standalone.mjs
//     -> dist/index.html    a complete page
//     -> dist/body.html     the same content without the document wrapper
//
// The bundle is a plain concatenation: imports and exports are stripped and
// every module shares one scope. That only works because no two modules declare
// the same top-level name — `npm run check-names`, below, is what enforces it.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Dependency order. A module may only use names declared above it.
const MODULES = [
  'config',
  'data/projects',
  'font',
  'art',
  'map',
  'renderer',
  'input',
  'player',
  'picture',
  'menu',
  'listview',
  'screening',
  'intro',
  'main',
];

const IMPORT_RE = /^import\s[\s\S]*?from\s+'[^']+';\s*$/gm;
const EXPORT_RE = /^export\s+(const|let|var|function|class|async)\b/gm;

// A `let a, b, c;` declares three names, and an earlier version of this only
// saw the first — which let two modules both declare `titleEl` and the bundle
// died at runtime with "already been declared". So capture the whole declarator
// list and pull every identifier out of it.
const DECL_LIST_RE = /^(?:export\s+)?(?:const|let|var)\s+([^=;\n]+)/gm;
const FN_RE = /^(?:export\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/gm;
const CLASS_RE = /^(?:export\s+)?class\s+([A-Za-z_$][\w$]*)/gm;
const IDENT_RE = /[A-Za-z_$][\w$]*/g;

function declarations(src) {
  const names = new Set();
  for (const m of src.matchAll(DECL_LIST_RE)) {
    for (const id of m[1].matchAll(IDENT_RE)) names.add(id[0]);
  }
  for (const re of [FN_RE, CLASS_RE]) {
    for (const m of src.matchAll(re)) names.add(m[1]);
  }
  return names;
}

async function loadModules() {
  const out = [];
  for (const name of MODULES) {
    const raw = await readFile(join(ROOT, 'src', `${name}.js`), 'utf8');
    out.push({ name, raw });
  }
  return out;
}

/** Throws if two modules declare the same top-level name. */
function assertNoCollisions(modules) {
  const owner = new Map();
  const clashes = [];
  for (const { name, raw } of modules) {
    const body = raw.replace(IMPORT_RE, '');
    for (const decl of declarations(body)) {
      if (owner.has(decl)) clashes.push(`${decl}: ${owner.get(decl)} and ${name}`);
      else owner.set(decl, name);
    }
  }
  if (clashes.length) {
    throw new Error(
      'Top-level names collide, so the modules cannot share one scope:\n  '
      + clashes.join('\n  ')
      + '\nRename one of each pair, then build again.'
    );
  }
}

function bundle(modules) {
  return modules
    .map(({ name, raw }) => {
      const body = raw.replace(IMPORT_RE, '').replace(EXPORT_RE, '$1').trim();
      return `/* ===== src/${name}.js ===== */\n${body}`;
    })
    .join('\n\n');
}

/** Pull the markup out of index.html, minus the module script tag. */
function extractBody(html) {
  const body = html.slice(
    html.indexOf('<body>') + '<body>'.length,
    html.indexOf('</body>')
  );
  return body.replace(/^\s*<script\s+type="module"[^>]*><\/script>\s*$/m, '').trim();
}

// Pictures are referenced by path, which is right for the served folder and
// useless in a single file — a bundle that fetches three PNGs off a relative
// path isn't self-contained. So every 'img/…' the content file mentions is read
// off disk and inlined as a data URI. A path with no file behind it is left
// alone and warned about; the page falls back to its dashed slot, which is what
// a picture that hasn't arrived yet is supposed to look like.
// The extension is part of the pattern on purpose, so prose in a comment —
// `image: 'img/…'` in the instructions at the top of the content file — is not
// mistaken for a picture that failed to turn up.
const IMG_RE = /'(img\/[^']+\.(?:png|jpe?g|gif|webp|avif|svg))'/gi;
const MIME = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
};

async function inlineImages(src) {
  const paths = [...new Set([...src.matchAll(IMG_RE)].map((m) => m[1]))];
  const missing = [];
  let out = src;
  let bytes = 0;

  for (const path of paths) {
    const mime = MIME[extname(path).toLowerCase()];
    if (!mime) {
      missing.push(`${path} (unknown image type)`);
      continue;
    }
    let data;
    try {
      data = await readFile(join(ROOT, path));
    } catch {
      missing.push(path);
      continue;
    }
    bytes += data.length;
    const uri = `data:${mime};base64,${data.toString('base64')}`;
    out = out.split(`'${path}'`).join(`'${uri}'`);
  }

  return { out, count: paths.length - missing.length, missing, bytes };
}

function extractHead(html) {
  return html.slice(html.indexOf('<head>') + '<head>'.length, html.indexOf('</head>'))
    .replace(/^\s*<link\s+rel="stylesheet"[^>]*>\s*$/m, '')
    .trim();
}

const [html, css, modules] = await Promise.all([
  readFile(join(ROOT, 'index.html'), 'utf8'),
  readFile(join(ROOT, 'styles.css'), 'utf8'),
  loadModules(),
]);

assertNoCollisions(modules);

const pictures = await inlineImages(bundle(modules));

const content = [
  `<style>\n${css.trim()}\n</style>`,
  extractBody(html),
  `<script type="module">\n${pictures.out}\n</script>`,
].join('\n\n');

const page = `<!DOCTYPE html>
<html lang="en">
<head>
${extractHead(html)}
</head>
<body>

${content}

</body>
</html>
`;

await mkdir(join(ROOT, 'dist'), { recursive: true });
await writeFile(join(ROOT, 'dist', 'index.html'), page);
await writeFile(join(ROOT, 'dist', 'body.html'), `${content}\n`);

const kb = (Buffer.byteLength(page) / 1024).toFixed(1);
console.log(`dist/index.html  ${kb} KB  (${modules.length} modules, no dependencies)`);

if (pictures.count) {
  const picKb = (pictures.bytes / 1024).toFixed(1);
  console.log(`  ${pictures.count} picture(s) inlined, ${picKb} KB of it`);
}
for (const path of pictures.missing) {
  console.warn(`  ! no file at ${path} — it will show as an empty slot`);
}
