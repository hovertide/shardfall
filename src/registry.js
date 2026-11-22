'use strict';
/* =====================================================================
   SHARDFALL - registry.js
   The first file loaded. Creates the global SF namespace that every
   other file plugs into:

     SF.define('enemies', { slime: {...}, wolf: {...} })   add content
     SF.set('rules', {...})                                 set a singleton
     SF.data.enemies.slime                                  read content

   Content files (content/**) only ever call define/set. Engine files
   (src/engine/**) read SF.data. UI files (src/ui/**) read both.
   ===================================================================== */
var SF = (function () {
  // Every kind of content the game knows about. Adding a new kind = add it here.
  const KINDS = [
    'tiles', 'elements', 'regions', 'maps', 'enemies', 'moves', 'weapons', 'skills', 'spells',
    'items', 'shops', 'npcs', 'dialogues', 'quests', 'sprites', 'cosmetics',
  ];
  const SINGLETONS = ['rules', 'stats', 'rarity', 'pity'];

  const data = {};
  for (const k of KINDS) data[k] = {};

  const problems = [];   // filled by define() and validate.js
  let currentFile = '';

  function define(kind, entries) {
    if (!data[kind]) { problems.push(`[${currentFile}] unknown content kind "${kind}"`); return; }
    for (const [id, entry] of Object.entries(entries)) {
      if (data[kind][id]) problems.push(`[${currentFile}] duplicate ${kind} id "${id}" (first defined in ${data[kind][id].src})`);
      data[kind][id] = Object.assign({ id, src: currentFile }, entry);
      if (kind === 'sprites') prepSprite(data[kind][id]);
    }
  }

  // Sprites may be written as String.raw`...` blocks: turn them into arrays
  // of lines and strip the indentation they all share.
  function artLines(a) {
    if (Array.isArray(a)) return a.slice();
    const L = String(a).replace(/\r/g, '').split('\n');
    if (L.length && L[0].trim() === '') L.shift();                // newline after the opening backtick
    if (L.length && L[L.length - 1].trim() === '') L.pop();       // newline before the closing backtick
    return L.map((l) => l.replace(/\s+$/, ''));
  }
  function prepSprite(sp) {
    const frames = (sp.frames || [sp.art]).filter(Boolean).map(artLines);
    const indents = frames.flat().filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
    const cut = indents.length ? Math.min(...indents) : 0;
    sp.frames = frames.map((f) => f.map((l) => l.slice(cut)));
    sp.w = Math.max(0, ...sp.frames.flat().map((l) => l.length));
    sp.h = Math.max(0, ...sp.frames.map((f) => f.length));
    if (sp.bands && cut) sp.bands = sp.bands.map(([a, b, c]) => [a - cut, b - cut, c]);
  }

  function set(name, value) {
    if (!SINGLETONS.includes(name)) problems.push(`[${currentFile}] unknown singleton "${name}"`);
    data[name] = value;
  }

  /* ---------- Small helpers content files may use ---------- */
  const util = {
    // Repeat a string: rep('#', 10)
    rep: (s, n) => s.repeat(n),
    // Mirror a sprite left<->right (swaps / \ ( ) < > [ ] { }).
    mirror(lines) {
      const SW = { '/': '\\', '\\': '/', '(': ')', ')': '(', '<': '>', '>': '<', '[': ']', ']': '[', '{': '}', '}': '{', 'd': 'b', 'b': 'd', 'p': 'q', 'q': 'p' };
      const w = Math.max(...lines.map((l) => l.length));
      return lines.map((l) => [...l.padEnd(w)].reverse().map((c) => SW[c] || c).join(''));
    },
  };

  return {
    data, define, set, util, problems, KINDS,
    // The loader calls this before each file so error messages can name the file.
    _file(name) { currentFile = name; },
    E: {},    // engine internals (src/engine/*)
    UI: {},   // ui internals (src/ui/*)
  };
})();

if (typeof module !== 'undefined') module.exports = { SF };
