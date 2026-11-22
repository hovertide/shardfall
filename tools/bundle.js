'use strict';
/* =====================================================================
   node tools/bundle.js
   Packs the whole game into ONE html file (dist/shardfall.html) that you
   can send to someone or upload anywhere. Development still happens in
   the separate files; this is only for sharing.
   ===================================================================== */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const { SHARDFALL_MANIFEST: M } = require(path.join(root, 'manifest.js'));

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/<\/script/gi, '<\\/script');
const files = [].concat(M.content, M.engine, M.ui);
let js = read('src/registry.js') + '\n';
for (const f of files) js += `SF._file(${JSON.stringify(f)});\n${read(f)}\n`;

const out = html.replace(/<script src="manifest\.js"><\/script>[\s\S]*<script src="src\/boot\.js"><\/script>/,
  () => `<script>\n${js}</script>`);   // (function form: game code contains "$" patterns)
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'shardfall.html'), out);
console.log(`dist/shardfall.html  (${files.length + 1} files, ${Math.round(out.length / 1024)} KB)`);
