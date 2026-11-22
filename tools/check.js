'use strict';
/* =====================================================================
   node tools/check.js         full check (content, maps, fuzz test)
   node tools/check.js quick   skip the fuzz test

   1. every file in manifest.js exists, and no script is missing from it
   2. content cross-references (src/engine/validate.js)
   3. no emoji or non-ASCII characters in content (art must be pure ASCII)
   4. every chest, stone, person and exit on every map can be reached
   5. fuzz: thousands of random actions in random games must never crash
   ===================================================================== */
const fs = require('fs');
const path = require('path');
const { SF, Engine, manifest, root } = require('./load.js')();

let errors = 0;
const err = (m) => { errors++; console.log('  x ' + m); };
const ok = (m) => console.log('  ok ' + m);

/* 1. manifest */
console.log('Manifest');
const listed = new Set([].concat(manifest.content, manifest.engine, manifest.ui));
for (const f of listed) if (!fs.existsSync(path.join(root, f))) err(`listed but missing: ${f}`);
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
for (const dir of ['content', 'src/engine', 'src/ui']) {
  for (const f of walk(path.join(root, dir))) {
    const rel = path.relative(root, f).split(path.sep).join('/');
    if (rel.endsWith('.js') && !listed.has(rel)) err(`not in manifest.js (never loaded): ${rel}`);
  }
}
ok(`${listed.size} files`);

/* 2. content references */
console.log('Content');
for (const p of SF.problems) err(p);
const D = SF.data;
ok(`${Object.keys(D.maps).length} maps, ${Object.keys(D.enemies).length} enemies, ${Object.keys(D.moves).length} moves, ` +
  `${Object.keys(D.weapons).length} weapons, ${Object.keys(D.skills).length + Object.keys(D.spells).length} abilities, ${Object.keys(D.sprites).length} sprites`);

/* 3. characters */
console.log('Characters');
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
for (const f of listed) {
  if (!fs.existsSync(path.join(root, f))) continue;
  const txt = fs.readFileSync(path.join(root, f), 'utf8');
  txt.split('\n').forEach((line, i) => {
    if (EMOJI.test(line)) err(`${f}:${i + 1} emoji-capable character: ${line.trim().slice(0, 60)}`);
    else if (f.startsWith('content/') && /[^\x00-\x7e]/.test(line)) err(`${f}:${i + 1} non-ASCII character: ${line.trim().slice(0, 60)}`);
  });
}
ok('no emoji anywhere; content is pure ASCII');

/* 4. reachability */
console.log('Maps');
const E = SF.E;
for (const [mk, M] of Object.entries(E.MAPS)) {
  const fake = { world: { gone: {}, used: {}, seen: {} } };
  const W = M.W, H = M.H, seen = new Uint8Array(W * H), q = [];
  const walkable = (x, y) => {
    const t = E.terrain(M, x, y), o = M.objs[x + ',' + y];
    if (o) return o.kind === 'go' || o.kind === 'secret' || o.kind === 'boss';   // bosses vanish once beaten
    return !t.block;
  };
  const push = (x, y) => { const i = y * W + x; if (!seen[i]) { seen[i] = 1; q.push([x, y]); } };
  // start from every entrance (and the start point)
  for (const o of Object.values(M.objs)) if (o.kind === 'go') push(o.x, o.y);
  if (M.def.start) push(M.def.start[0], M.def.start[1]);
  for (let k = 0; k < q.length; k++) {
    const [x, y] = q[k];
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const t = E.terrain(M, nx, ny);
      if (t.ledge) { if (dy === 1 && walkable(nx, ny + 1)) push(nx, ny + 1); continue; }
      if (walkable(nx, ny)) push(nx, ny);
    }
  }
  let bad = 0;
  for (const o of Object.values(M.objs)) {
    const reach = seen[o.y * W + o.x] || [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => {
      const x = o.x + dx, y = o.y + dy;
      return x >= 0 && y >= 0 && x < W && y < H && seen[y * W + x];
    });
    if (!reach) { bad++; err(`${mk}: ${o.kind} "${o.ch}" at ${o.x},${o.y} can't be reached`); }
  }
  void fake;
  if (!bad) ok(`${mk} (${W}x${H}): all ${Object.keys(M.objs).length} objects reachable`);
}

/* 5. fuzz */
if (process.argv[2] !== 'quick') {
  console.log('Fuzz');
  const STATS = D.stats.map((s) => s.k);
  let actions = 0, fights = 0, deaths = 0, levels = 0;
  const pick = (a, r) => a[Math.floor(r() * a.length)];
  for (let g = 0; g < 40; g++) {
    let seed = 1000 + g;
    const r = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    const alloc = {}; alloc[pick(STATS, r)] = 3;
    let s = Engine.newGame({ name: 'Fuzz', seed: g, alloc });
    for (let step = 0; step < 4000; step++) {
      const sc = s.scene, p = s.p;
      let a;
      if (sc === 'explore') {
        const x = r();
        if (x < 0.03 && p.points) a = { type: 'alloc', stat: pick(STATS, r) };
        else if (x < 0.05) a = { type: 'use', id: pick(Object.keys(D.items), r) };
        else if (x < 0.06) {   // teleport around to cover every map
          const mk = pick(Object.keys(D.maps), r), M = E.MAPS[mk];
          const spots = Object.values(M.objs).filter((o) => o.kind === 'go');
          const o = pick(spots, r);
          p.map = mk; p.x = o.x; p.y = o.y;
          const n = [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([dx, dy]) => [o.x + dx, o.y + dy]).find(([x, y]) => !E.terrain(M, x, y).block && !M.objs[x + ',' + y]);
          if (n) [p.x, p.y] = n;
          E.invalidateFov();
          continue;
        } else a = { type: 'move', dx: pick([-1, 0, 1], r), dy: pick([-1, 0, 1], r) };
      } else if (sc === 'combat') {
        const ab = Engine.abilities(s), x = r(), target = Math.floor(r() * 3), q = pick(['perfect', 'good', 'weak'], r);
        if (x < 0.4) a = { type: 'attack', target, q };
        else if (x < 0.55) a = { type: 'skill', id: pick(ab.skills, r).id, target, q };
        else if (x < 0.75) a = { type: 'spell', id: pick(ab.spells, r).id, target };
        else if (x < 0.85) a = { type: 'defend' };
        else if (x < 0.92) a = { type: 'use', id: pick(Object.keys(D.items), r) };
        else a = { type: 'flee' };
        if (p.hp < 25 && p.inv.hp_potion) a = { type: 'use', id: 'hp_potion' };
      } else if (sc === 'dialog') a = { type: 'choose', i: Math.floor(r() * 4) };
      else if (sc === 'shop') a = r() < 0.6 ? { type: 'buy', id: pick(D.shops.bram.stock, r) } : r() < 0.5 ? { type: 'sell', id: pick(Object.keys(D.items), r) } : { type: 'leave' };
      else if (sc === 'shrine') a = r() < 0.5 ? { type: 'pull', n: pick([1, 10], r) } : { type: 'leave' };
      else if (sc === 'gameover') { a = { type: 'respawn' }; deaths++; }
      const before = s.scene;
      let res;
      try { res = Engine.act(s, a); } catch (e) {
        err(`game ${g} step ${step}: ${JSON.stringify(a)} in ${sc} threw ${e.stack.split('\n').slice(0, 3).join(' | ')}`);
        break;
      }
      actions++;
      if (before !== 'combat' && s.scene === 'combat') fights++;
      for (const f of res.fx) if (f.t === 'level') levels++;
      const d = Engine.derived(s.p);
      if (!(s.p.hp <= d.maxHp) || Number.isNaN(s.p.hp) || s.p.gold < 0 || Number.isNaN(s.p.xp)) {
        err(`game ${g} step ${step}: bad state hp=${s.p.hp}/${d.maxHp} gold=${s.p.gold} xp=${s.p.xp} after ${JSON.stringify(a)}`);
        break;
      }
      if (step % 500 === 0) s = Engine.load(Engine.save(s));   // save/load round trip
    }
  }
  ok(`${actions} actions, ${fights} fights, ${deaths} deaths, ${levels} level-ups, no crashes`);
}

console.log(errors ? `\n${errors} problem(s) found.` : '\nAll checks passed.');
process.exit(errors ? 1 : 0);
