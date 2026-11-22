'use strict';
/* =====================================================================
   SHARDFALL engine - validate.js
   Checks every cross-reference in the content once at startup, so a
   typo in an id shows up as a clear message instead of a crash later.
   Problems go to SF.problems (and the browser console). Run
   `node tools/check.js` to see them without opening the game.
   ===================================================================== */
(function () {
  const D = SF.data, P = SF.problems;
  const has = (kind, id) => !!(D[kind] && D[kind][id]);
  const where = (x) => (x && x.src ? `[${x.src}] ` : '');
  const bad = (x, msg) => P.push(where(x) + msg);

  // --- maps ---
  const KINDS = ['go', 'npc', 'shrine', 'chest', 'stone', 'vista', 'sign', 'boss', 'secret'];
  for (const [mk, m] of Object.entries(D.maps)) {
    if (!Array.isArray(m.rows) || !m.rows.length) { bad(m, `map "${mk}" has no rows`); continue; }
    const W = m.rows[0].length;
    m.rows.forEach((row, y) => { if (row.length !== W) bad(m, `map "${mk}" row ${y} is ${row.length} wide, expected ${W}`); });
    const legend = m.legend || {};
    for (const [ch, o] of Object.entries(legend)) {
      if (D.tiles[ch]) bad(m, `map "${mk}" legend "${ch}" shadows a terrain tile; pick another letter`);
      const kind = KINDS.find((k) => o[k] != null);
      if (!kind) bad(m, `map "${mk}" legend "${ch}" has no known type (${KINDS.join(', ')})`);
      if (o.npc && !has('npcs', o.npc)) bad(m, `map "${mk}" legend "${ch}": unknown npc "${o.npc}"`);
      if (o.boss && !has('enemies', o.boss)) bad(m, `map "${mk}" legend "${ch}": unknown boss "${o.boss}"`);
      if (o.chest) {
        const c = o.chest;
        if (c.item && !has('items', c.item)) bad(m, `map "${mk}" chest: unknown item "${c.item}"`);
        if (c.weapon && !has('weapons', c.weapon)) bad(m, `map "${mk}" chest: unknown weapon "${c.weapon}"`);
        if (c.learn && !has('skills', c.learn) && !has('spells', c.learn)) bad(m, `map "${mk}" chest: unknown ability "${c.learn}"`);
      }
      if (o.go) {
        const [to, mark] = String(o.go).split(':');
        const dm = D.maps[to];
        if (!dm) bad(m, `map "${mk}" legend "${ch}": goes to unknown map "${to}"`);
        else if (!dm.rows.some((r) => r.includes(mark))) bad(m, `map "${mk}" legend "${ch}": map "${to}" has no "${mark}" marker`);
        else if (!(dm.legend && dm.legend[mark] && String(dm.legend[mark].go).split(':')[0] === mk)) {
          bad(m, `map "${mk}" -> "${to}": the "${mark}" marker in "${to}" doesn't lead back here`);
        }
      }
    }
    m.rows.forEach((row, y) => [...row].forEach((ch, x) => {
      if (!D.tiles[ch] && !legend[ch]) bad(m, `map "${mk}" unknown character "${ch}" at ${x},${y}`);
    }));
    for (const [ek] of m.enc || []) if (!has('enemies', ek)) bad(m, `map "${mk}" encounter: unknown enemy "${ek}"`);
    if (m.region && !has('regions', m.region)) bad(m, `map "${mk}": unknown region "${m.region}"`);
  }
  for (const [rk, r] of Object.entries(D.regions)) {
    for (const mk of r.levels || []) if (!D.maps[mk]) bad(r, `region "${rk}" lists unknown map "${mk}"`);
  }
  if (!D.maps[D.rules.start.map] || !D.maps[D.rules.start.map].start) P.push(`rules.start.map "${D.rules.start.map}" must be a map with a start: [x, y]`);

  // --- combat content ---
  for (const [id, e] of Object.entries(D.enemies)) {
    const lists = [e.moves].concat(e.phase2 ? [e.phase2.moves] : []);
    for (const list of lists) for (const [mv] of list || []) if (!has('moves', mv)) bad(e, `enemy "${id}": unknown move "${mv}"`);
    if (!has('sprites', e.sprite || id)) bad(e, `enemy "${id}": no sprite "${e.sprite || id}"`);
    for (const el of [].concat(e.weak || [], e.resist || [])) if (!has('elements', el)) bad(e, `enemy "${id}": unknown element "${el}"`);
  }
  for (const [id, mv] of Object.entries(D.moves)) {
    if (mv.then && !has('moves', mv.then)) bad(mv, `move "${id}": "then" points to unknown move "${mv.then}"`);
  }
  for (const [id, w] of Object.entries(D.weapons)) {
    if (!has('sprites', w.sprite || id)) bad(w, `weapon "${id}": no sprite "${w.sprite || id}"`);
  }
  for (const tbl of ['skills', 'spells']) {
    for (const [id, x] of Object.entries(D[tbl])) if (x.el && !has('elements', x.el)) bad(x, `${tbl} "${id}": unknown element "${x.el}"`);
  }
  for (const [id, n] of Object.entries(D.npcs)) {
    if (n.dialog && !has('dialogues', n.dialog)) bad(n, `npc "${id}": unknown dialogue "${n.dialog}"`);
    if (n.shop && !has('shops', n.shop)) bad(n, `npc "${id}": unknown shop "${n.shop}"`);
  }
  for (const [id, sh] of Object.entries(D.shops)) {
    for (const it of sh.stock) if (!has('items', it) && !has('weapons', it)) bad(sh, `shop "${id}": unknown item "${it}"`);
  }
  for (const [id, dl] of Object.entries(D.dialogues)) {
    for (const en of dl.entry) if (!dl.nodes[en.node]) bad(dl, `dialogue "${id}": entry node "${en.node}" missing`);
    for (const [nk, node] of Object.entries(dl.nodes)) {
      for (const c of node.choices) {
        if (c.go && !dl.nodes[c.go]) bad(dl, `dialogue "${id}" node "${nk}": goes to missing node "${c.go}"`);
        for (const op of c.do || []) {
          const [k, v] = op.split(':');
          if (['accept', 'ready', 'turnin'].includes(k) && !has('quests', v)) bad(dl, `dialogue "${id}": unknown quest "${v}"`);
        }
      }
    }
  }
  for (const [id, q] of Object.entries(D.quests)) {
    if (q.kill && !D.maps[q.kill.map]) bad(q, `quest "${id}": unknown map "${q.kill.map}"`);
  }

  // --- sprites ---
  for (const [id, sp] of Object.entries(D.sprites)) {
    const frames = sp.frames || [sp.art];
    if (!frames[0]) { bad(sp, `sprite "${id}" has no art`); continue; }
    for (const f of frames) for (const ln of f) {
      if (/[^\x20-\x7e]/.test(ln)) bad(sp, `sprite "${id}" uses a non-ASCII character: "${ln}"`);
    }
    if (sp.mask) {
      const m = sp.mask;
      if (m.length !== frames[0].length) bad(sp, `sprite "${id}" mask has ${m.length} rows, art has ${frames[0].length}`);
      m.forEach((ln, k) => {
        for (const ch of ln) if (ch !== ' ' && !(sp.palette || {})[ch]) bad(sp, `sprite "${id}" mask uses "${ch}" with no palette color`);
        if (frames[0][k] && ln.length > frames[0][k].length) bad(sp, `sprite "${id}" mask row ${k} is longer than the art row`);
      });
    }
  }

  for (const msg of P) console.warn('[content]', msg);
})();
