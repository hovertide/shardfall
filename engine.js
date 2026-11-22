'use strict';
/* =====================================================================
   SHARDFALL — engine.js
   Every game rule lives here. No DOM, no timers, no Math.random().

     const res = Engine.act(state, { type: 'move', dx: 1, dy: 0 });
     // res = { ok, msg, fx: [...] }    state is updated in place

   - state is plain JSON: save it, load it, later keep it on a server.
   - Randomness comes from a seeded RNG stored in state.rng, so the same
     state + the same action always gives the same result.

   ACTIONS                              allowed in scene(s)
     move     {dx, dy}                  explore   (walking into NPCs/chests/shop = interact)
     attack   {target}                  combat
     skill    {id, target}              combat    strength skills, cost stamina
     spell    {id, target}              combat    spells, cost spirit
     defend   / flee                    combat
     use      {id}                      explore, combat, shop  (uses your turn in combat)
     equip    {id}                      explore, shop          weapons
     alloc    {stat}                    explore, shop, shrine, dialog   vit|str|sta|spi|wil
     cosmetic {id}                      explore, shop, shrine, dialog
     choose   {i}                       dialog
     buy {id} / sell {id}               shop
     pull     {n: 1 | 10}               shrine
     leave                              dialog, shop, shrine
     respawn                            gameover

   SCENES: explore | combat | dialog | shop | shrine | gameover

   FX (hints for animation): start{boss} ehit{i,dmg,crit} phit{dmg} dodge
     heal{stat} dread{amt} loot{gold} win{xp,gold} flee lose level{lvl}
     pull{results} travel{map}

   Log lines use color markup: {r} {g} {b} {c} {m} {y} {o} {w} {d}(dim)
   and {#rrggbb} for any color. {/} closes.
   ===================================================================== */

const Engine = (function () {
  const SRC = typeof DATA !== 'undefined' ? { DATA, MW, MH } : require('./data.js');
  const D = SRC.DATA, W = SRC.MW, H = SRC.MH, R = D.rules;
  const SAVE_VERSION = 1;

  const STATS = [
    { k: 'vit', name: 'Vitality',  short: 'VIT', color: '#ff6b6b', desc: 'Max HP, damage resistance, regeneration, potion strength.' },
    { k: 'str', name: 'Strength',  short: 'STR', color: '#ffb347', desc: 'Weapon damage, critical hits, dodge, escaping.' },
    { k: 'sta', name: 'Stamina',   short: 'STA', color: '#7ddc6f', desc: 'Stamina pool and regen for strength skills.' },
    { k: 'spi', name: 'Spirit',    short: 'SPI', color: '#6fb7ff', desc: 'Spirit pool, spell damage, hound strength.' },
    { k: 'wil', name: 'Willpower', short: 'WIL', color: '#c792ea', desc: 'Fight below 0 HP, fury when hurt, resist sanity loss.' },
  ];
  const RES_NAME = { hp: 'health', st: 'stamina', sp: 'spirit', san: 'sanity' };
  const DROPS = ['hp_potion', 'hp_potion', 'st_tonic', 'sp_draught'];   // 8% per kill
  const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  const COS = {};
  for (const c of D.cosmetics) COS[c.id] = c;
  const POOLS = D.rarity.map((_, r) => D.cosmetics.filter((c) => c.r === r && !c.def));

  /* ---------- Tiles & maps: key the tile table, repair bad rows, index exits ---------- */
  const TILES = {};
  for (const k in D.tiles) TILES[k] = Object.assign({ key: k }, D.tiles[k]);
  const VOID = TILES['#'];
  const EXITS = {};
  for (const [mk, m] of Object.entries(D.maps)) {
    if (m.rows.length !== H) console.warn(`[engine] map "${mk}" has ${m.rows.length} rows, expected ${H}`);
    const rows = m.rows.slice(0, H);
    while (rows.length < H) rows.push('#'.repeat(W));
    m.rows = rows.map((row, y) => {
      if (row.length !== W) console.warn(`[engine] map "${mk}" row ${y} is ${row.length} wide, expected ${W}`);
      return row.padEnd(W, '#').slice(0, W);
    });
    EXITS[mk] = {};
    m.rows.forEach((row, y) => [...row].forEach((ch, x) => {
      if (!TILES[ch]) console.warn(`[engine] map "${mk}" unknown tile "${ch}" at ${x},${y}`);
      else if (TILES[ch].exit) (EXITS[mk][ch] = EXITS[mk][ch] || []).push([x, y]);
    }));
  }

  function tileIn(s, mk, x, y) {
    if (x < 0 || y < 0 || x >= W || y >= H) return VOID;
    const k = s.world.gone[`${mk}:${x},${y}`] ? '.' : D.maps[mk].rows[y][x];
    return TILES[k] || VOID;
  }
  const tileAt = (s, x, y) => tileIn(s, s.p.map, x, y);
  const curMap = (s) => D.maps[s.p.map];

  /* ---------- Seeded RNG (mulberry32); state lives in s.rng ---------- */
  function rnd(s) {
    let t = (s.rng = (s.rng + 0x6D2B79F5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const roll = (s, a, b) => a + Math.floor(rnd(s) * (b - a + 1));
  const chance = (s, p) => rnd(s) < p;
  const pickOne = (s, arr) => arr[Math.floor(rnd(s) * arr.length)];
  function pickWeighted(s, pairs) {
    let total = 0;
    for (const [, w] of pairs) total += w;
    let r = rnd(s) * total;
    for (const [k, w] of pairs) if ((r -= w) < 0) return k;
    return pairs[pairs.length - 1][0];
  }

  /* ---------- Log & action result ---------- */
  let OUT = null, CUR = null;
  function log(s, text) {
    s.log.push(text);
    if (s.log.length > 150) s.log.splice(0, s.log.length - 150);
  }
  function logOnce(s, text) { if (s.log[s.log.length - 1] !== text) log(s, text); }
  function fail(msg) {
    if (OUT) { OUT.ok = false; OUT.msg = msg; }
    if (CUR && msg) logOnce(CUR, `{d}${msg}{/}`);
    return false;
  }
  const fx = (e) => { if (OUT) OUT.fx.push(e); };
  const listNames = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);

  /* ---------- Character math ---------- */
  function derived(p) {
    const S = p.stats, L = p.lvl, w = D.weapons[p.weapon];
    const bonus = Math.floor(S.str * 1.2);
    return {
      maxHp: 40 + S.vit * 8 + (L - 1) * 8,
      maxSt: 20 + S.sta * 5 + (L - 1) * 2,
      maxSp: 10 + S.spi * 6 + (L - 1) * 2,
      maxSan: R.maxSanity,
      dmgMin: w.min + bonus,
      dmgMax: w.max + bonus,
      crit: Math.min(0.6, 0.05 + S.str * 0.01 + w.crit / 100),
      dodge: Math.min(0.35, 0.03 + S.str * 0.008),
      resist: Math.min(0.3, S.vit * 0.01),               // % damage taken reduced
      regen: Math.max(1, Math.floor(S.vit / 4)),          // HP per combat round
      stRegen: 2 + Math.floor(S.sta / 3),
      spRegen: 1 + Math.floor(S.spi / 4),
      brink: S.wil * 3,                                   // you fall at -brink HP
      furyBonus: S.wil * 0.02,                            // +dmg when under 35% HP
      dreadResist: Math.min(0.7, S.wil * 0.03),
      terror: Math.max(0.05, 0.3 - S.wil * 0.012),        // freeze chance while shaken
    };
  }
  function fury(p) {
    const d = derived(p);
    if (p.hp <= 0) return 1 + d.furyBonus * 2;
    return p.hp < d.maxHp * 0.35 ? 1 + d.furyBonus : 1;
  }
  const dmgMult = (p) => fury(p) * (p.san <= 0 ? 0.75 : 1);
  const xpNeed = (lvl) => Math.floor(25 * Math.pow(lvl, 1.5));
  const qStatus = (p, q) => (p.quests[q] ? p.quests[q].s : 'none');

  function conditions(s) {
    const p = s.p, d = derived(p), f = fury(p), c = s.combat, out = [];
    if (p.hp <= 0) out.push({ name: 'BRINK', color: '#ff4060', desc: `Below 0 HP. You fall at -${d.brink}.` });
    if (f > 1) out.push({ name: 'FURY', color: '#ff8a3d', desc: `+${Math.round((f - 1) * 100)}% damage` });
    if (p.san <= 0) out.push({ name: 'BROKEN', color: '#c792ea', desc: '-25% damage, may freeze in terror' });
    else if (p.san < 30) out.push({ name: 'SHAKEN', color: '#c792ea', desc: `${Math.round(d.terror * 100)}% chance to freeze` });
    if (c && c.hound) out.push({ name: 'HOUND', color: '#d08bff', desc: `${c.hound.hp} HP, ${c.hound.turns} turns left` });
    return out;
  }

  /* ---------- New game / save / load ---------- */
  function newGame(opts = {}) {
    const seed = (opts.seed == null ? Date.now() : opts.seed) >>> 0;
    const stats = {};
    let used = 0;
    for (const { k } of STATS) {
      const a = Math.max(0, Math.floor(Number((opts.alloc || {})[k]) || 0));
      stats[k] = R.baseStat + a;
      used += a;
    }
    if (used > R.startPoints) throw new Error(`Allocated ${used} points, max is ${R.startPoints}`);
    const look = {};
    for (const c of D.cosmetics) if (c.def) look[c.type] = c.id;
    const v = D.maps.village;
    const p = {
      name: String(opts.name || '').replace(/[{}%<>]/g, '').trim().slice(0, 14) || 'Wanderer',
      lvl: 1, xp: 0, points: R.startPoints - used, stats,
      hp: 0, st: 0, sp: 0, san: R.maxSanity,
      gold: R.startGold, shards: R.startShards,
      weapon: 'wooden_sword', weapons: ['wooden_sword'],
      inv: { hp_potion: 3, sp_draught: 1 },
      quests: {}, flags: {},
      cos: D.cosmetics.filter((c) => c.def).map((c) => c.id), look, pity: { e: 0, l: 0 },
      map: 'village', x: v.start[0], y: v.start[1],
      acc: { hp: 0, st: 0, sp: 0, san: 0 }, grace: 0,
      kills: 0, steps: 0, deaths: 0, pulls: 0,
    };
    const d = derived(p);
    p.hp = d.maxHp; p.st = d.maxSt; p.sp = d.maxSp;
    const s = { v: SAVE_VERSION, seed, rng: seed | 0, scene: 'explore', p,
      world: { gone: {}, seen: {} }, combat: null, dialog: null, dead: null, log: [] };
    reveal(s);
    log(s, '{d}Three nights ago, the sky cracked like ice.{/}');
    log(s, `You wake beside the fountain of {y}Emberhollow{/}, ${p.name}. You remember your name, and nothing else.`);
    log(s, 'Elder Maren ({y}☺{/}) is waiting nearby. Walk into people to talk to them.');
    return s;
  }

  const save = (s) => JSON.stringify(s);
  function load(json) {
    const s = typeof json === 'string' ? JSON.parse(json) : json;
    if (!s || !s.p || s.v !== SAVE_VERSION) throw new Error('Incompatible save');
    // future: migrate older save versions here
    s.world = s.world || { gone: {}, seen: {} };
    s.world.gone = s.world.gone || {};
    s.world.seen = s.world.seen || {};
    s.log = s.log || [];
    if (!D.maps[s.p.map]) { s.p.map = 'village'; [s.p.x, s.p.y] = D.maps.village.start; }
    reveal(s);
    return s;
  }

  /* ---------- Field of view (fog of war) ---------- */
  const sightOf = (m) => m.sight || (m.safe ? 99 : 6);   // add `sight: n` to a map in data.js to tune
  function seenArr(s, mk) {
    let a = s.world.seen[mk];
    if (!a || a.length !== W * H) a = s.world.seen[mk] = new Array(W * H).fill(0);
    return a;
  }
  function clearLine(s, x0, y0, x1, y1) {
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy, x = x0, y = y0;
    while (x !== x1 || y !== y1) {
      if ((x !== x0 || y !== y0) && tileAt(s, x, y).key === '#') return false;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x += sx; }
      if (e2 <= dx) { err += dx; y += sy; }
    }
    return true;
  }
  let fovKey = '', fovVis = null;
  function fov(s) {
    const p = s.p, key = `${p.map}:${p.x},${p.y}`;
    if (key === fovKey) return fovVis;
    const r = sightOf(curMap(s)), rx = r * 2, vis = new Uint8Array(W * H);   // cells are ~2x taller than wide
    if (r >= 99) vis.fill(1);
    else {
      for (let y = Math.max(0, p.y - r); y <= Math.min(H - 1, p.y + r); y++) {
        for (let x = Math.max(0, p.x - rx); x <= Math.min(W - 1, p.x + rx); x++) {
          const nx = (x - p.x) / rx, ny = (y - p.y) / r;
          if (nx * nx + ny * ny <= 1.05 && clearLine(s, p.x, p.y, x, y)) vis[y * W + x] = 1;
        }
      }
    }
    fovKey = key; fovVis = vis;
    return vis;
  }
  function reveal(s) {
    const vis = fov(s), seen = seenArr(s, s.p.map);
    for (let i = 0; i < vis.length; i++) if (vis[i]) seen[i] = 1;
  }

  /* ---------- Exploration ---------- */
  function move(s, a) {
    const p = s.p, dx = Math.sign(a.dx | 0), dy = Math.sign(a.dy | 0);
    if (!dx && !dy) return fail(null);
    const nx = p.x + dx, ny = p.y + dy, t = tileAt(s, nx, ny);
    if (t.bump) return bump(s, t, nx, ny);
    if (!t.walk) return fail(t.key === '~' ? 'The water runs deep and cold.' : null);
    p.x = nx; p.y = ny; p.steps++;
    stepRegen(s);
    if (t.exit) return travel(s, t.key, nx, ny);
    reveal(s);
    if (p.grace > 0) p.grace--;
    else encounter(s, t);
    return true;
  }

  function stepRegen(s) {
    const p = s.p, d = derived(p), S = p.stats, k = curMap(s).safe ? 3 : 1;
    const gain = (key, amt, max) => {
      if (p[key] >= max) { p.acc[key] = 0; return; }
      p.acc[key] += amt * k;
      const whole = Math.floor(p.acc[key]);
      if (whole > 0) { p[key] = Math.min(max, p[key] + whole); p.acc[key] -= whole; }
    };
    gain('hp', S.vit * 0.05, d.maxHp);
    gain('st', S.sta * 0.15, d.maxSt);
    gain('sp', S.spi * 0.06, d.maxSp);
    gain('san', S.wil * 0.02, d.maxSan);
  }

  function bump(s, t, x, y) {
    switch (t.bump) {
      case 'shop':
        s.scene = 'shop';
        log(s, '{y}Bram the merchant{/} grins over his counter. "Coin for goods, friend."');
        break;
      case 'shrine':
        s.scene = 'shrine';
        log(s, '{m}The Shrine of Echoes hums.{/} Spirit shards can coax out echoes of who you might have been.');
        break;
      case 'talk':
        openDialog(s, t.dlg);
        break;
      case 'chest':
        openChest(s, x, y);
        break;
      case 'boss':
        if (qStatus(s.p, 'q3') !== 'active') {
          logOnce(s, '{m}A towering shadow sleeps beneath a veil of black mist. It does not notice you... yet.{/}');
          break;
        }
        startCombat(s, ['warden'], { boss: true, tile: `${x},${y}` });
        break;
    }
    return true;
  }

  function openChest(s, x, y) {
    const p = s.p, loot = curMap(s).chest || { gold: [10, 20] };
    const gold = roll(s, loot.gold[0], loot.gold[1]);
    p.gold += gold;
    let txt = `{y}+${gold} gold{/}`;
    if (loot.item) {
      p.inv[loot.item] = (p.inv[loot.item] || 0) + 1;
      txt += `, ${D.items[loot.item].name}`;
    }
    s.world.gone[`${p.map}:${x},${y}`] = 1;
    log(s, `You pry open the chest: ${txt}.`);
    fx({ t: 'loot', gold });
  }

  function travel(s, letter, x, y) {
    const p = s.p, from = p.map, link = D.links[letter];
    if (!link) return fail('This path leads nowhere.');
    const to = link[0] === from ? link[1] : link[0];
    const src = EXITS[from][letter] || [], dst = EXITS[to][letter] || [];
    if (!dst.length) return fail('This path leads nowhere.');
    const k = Math.max(0, src.findIndex(([ex, ey]) => ex === x && ey === y));
    const [ex, ey] = dst[Math.min(k, dst.length - 1)];
    let at = [ex, ey];
    for (const [dx, dy] of DIRS) {
      const t = tileIn(s, to, ex + dx, ey + dy);
      if (t.walk && !t.exit) { at = [ex + dx, ey + dy]; break; }
    }
    p.map = to;
    [p.x, p.y] = at;
    p.grace = 4;
    reveal(s);
    const m = D.maps[to];
    log(s, `{c}~ ${m.name} ~{/} {d}(${m.danger}){/}`);
    fx({ t: 'travel', map: to });
    return true;
  }

  function encounter(s, t) {
    const m = curMap(s);
    if (m.safe || !m.enc) return;
    const rate = t.key === ',' ? m.rate : (m.pathRate != null ? m.pathRate : m.rate);
    if (!chance(s, rate)) return;
    const keys = [pickWeighted(s, m.enc)];
    if (!D.enemies[keys[0]].solo) {
      const max = m.maxGroup || 2;
      while (keys.length < max && chance(s, 0.4)) {
        const k = pickWeighted(s, m.enc);
        if (!D.enemies[k].solo) keys.push(k);
      }
    }
    startCombat(s, keys, {});
  }

  /* ---------- Combat ---------- */
  function startCombat(s, keys, opt) {
    const count = {}, used = {};
    keys.forEach((k) => (count[k] = (count[k] || 0) + 1));
    const enemies = keys.map((k) => {
      const e = D.enemies[k];
      const suffix = count[k] > 1 ? ' ' + 'ABCDEF'[(used[k] = (used[k] || 0) + 1) - 1] : '';
      return { key: k, name: e.name + suffix, hp: e.hp, maxHp: e.hp, atk: e.atk, def: e.def, boss: !!e.boss,
        burn: 0, burnDmg: 0, frozen: 0, stolen: 0, dead: false };
    });
    s.combat = { enemies, hound: null, defending: false, round: 1, boss: !!opt.boss,
      tile: opt.tile || null, map: s.p.map, loot: { xp: 0, gold: 0, items: [] } };
    s.scene = 'combat';
    if (opt.boss) log(s, '{r}The black water churns. THE VEIL WARDEN RISES!{/}');
    else log(s, `{r}Ambush!{/} ${listNames(enemies.map((e) => e.name))} ${enemies.length > 1 ? 'leap' : 'leaps'} out!`);
    fx({ t: 'start', boss: !!opt.boss });
  }

  const alive = (c) => c.enemies.map((e, i) => (e.hp > 0 ? i : -1)).filter((i) => i >= 0);
  function pickTarget(c, t) {
    if (c.enemies[t] && c.enemies[t].hp > 0) return t;
    const a = alive(c);
    return a.length ? a[0] : -1;
  }

  function combatTurn(s, a) {
    const c = s.combat, p = s.p, tgt = pickTarget(c, a.target);
    let plan;
    switch (a.type) {
      case 'attack':
        plan = () => attack(s, tgt);
        break;
      case 'skill': {
        const sk = D.skills[a.id];
        if (!sk) return fail('Unknown skill.');
        if (p.lvl < sk.lvl) return fail(`${sk.name} unlocks at level ${sk.lvl}.`);
        if (p.st < sk.cost) return fail(`Not enough stamina for ${sk.name}.`);
        plan = () => { p.st -= sk.cost; useSkill(s, sk, tgt); };
        break;
      }
      case 'spell': {
        const sp = D.spells[a.id];
        if (!sp) return fail('Unknown spell.');
        if (p.lvl < sp.lvl) return fail(`${sp.name} unlocks at level ${sp.lvl}.`);
        if (p.sp < sp.cost) return fail(`Not enough spirit for ${sp.name}.`);
        plan = () => { p.sp -= sp.cost; castSpell(s, sp, tgt); };
        break;
      }
      case 'use': {
        const it = D.items[a.id];
        if (!it || !(p.inv[a.id] > 0)) return fail("You don't have that.");
        const why = itemBlocked(s, it);
        if (why) return fail(why);
        plan = () => applyItem(s, a.id);
        break;
      }
      case 'defend':
        plan = () => { c.defending = true; log(s, 'You raise your guard and catch your breath.'); };
        break;
      case 'flee':
        if (c.boss) return fail('There is no escape from this fight!');
        plan = () => tryFlee(s);
        break;
      default:
        return fail(null);
    }

    // 1. player (a shaken mind may freeze; nothing is spent if so)
    c.defending = false;
    if (p.san < 30 && chance(s, derived(p).terror)) log(s, '{m}The whispers swell. You freeze in terror!{/}');
    else plan();
    if (checkWin(s)) return true;
    // 2. spirit hound
    houndTurn(s);
    if (checkWin(s)) return true;
    // 3. enemies
    for (let i = 0; i < c.enemies.length; i++) {
      enemyTurn(s, i);
      if (s.scene !== 'combat') return true;
    }
    // 4. burns, regen, timers
    endRound(s);
    return true;
  }

  function checkWin(s) {
    if (s.scene !== 'combat') return true;
    if (s.combat.enemies.every((e) => e.hp <= 0)) { victory(s); return true; }
    return false;
  }

  function hitEnemy(s, i, dmg, crit) {
    const e = s.combat.enemies[i];
    e.hp = Math.max(0, e.hp - dmg);
    fx({ t: 'ehit', i, dmg, crit: !!crit });
  }

  // Physical hits. Extra hits carry over to the next foe if the target dies.
  function strike(s, i, n, mult) {
    const c = s.combat, p = s.p, d = derived(p), hits = [];
    for (let h = 0; h < n; h++) {
      if (i < 0 || c.enemies[i].hp <= 0) i = pickTarget(c, -1);
      if (i < 0) break;
      const e = c.enemies[i];
      let dmg = roll(s, d.dmgMin, d.dmgMax) * mult * dmgMult(p);
      const crit = chance(s, d.crit);
      if (crit) dmg *= 1.75;
      dmg = Math.max(1, Math.round(dmg - e.def));
      hitEnemy(s, i, dmg, crit);
      hits.push({ i, dmg, crit, name: e.name });
    }
    return hits;
  }
  function fmtHits(hits) {
    const groups = [];
    for (const h of hits) {
      let g = groups[groups.length - 1];
      if (!g || g.i !== h.i) groups.push((g = { i: h.i, name: h.name, parts: [] }));
      g.parts.push(h.crit ? `{y}${h.dmg} (crit){/}` : `${h.dmg}`);
    }
    return groups.map((g) => `${g.name} for ${g.parts.join(' + ')}`).join(', then ');
  }

  function attack(s, i) {
    log(s, `You strike ${fmtHits(strike(s, i, 1, 1))}.`);
    reap(s);
  }

  function burn(e, turns, dmg) {
    e.burn = Math.max(e.burn, turns);
    e.burnDmg = Math.max(e.burnDmg, dmg);
  }

  function useSkill(s, sk, i) {
    const hits = strike(s, i, sk.hits, sk.mult);
    let txt = `{o}${sk.name}!{/} You hit ${fmtHits(hits)}.`;
    const last = hits.length ? s.combat.enemies[hits[hits.length - 1].i] : null;
    if (sk.burn && last && last.hp > 0) {
      burn(last, sk.burn, 3 + Math.floor(s.p.stats.str / 2));
      txt += ` {o}${last.name} is set ablaze!{/}`;
    }
    log(s, txt);
    reap(s);
  }

  function castSpell(s, sp, i) {
    const c = s.combat, p = s.p, spi = p.stats.spi;
    log(s, sp.cast);
    if (sp.target === 'summon') {
      const hp = 20 + spi * 4;
      c.hound = { hp, maxHp: hp, turns: sp.turns, dmg: 5 + spi * 2 };
      return;
    }
    const parts = [];
    for (const t of sp.target === 'all' ? alive(c) : [i]) {
      if (t < 0) continue;
      const e = c.enemies[t];
      const raw = (sp.base + spi * sp.scale) * (0.9 + rnd(s) * 0.2) * dmgMult(p);
      const dmg = Math.max(1, Math.round(raw - Math.floor(e.def / 2)));   // spells ignore half of defense
      hitEnemy(s, t, dmg, false);
      let txt = `${e.name} takes ${dmg}`;
      if (e.hp > 0 && sp.freeze) {
        e.frozen = Math.max(e.frozen, e.boss ? 1 : sp.freeze);
        txt += ' {c}(frozen){/}';
      }
      if (e.hp > 0 && sp.burnChance && chance(s, sp.burnChance)) {
        burn(e, 3, 3 + Math.floor(spi / 2));
        txt += ' {o}(burning){/}';
      }
      parts.push(txt);
    }
    if (parts.length) log(s, `  ${parts.join(', ')}.`);
    reap(s);
  }

  function houndTurn(s) {
    const c = s.combat, h = c.hound;
    if (!h) return;
    const a = alive(c);
    if (!a.length) return;
    const i = pickOne(s, a), e = c.enemies[i];
    const dmg = Math.max(1, Math.round(h.dmg * (0.9 + rnd(s) * 0.2) - Math.floor(e.def / 2)));
    hitEnemy(s, i, dmg, false);
    log(s, `{m}Your hound{/} mauls ${e.name} for ${dmg}.`);
    reap(s);
  }

  // Handle newly dead enemies: log, bank loot, count quest kills.
  function reap(s) {
    const c = s.combat;
    for (const e of c.enemies) {
      if (e.hp > 0 || e.dead) continue;
      e.dead = true;
      const def = D.enemies[e.key];
      log(s, `{g}${e.name} is slain!{/}`);
      c.loot.xp += def.xp;
      c.loot.gold += roll(s, def.gold[0], def.gold[1]) + e.stolen;
      if (!def.boss && chance(s, 0.08)) c.loot.items.push(pickOne(s, DROPS));
      s.p.kills++;
      countKill(s);
    }
  }
  function countKill(s) {
    for (const [qk, q] of Object.entries(D.quests)) {
      const st = s.p.quests[qk];
      if (!q.kill || !st || st.s !== 'active' || q.kill.map !== s.combat.map) continue;
      st.n++;
      if (st.n >= q.kill.n) setReady(s, qk);
      else log(s, `{d}${q.name}: ${st.n}/${q.kill.n}{/}`);
    }
  }

  function enemyTurn(s, i) {
    const c = s.combat, e = c.enemies[i], p = s.p;
    if (e.hp <= 0) return;
    if (e.frozen > 0) { e.frozen--; log(s, `{c}${e.name} is frozen solid.{/}`); return; }
    let mv = null;
    for (const m of D.enemies[e.key].moves) if (chance(s, m.chance)) { mv = m; break; }
    const type = mv ? mv.type : 'hit', mult = (mv && mv.mult) || 1;
    const label = mv ? `{r}${mv.name}{/}` : 'attack';
    switch (type) {
      case 'hit':
      case 'drain': {
        const dealt = c.hound && chance(s, 0.75) ? hitHound(s, e, mult, label) : hitPlayer(s, e, mult, label);
        if (type === 'drain' && dealt > 0 && s.scene === 'combat') {
          const heal = Math.min(e.maxHp - e.hp, dealt);
          if (heal > 0) { e.hp += heal; log(s, `  ${e.name} drinks the stolen life, healing ${heal}.`); }
        }
        break;
      }
      case 'aoe':
        if (c.hound) hitHound(s, e, mult, label);
        hitPlayer(s, e, mult, label);
        break;
      case 'dread': {
        const was = p.san, loss = Math.max(1, Math.round(mv.amt * (1 - derived(p).dreadResist)));
        p.san = Math.max(0, p.san - loss);
        log(s, `${e.name} uses {m}${mv.name}{/}. Your mind reels: {m}-${loss} sanity{/}.`);
        fx({ t: 'dread', amt: loss });
        if (was > 0 && p.san === 0) log(s, '{m}Something inside you snaps. You are BROKEN.{/}');
        break;
      }
      case 'steal': {
        const took = Math.min(p.gold, roll(s, mv.amt[0], mv.amt[1]));
        p.gold -= took;
        e.stolen += took;
        log(s, took
          ? `${e.name} uses {y}${mv.name}{/} and snatches ${took} gold! {d}(Kill it to get it back.){/}`
          : `${e.name} rummages for gold and finds none.`);
        break;
      }
      case 'sap': {
        const took = Math.min(p.sp, mv.amt);
        p.sp -= took;
        log(s, `${e.name} uses {b}${mv.name}{/}, draining ${took} spirit.`);
        break;
      }
    }
  }

  function hitPlayer(s, e, mult, label) {
    const p = s.p, c = s.combat, d = derived(p);
    if (chance(s, d.dodge)) {
      log(s, `You {c}dodge{/} ${e.name}'s ${label}!`);
      fx({ t: 'dodge' });
      return 0;
    }
    let dmg = e.atk * mult * (0.85 + rnd(s) * 0.3) * (1 - d.resist);
    if (c.defending) dmg *= 0.5;
    dmg = Math.max(1, Math.round(dmg));
    const wasUp = p.hp > 0;
    p.hp -= dmg;
    fx({ t: 'phit', dmg });
    log(s, `${e.name}'s ${label} hits you for {r}${dmg}{/}${c.defending ? ' {d}(guarded){/}' : ''}.`);
    if (p.hp <= -d.brink) { lose(s, e.name); return dmg; }
    if (wasUp && p.hp <= 0) log(s, `{m}You refuse to fall!{/} Willpower holds you on the brink. {d}(You fall at -${d.brink} HP.){/}`);
    return dmg;
  }

  function hitHound(s, e, mult, label) {
    const c = s.combat, h = c.hound;
    const dmg = Math.max(1, Math.round(e.atk * mult * (0.85 + rnd(s) * 0.3)));
    h.hp -= dmg;
    log(s, `${e.name}'s ${label} hits {m}your hound{/} for ${dmg}.`);
    if (h.hp <= 0) { c.hound = null; log(s, '{m}Your spirit hound dissolves back into the Veil.{/}'); }
    return dmg;
  }

  function endRound(s) {
    const c = s.combat, p = s.p, d = derived(p);
    c.enemies.forEach((e, i) => {
      if (e.hp > 0 && e.burn > 0) {
        e.burn--;
        hitEnemy(s, i, e.burnDmg, false);
        log(s, `{o}${e.name} burns{/} for ${e.burnDmg}.`);
      }
    });
    reap(s);
    if (checkWin(s)) return;
    if (p.hp > 0) p.hp = Math.min(d.maxHp, p.hp + d.regen);
    else {
      p.hp -= 1;
      p.san = Math.max(0, p.san - 3);
      log(s, `{r}You are bleeding out{/} (${p.hp} HP).`);
      if (p.hp <= -d.brink) { lose(s, 'your wounds'); return; }
    }
    p.st = Math.min(d.maxSt, p.st + d.stRegen + (c.defending ? 6 : 0));
    p.sp = Math.min(d.maxSp, p.sp + d.spRegen + (c.defending ? 3 : 0));
    if (c.hound && --c.hound.turns <= 0) {
      c.hound = null;
      log(s, '{m}Your spirit hound fades back into the Veil.{/}');
    }
    c.defending = false;
    c.round++;
  }

  function tryFlee(s) {
    const p = s.p, c = s.combat;
    const odds = Math.min(0.9, 0.4 + p.stats.str * 0.02 + (c.hound ? 0.15 : 0));
    if (chance(s, odds)) endFlee(s, 'You break away and escape!');
    else log(s, '{r}You try to flee, but they cut you off!{/}');
  }
  function endFlee(s, msg) {
    log(s, msg);
    s.combat = null;
    s.scene = 'explore';
    s.p.grace = 4;
    if (s.p.hp <= 0) s.p.hp = 1;
    fx({ t: 'flee' });
  }

  function victory(s) {
    const c = s.combat, p = s.p, L = c.loot;
    p.xp += L.xp;
    p.gold += L.gold;
    for (const id of L.items) p.inv[id] = (p.inv[id] || 0) + 1;
    const extra = L.items.length ? ', ' + L.items.map((id) => D.items[id].name).join(', ') : '';
    log(s, `{g}Victory!{/} +${L.xp} XP, {y}+${L.gold} gold{/}${extra}.`);
    if (p.hp <= 0) { p.hp = 1; log(s, 'You stagger upright, barely alive.'); }
    if (c.tile) s.world.gone[`${c.map}:${c.tile}`] = 1;
    if (c.boss) {
      log(s, '{y}The Warden sinks into the black water. Overhead, the crack in the sky begins to close.{/}');
      setReady(s, 'q3');
    }
    s.combat = null;
    s.scene = 'explore';
    p.grace = 3;
    fx({ t: 'win', xp: L.xp, gold: L.gold });
    levelCheck(s);
  }

  function lose(s, by) {
    s.scene = 'gameover';
    s.dead = { by, map: s.p.map, round: s.combat ? s.combat.round : 0 };
    s.combat = null;
    log(s, `{r}You have fallen to ${by}.{/}`);
    fx({ t: 'lose' });
  }

  function respawn(s) {
    const p = s.p, d = derived(p), v = D.maps.village, lost = Math.floor(p.gold * 0.25);
    p.gold -= lost;
    p.deaths++;
    p.map = 'village';
    [p.x, p.y] = v.start;
    p.hp = Math.ceil(d.maxHp / 2); p.st = d.maxSt; p.sp = d.maxSp; p.san = Math.max(p.san, 50);
    s.combat = null; s.dead = null; s.scene = 'explore'; p.grace = 0;
    reveal(s);
    log(s, `You wake by the fountain, gasping.${lost ? ` {y}${lost} gold{/} is missing from your purse.` : ''}`);
    return true;
  }

  /* ---------- Progression ---------- */
  function levelCheck(s) {
    const p = s.p;
    while (p.xp >= xpNeed(p.lvl)) {
      p.xp -= xpNeed(p.lvl);
      p.lvl++;
      p.points += R.pointsPerLevel;
      p.shards += R.shardsPerLevel;
      const d = derived(p);
      p.hp = d.maxHp; p.st = d.maxSt; p.sp = d.maxSp;
      log(s, `{y}LEVEL UP! You are now level ${p.lvl}.{/} +${R.pointsPerLevel} stat points, {m}+${R.shardsPerLevel} spirit shards{/}.`);
      for (const tbl of [D.skills, D.spells]) {
        for (const x of Object.values(tbl)) if (x.lvl === p.lvl) log(s, `{c}New ability: ${x.name}{/} - ${x.desc}`);
      }
      fx({ t: 'level', lvl: p.lvl });
    }
  }

  function alloc(s, a) {
    const p = s.p, st = STATS.find((x) => x.k === a.stat);
    if (!st) return fail('Unknown stat.');
    if (p.points <= 0) return fail('No stat points to spend.');
    const before = derived(p);
    p.stats[st.k]++;
    p.points--;
    const after = derived(p);
    p.hp += after.maxHp - before.maxHp;
    p.st += after.maxSt - before.maxSt;
    p.sp += after.maxSp - before.maxSp;
    log(s, `${st.name} increased to ${p.stats[st.k]}.`);
    return true;
  }

  function setReady(s, qk) {
    const st = s.p.quests[qk], q = D.quests[qk];
    if (!st || st.s !== 'active') return;
    st.s = 'ready';
    log(s, `{y}Quest ready:{/} ${q.name}. Return to ${q.giver}.`);
  }

  /* ---------- Items, equipment, shop ---------- */
  function itemBlocked(s, it) {
    const p = s.p, d = derived(p);
    if (it.stat === 'flee') {
      if (s.scene !== 'combat') return `${it.name} only works in combat.`;
      return s.combat.boss ? 'There is no escape from this fight!' : null;
    }
    const max = { hp: d.maxHp, st: d.maxSt, sp: d.maxSp, san: d.maxSan }[it.stat];
    return p[it.stat] >= max ? `Your ${RES_NAME[it.stat]} is already full.` : null;
  }

  function applyItem(s, id) {
    const it = D.items[id], p = s.p, d = derived(p);
    if (--p.inv[id] <= 0) delete p.inv[id];
    if (it.stat === 'flee') return endFlee(s, 'You hurl a smoke bomb and vanish in the haze!');
    const max = { hp: d.maxHp, st: d.maxSt, sp: d.maxSp, san: d.maxSan }[it.stat];
    const amt = it.amt + (it.stat === 'hp' ? 2 * p.stats.vit : 0);
    const before = p[it.stat];
    p[it.stat] = Math.min(max, p[it.stat] + amt);
    log(s, `You use a ${it.name}: {g}+${p[it.stat] - before} ${RES_NAME[it.stat]}{/}.`);
    fx({ t: 'heal', stat: it.stat });
  }

  function useItem(s, a) {
    if (s.scene === 'combat') return combatTurn(s, { type: 'use', id: a.id });
    const it = D.items[a.id];
    if (!it || !(s.p.inv[a.id] > 0)) return fail("You don't have that.");
    const why = itemBlocked(s, it);
    if (why) return fail(why);
    applyItem(s, a.id);
    return true;
  }

  function equip(s, a) {
    const p = s.p, w = D.weapons[a.id];
    if (!w || !p.weapons.includes(a.id)) return fail("You don't own that weapon.");
    if (p.weapon === a.id) return fail(`${w.name} is already equipped.`);
    p.weapon = a.id;
    log(s, `You equip the {w}${w.name}{/}.`);
    return true;
  }

  const sellPrice = (id) => Math.max(1, Math.floor(D.items[id].price / 2));

  function buy(s, a) {
    const p = s.p, id = a.id;
    if (!D.shop.includes(id)) return fail('Not for sale.');
    const w = D.weapons[id], it = D.items[id], price = (w || it).price;
    if (w && p.weapons.includes(id)) return fail(`You already own the ${w.name}.`);
    if (p.gold < price) return fail(`You need ${price - p.gold} more gold.`);
    p.gold -= price;
    if (w) {
      p.weapons.push(id);
      if (w.max > D.weapons[p.weapon].max) {
        p.weapon = id;
        log(s, `Bought and equipped the {w}${w.name}{/} for ${price} gold.`);
      } else log(s, `Bought the ${w.name} for ${price} gold.`);
    } else {
      p.inv[id] = (p.inv[id] || 0) + 1;
      log(s, `Bought ${it.name} for ${price} gold.`);
    }
    return true;
  }

  function sell(s, a) {
    const p = s.p, it = D.items[a.id];
    if (!it || !(p.inv[a.id] > 0)) return fail("You don't have that.");
    const price = sellPrice(a.id);
    if (--p.inv[a.id] <= 0) delete p.inv[a.id];
    p.gold += price;
    log(s, `Sold ${it.name} for {y}${price} gold{/}.`);
    return true;
  }

  /* ---------- Shrine of Echoes (cosmetic pulls) ---------- */
  function rollRarity(s, min) {
    return pickWeighted(s, D.rarity.map((r, i) => [i, i >= min ? r.weight : 0]).filter(([, w]) => w > 0));
  }
  const cosName = (id) => `{${D.rarity[COS[id].r].color}}${COS[id].name}{/} {d}(${COS[id].type}){/}`;

  function pull(s, a) {
    const p = s.p, n = a.n === 10 ? 10 : 1, cost = R.pullCost * n;
    if (p.shards < cost) return fail(`You need ${cost} spirit shards (you have ${p.shards}).`);
    p.shards -= cost;
    const results = [];
    for (let i = 0; i < n; i++) {
      p.pity.e++; p.pity.l++; p.pulls++;
      let r = p.pity.l >= D.pity.legendary ? 3 : rollRarity(s, p.pity.e >= D.pity.epic ? 2 : 0);
      while (r > 0 && !POOLS[r].length) r--;
      if (r >= 2) p.pity.e = 0;
      if (r === 3) p.pity.l = 0;
      const c = pickOne(s, POOLS[r]);
      const dupe = p.cos.includes(c.id), refund = dupe ? D.dupeRefund[r] : 0;
      if (dupe) p.shards += refund;
      else p.cos.push(c.id);
      results.push({ id: c.id, r, dupe, refund });
    }
    const fresh = results.filter((x) => !x.dupe).map((x) => cosName(x.id));
    const refunded = results.reduce((t, x) => t + x.refund, 0);
    log(s, `{m}The shrine answers with ${n} echo${n > 1 ? 'es' : ''}.{/}` +
      (fresh.length ? ` New: ${fresh.join(', ')}.` : ' Nothing new.') +
      (refunded ? ` {d}Duplicates refunded ${refunded} shards.{/}` : ''));
    fx({ t: 'pull', results });
    return true;
  }

  function wearCosmetic(s, a) {
    const p = s.p, c = COS[a.id];
    if (!c || !p.cos.includes(a.id)) return fail("You don't own that.");
    p.look[c.type] = a.id;
    log(s, `{d}Now using ${c.type}: ${c.name}.{/}`);
    return true;
  }

  function look(p) {
    const L = p.look, g = COS[L.glyph], c = COS[L.color], t = COS[L.title], f = COS[L.frame];
    return {
      glyph: g ? g.val : '@',
      color: c ? c.val : '#f0f0f0',
      title: t ? t.name : '',
      frame: f ? f.val : { style: 'single', color: '#4a4a60' },
    };
  }

  /* ---------- Dialogue & quests ---------- */
  function openDialog(s, id) {
    const dl = D.dialogues[id];
    if (!dl) return fail('They have nothing to say.');
    const p = s.p;
    const entry = dl.entry.find((en) => !en.if || Object.entries(en.if).every(([q, st]) => qStatus(p, q) === st));
    s.dialog = { id, node: entry.node };
    s.scene = 'dialog';
    return true;
  }

  function questProgress(p, qk) {
    const q = D.quests[qk], st = p.quests[qk];
    if (!q || !st || !q.kill) return '';
    return `${Math.min(st.n, q.kill.n)}/${q.kill.n}`;
  }

  function dialogView(s) {
    if (!s.dialog) return null;
    const dl = D.dialogues[s.dialog.id], node = dl.nodes[s.dialog.node];
    return {
      name: dl.name,
      text: node.text.replace(/%(\w+)%/g, (_, q) => questProgress(s.p, q)),
      choices: node.choices.map((c) => c.t),
    };
  }

  function choose(s, a) {
    const dl = D.dialogues[s.dialog.id], node = dl.nodes[s.dialog.node], ch = node.choices[a.i];
    if (!ch) return fail(null);
    let go = ch.go;
    for (const op of ch.do || []) {
      const i = op.indexOf(':');
      const redirect = dialogOp(s, i < 0 ? op : op.slice(0, i), i < 0 ? '' : op.slice(i + 1));
      if (redirect) go = redirect;
    }
    if (go && dl.nodes[go]) s.dialog.node = go;
    else leave(s);
    return true;
  }

  // Returns a node name to redirect to, or null.
  function dialogOp(s, k, v) {
    const p = s.p, d = derived(p), q = D.quests[v];
    switch (k) {
      case 'accept':
        if (q && !p.quests[v]) {
          p.quests[v] = { s: 'active', n: 0 };
          log(s, `{y}New quest:{/} ${q.name}. ${q.desc}`);
        }
        break;
      case 'ready':
        setReady(s, v);
        break;
      case 'turnin': {
        const st = p.quests[v];
        if (!q || !st || st.s !== 'ready') break;
        st.s = 'done';
        const rw = q.reward;
        p.gold += rw.gold || 0;
        p.shards += rw.shards || 0;
        p.xp += rw.xp || 0;
        const parts = [rw.gold && `{y}+${rw.gold} gold{/}`, rw.shards && `{m}+${rw.shards} shards{/}`, rw.xp && `+${rw.xp} XP`].filter(Boolean);
        log(s, `{y}Quest complete:{/} ${q.name}! ${parts.join(', ')}.`);
        levelCheck(s);
        break;
      }
      case 'flag':
        p.flags[v] = true;
        break;
      case 'rest': {
        const cost = Number(v) || 0;
        if (p.gold < cost) return 'poor';
        p.gold -= cost;
        p.hp = d.maxHp; p.st = d.maxSt; p.sp = d.maxSp; p.san = d.maxSan;
        log(s, `{g}You rest and recover fully.{/} {d}(-${cost} gold){/}`);
        fx({ t: 'heal', stat: 'all' });
        break;
      }
      case 'calm': {
        const before = p.san;
        p.san = Math.min(d.maxSan, p.san + (Number(v) || 0));
        if (p.san > before) log(s, `{m}+${p.san - before} sanity{/}`);
        break;
      }
      case 'heal': {
        const before = p.hp;
        p.hp = Math.min(d.maxHp, p.hp + Math.round((d.maxHp * (Number(v) || 0)) / 100));
        if (p.hp > before) log(s, `{g}+${p.hp - before} HP{/}`);
        break;
      }
    }
    return null;
  }

  function leave(s) {
    s.scene = 'explore';
    s.dialog = null;
    return true;
  }

  /* ---------- Read-only helpers for the UI (no state changes) ---------- */
  function questLog(s) {
    return Object.entries(D.quests)
      .filter(([k]) => s.p.quests[k])
      .map(([k, q]) => ({ id: k, name: q.name, giver: q.giver, desc: q.desc, short: q.short,
        status: s.p.quests[k].s, progress: questProgress(s.p, k) }));
  }

  function abilities(s) {
    const p = s.p;
    const list = (tbl, res) => Object.entries(tbl).map(([id, x]) => ({
      id, name: x.name, cost: x.cost, lvl: x.lvl, desc: x.desc, res, target: x.target || 'one',
      locked: p.lvl < x.lvl, can: p.lvl >= x.lvl && p[res] >= x.cost,
    }));
    return { skills: list(D.skills, 'st'), spells: list(D.spells, 'sp') };
  }

  function inventory(s) {
    return Object.keys(D.items).filter((id) => s.p.inv[id] > 0)
      .map((id) => Object.assign({ id, count: s.p.inv[id] }, D.items[id]));
  }

  function shopList(s) {
    const p = s.p;
    return D.shop.map((id) => {
      const w = D.weapons[id], x = w || D.items[id];
      const owned = w ? p.weapons.includes(id) : p.inv[id] || 0;
      return { id, kind: w ? 'weapon' : 'item', name: x.name, price: x.price, desc: x.desc,
        owned, can: p.gold >= x.price && !(w && owned) };
    });
  }

  // Shortest walkable route to (tx, ty) through explored tiles, as [dx, dy] steps.
  // The target may be a bump tile (NPC, chest, shop) so clicking it walks there and interacts.
  function path(s, tx, ty) {
    const p = s.p;
    if (tx === p.x && ty === p.y) return [];
    if (tx < 0 || ty < 0 || tx >= W || ty >= H) return null;
    const lit = sightOf(curMap(s)) >= 99, seen = seenArr(s, p.map), goal = ty * W + tx;
    const gt = tileAt(s, tx, ty);
    if ((!lit && !seen[goal]) || (!gt.walk && !gt.bump)) return null;
    const start = p.y * W + p.x, prev = new Int16Array(W * H).fill(-1), q = [start];
    prev[start] = start;
    for (let qi = 0; qi < q.length && prev[goal] === -1; qi++) {
      const cur = q[qi], cx = cur % W, cy = (cur / W) | 0;
      for (const [dx, dy] of DIRS) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const ni = ny * W + nx;
        if (prev[ni] !== -1 || (!lit && !seen[ni])) continue;
        const t = tileAt(s, nx, ny);
        if (ni !== goal && (!t.walk || t.exit)) continue;
        prev[ni] = cur;
        q.push(ni);
      }
    }
    if (prev[goal] === -1) return null;
    const steps = [];
    for (let c = goal; c !== start; c = prev[c]) {
      const pc = prev[c];
      steps.push([(c % W) - (pc % W), ((c / W) | 0) - ((pc / W) | 0)]);
    }
    return steps.reverse();
  }

  /* ---------- Dispatcher ---------- */
  const NOT_COMBAT = ['explore', 'shop', 'shrine', 'dialog'];
  const HANDLERS = {
    move:     [['explore'], move],
    attack:   [['combat'], combatTurn],
    skill:    [['combat'], combatTurn],
    spell:    [['combat'], combatTurn],
    defend:   [['combat'], combatTurn],
    flee:     [['combat'], combatTurn],
    use:      [['explore', 'combat', 'shop'], useItem],
    equip:    [['explore', 'shop'], equip],
    alloc:    [NOT_COMBAT, alloc],
    cosmetic: [NOT_COMBAT, wearCosmetic],
    choose:   [['dialog'], choose],
    buy:      [['shop'], buy],
    sell:     [['shop'], sell],
    pull:     [['shrine'], pull],
    leave:    [['dialog', 'shop', 'shrine'], leave],
    respawn:  [['gameover'], respawn],
  };

  function act(s, a) {
    OUT = { ok: true, msg: null, fx: [] };
    CUR = s;
    const h = a && HANDLERS[a.type];
    if (!h) fail('Unknown action.');
    else if (!h[0].includes(s.scene)) { OUT.ok = false; OUT.msg = 'wrong scene'; }
    else h[1](s, a);
    const out = OUT;
    OUT = null;
    CUR = null;
    return out;
  }

  return {
    STATS, SAVE_VERSION, W, H, data: D, tiles: TILES,
    newGame, act, save, load, note: log,
    derived, fury, conditions, xpNeed, look,
    curMap, tileAt, fov, seen: (s) => seenArr(s, s.p.map), path,
    dialogView, questLog, abilities, inventory, shopList, sellPrice,
  };
})();

if (typeof module !== 'undefined') module.exports = { Engine };
