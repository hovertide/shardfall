'use strict';
/* =====================================================================
   SHARDFALL engine - state.js
   New game, save and load. The whole game is one JSON object, so a save
   is just JSON.stringify(state). Old saves are migrated when possible.
   ===================================================================== */
(function () {
  const E = SF.E, D = E.D, R = E.R;
  const SAVE_VERSION = 2;
  E.SAVE_VERSION = SAVE_VERSION;

  E.newGame = function (opts = {}) {
    const seed = (opts.seed == null ? Date.now() : opts.seed) >>> 0;
    const stats = {};
    let used = 0;
    for (const { k } of D.stats) {
      const a = Math.max(0, Math.floor(Number((opts.alloc || {})[k]) || 0));
      stats[k] = R.baseStat + a;
      used += a;
    }
    if (used > R.startPoints) throw new Error(`Allocated ${used} points, max is ${R.startPoints}`);
    const look = {};
    for (const c of Object.values(D.cosmetics)) if (c.def) look[c.type] = c.id;
    const start = D.maps[R.start.map];
    const p = {
      name: String(opts.name || '').replace(/[{}%<>]/g, '').trim().slice(0, 14) || 'Wanderer',
      lvl: 1, xp: 0, points: R.startPoints - used, stats,
      hp: 0, st: 0, sp: 0, san: R.maxSanity,
      gold: R.startGold, shards: R.startShards,
      weapon: R.start.weapon, weapons: [R.start.weapon],
      inv: Object.assign({}, R.start.inv),
      quests: {}, flags: {}, known: {}, journal: {}, visited: {}, poison: null, stones: 0,
      cos: Object.values(D.cosmetics).filter((c) => c.def).map((c) => c.id), look, pity: { e: 0, l: 0 },
      map: R.start.map, x: start.start[0], y: start.start[1],
      acc: { hp: 0, st: 0, sp: 0, san: 0 }, grace: 0,
      kills: 0, steps: 0, deaths: 0, pulls: 0,
    };
    const d = E.derived(p);
    p.hp = d.maxHp; p.st = d.maxSt; p.sp = d.maxSp;
    p.visited[R.start.map] = 1;
    const s = { v: SAVE_VERSION, seed, rng: seed | 0, scene: 'explore', p,
      world: { gone: {}, used: {}, seen: {} }, combat: null, dialog: null, shop: null, dead: null, log: [] };
    E.invalidateFov();
    E.reveal(s);
    E.log(s, '{d}Three nights ago, the sky cracked like ice.{/}');
    E.log(s, `You wake beside the fountain of {y}Emberhollow{/}, ${p.name}. You remember your name, and nothing else.`);
    E.log(s, 'Elder Maren ({y}&{/}) is waiting nearby. Walk into people to talk to them.');
    return s;
  };

  E.save = (s) => JSON.stringify(s);

  E.load = function (json) {
    let s = typeof json === 'string' ? JSON.parse(json) : json;
    if (!s || !s.p) throw new Error('Not a Shardfall save');
    if (s.v === 1) s = migrateV1(s);
    if (s.v !== SAVE_VERSION) throw new Error(`Save version ${s.v} is not supported`);
    const p = s.p;
    s.world = Object.assign({ gone: {}, used: {}, seen: {} }, s.world);
    for (const k of ['quests', 'flags', 'known', 'journal', 'visited', 'inv']) p[k] = p[k] || {};
    s.log = s.log || [];
    if (!D.maps[p.map]) { p.map = R.start.map; [p.x, p.y] = D.maps[R.start.map].start; }
    if (!D.weapons[p.weapon]) p.weapon = R.start.weapon;
    p.weapons = (p.weapons || []).filter((w) => D.weapons[w]);
    if (!p.weapons.length) p.weapons = [R.start.weapon];
    if (s.scene === 'combat' && !s.combat) s.scene = 'explore';
    E.invalidateFov();
    E.reveal(s);
    return s;
  };

  // Version 1 saves came from the old 4-file build. Maps were redrawn, so
  // keep the character and send them home; the world itself starts fresh.
  function migrateV1(old) {
    const p = old.p, start = D.maps[R.start.map].start;
    p.map = R.start.map; p.x = start[0]; p.y = start[1];
    p.known = {}; p.journal = {}; p.visited = { [R.start.map]: 1 }; p.poison = null; p.stones = 0;
    p.cos = (p.cos || []).filter((id) => D.cosmetics[id]);
    for (const t of ['glyph', 'color', 'title', 'frame']) {
      if (!D.cosmetics[p.look[t]]) p.look[t] = (Object.values(D.cosmetics).find((c) => c.def && c.type === t) || {}).id;
    }
    return { v: SAVE_VERSION, seed: old.seed, rng: old.rng, scene: 'explore', p,
      world: { gone: {}, used: {}, seen: {} }, combat: null, dialog: null, shop: null, dead: null,
      log: ['{d}Your old save was carried over. The world has changed while you were away.{/}'] };
  }
})();
