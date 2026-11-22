'use strict';
/* =====================================================================
   SHARDFALL engine - world.js
   Maps, movement and exploration:
     - any map size (the UI scrolls); terrain from content/tiles.js
     - per-map legends place people, chests, stairs, exits, secrets...
     - vertical travel between altitude levels (regions in content/regions.js)
     - ledges (one-way hops), steep slopes (cost stamina), cracked walls
     - fog of war, lookouts, standing stones (+1 stat point), discovery XP
   ===================================================================== */
(function () {
  const E = SF.E, D = E.D, R = E.R;

  const KIND_ORDER = ['go', 'npc', 'shrine', 'chest', 'stone', 'vista', 'sign', 'boss', 'secret'];
  const BUMP = { npc: 1, shrine: 1, chest: 1, stone: 1, vista: 1, sign: 1, boss: 1 };
  const LOOK = D.looks;   // content/looks.js
  const VOID = { key: ' ', name: '', g: ' ', c: '#000000', block: true, opaque: true };

  /* ---------- Prepare maps once at load ---------- */
  const MAPS = {};
  for (const [mk, m] of Object.entries(D.maps)) {
    const legend = m.legend || {};
    const W = Math.max(...m.rows.map((r) => r.length)), H = m.rows.length;
    const tiles = {};
    for (const k in D.tiles) tiles[k] = Object.assign({ key: k }, D.tiles[k], (m.retile || {})[k]);
    const objs = {}, marks = {}, grid = [];
    m.rows.forEach((row, y) => {
      let line = '';
      [...row.padEnd(W, '#')].forEach((ch, x) => {
        const L = legend[ch];
        if (!L) { line += ch; return; }
        const kind = KIND_ORDER.find((k) => L[k] != null) || 'sign';
        objs[x + ',' + y] = Object.assign({ kind, ch, x, y, key: `${mk}:${x},${y}` }, L);
        (marks[ch] = marks[ch] || []).push([x, y]);
        line += L.under || '.';
      });
      grid.push(line);
    });
    MAPS[mk] = { id: mk, def: m, W, H, grid, objs, marks, tiles };
  }
  E.MAPS = MAPS;
  E.BUMP = BUMP;

  E.mapOf = (s) => MAPS[s.p.map];
  E.terrain = (M, x, y) => (x < 0 || y < 0 || x >= M.W || y >= M.H ? VOID : M.tiles[M.grid[y][x]] || VOID);
  E.objAt = function (s, M, x, y) {
    const o = M.objs[x + ',' + y];
    return o && !s.world.gone[o.key] ? o : null;
  };
  const opaque = (s, M, x, y) => {
    const o = E.objAt(s, M, x, y);
    return E.terrain(M, x, y).opaque || (o && o.kind === 'secret');
  };
  function markGone(s, key) { s.world.gone[key] = 1; E.invalidateFov(); }
  const sightOf = (M) => M.def.sight || (M.def.safe ? 99 : 6);

  /* ---------- What a map cell looks like (for the UI) ---------- */
  E.cell = function (s, M, x, y) {
    const t = E.terrain(M, x, y), o = E.objAt(s, M, x, y);
    const base = { g: t.g, c: t.c, bg: t.bg || null, name: t.name, hint: t.hint || null, glow: !!t.glow, vary: t.vary || 0, shimmer: !!t.shimmer };
    if (!o) return base;
    const used = s.world.used[o.key];
    switch (o.kind) {
      case 'go': {
        const T = MAPS[String(o.go).split(':')[0]];
        const G = LOOK.go, verb = o.dir === 'up' ? 'Way up to' : o.dir === 'down' ? 'Way down to' : 'Path to';
        return { g: o.g || G[o.dir] || t.g, c: G.c, bg: o.dir ? null : G.bg, name: `{c}${verb} ${T ? T.def.name : '?'}{/}`, exit: true };
      }
      case 'npc': {
        const n = D.npcs[o.npc];
        return { g: o.g || n.glyph || '&', c: o.c || n.color || '#ffffff', name: `{${n.color || '#ffffff'}}${n.name}{/}`, glow: !!n.glow };
      }
      case 'boss': {
        const e = D.enemies[o.boss];
        return { g: o.g || e.glyph || 'M', c: o.c || e.color, name: `{r}${o.label || e.name}{/}` };
      }
      default: {
        const L = LOOK[o.kind];
        const c = used ? L.spent || '#4a5a58' : o.c || L.c;
        const name = used ? `${o.kind === 'stone' ? 'Standing stone {d}(silent now){/}' : L.name}` : L.name;
        return { g: o.g || L.g, c, name, glow: !used && !!L.glow };
      }
    }
  };

  /* ---------- Fog of war ---------- */
  E.seenArr = function (s, mk) {
    const M = MAPS[mk];
    let a = s.world.seen[mk];
    if (!a || a.length !== M.W * M.H) a = s.world.seen[mk] = new Array(M.W * M.H).fill(0);
    return a;
  };
  function clearLine(s, M, x0, y0, x1, y1) {
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy, x = x0, y = y0;
    while (x !== x1 || y !== y1) {
      if ((x !== x0 || y !== y0) && opaque(s, M, x, y)) return false;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x += sx; }
      if (e2 <= dx) { err += dx; y += sy; }
    }
    return true;
  }
  let fovKey = '', fovState = null, fovVis = null;
  E.invalidateFov = () => { fovKey = ''; };
  E.fov = function (s) {
    const p = s.p, M = MAPS[p.map], key = `${p.map}:${p.x},${p.y}`;
    if (key === fovKey && fovState === s) return fovVis;
    const r = sightOf(M), rx = r * 2, vis = new Uint8Array(M.W * M.H);   // cells are ~2x taller than wide
    if (r >= 99) vis.fill(1);
    else {
      // Glowing things (crystals, standing stones) can be seen from twice as far.
      const R2 = r * 2, RX2 = rx * 2;
      for (let y = Math.max(0, p.y - R2); y <= Math.min(M.H - 1, p.y + R2); y++) {
        for (let x = Math.max(0, p.x - RX2); x <= Math.min(M.W - 1, p.x + RX2); x++) {
          const nx = (x - p.x) / rx, ny = (y - p.y) / r, d = nx * nx + ny * ny;
          if (d > 4.2) continue;
          if (d > 1.05 && !E.cell(s, M, x, y).glow) continue;
          if (clearLine(s, M, p.x, p.y, x, y)) vis[y * M.W + x] = 1;
        }
      }
    }
    fovKey = key; fovState = s; fovVis = vis;
    return vis;
  };
  E.reveal = function (s) {
    const vis = E.fov(s), seen = E.seenArr(s, s.p.map);
    for (let i = 0; i < vis.length; i++) if (vis[i]) seen[i] = 1;
  };

  /* ---------- Movement ---------- */
  E.move = function (s, a) {
    const p = s.p, M = MAPS[p.map];
    const dx = Math.sign(a.dx | 0), dy = Math.sign(a.dy | 0);
    if (!dx && !dy) return E.fail(null);
    let nx = p.x + dx, ny = p.y + dy;
    const o = E.objAt(s, M, nx, ny);
    if (o && BUMP[o.kind]) return bump(s, M, o);
    const t = E.terrain(M, nx, ny);

    if (t.ledge) {                                  // one-way: only hop straight down
      if (dx !== 0 || dy !== 1) return E.fail(dy === -1 ? 'The ledge is too high to climb back up.' : 'A ledge. You could hop down it from above.');
      const lt = E.terrain(M, nx, ny + 1), lo = E.objAt(s, M, nx, ny + 1);
      if (lt.block || lt.ledge || (lo && lo.kind !== 'go')) return E.fail('Something blocks the way down.');
      ny += 1;
      E.fx({ t: 'hop' });
    } else if (t.block && !(o && (o.kind === 'go' || o.kind === 'secret'))) {
      return E.fail(t.msg || null);
    }

    const dest = E.terrain(M, nx, ny);
    if (dest.climb) {                               // steep slopes cost stamina (or HP if you're spent)
      if (p.st >= dest.climb) p.st -= dest.climb;
      else {
        const loss = dest.climb + 1;
        p.hp = Math.max(1, p.hp - loss);
        E.logOnce(s, `{o}Exhausted, you haul yourself up the slope.{/} {r}-${loss} HP{/} {d}(stamina refills as you walk on level ground){/}`);
        E.fx({ t: 'strain' });
      }
    }
    p.x = nx; p.y = ny; p.steps++;
    if (!dest.climb) stepRegen(s);
    poisonStep(s);

    const here = E.objAt(s, M, nx, ny);
    if (here && here.kind === 'go') return travel(s, M, here);
    if (here && here.kind === 'secret') {
      markGone(s, here.key);
      E.log(s, '{y}The cracked wall crumbles as you lean on it!{/} A hidden passage.');
      E.fx({ t: 'secret' });
    }
    E.reveal(s);
    if (p.grace > 0) p.grace--;
    else encounter(s, M, dest);
    return true;
  };

  function stepRegen(s) {
    const p = s.p, d = E.derived(p), S = p.stats, k = MAPS[p.map].def.safe ? 3 : 1;
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

  function poisonStep(s) {
    const p = s.p;
    if (!p.poison || p.steps % 3) return;
    p.hp = Math.max(1, p.hp - p.poison.dmg);
    E.log(s, `{g}Poison{/} burns in your veins. {r}-${p.poison.dmg} HP{/}`);
    if (--p.poison.turns <= 0) { p.poison = null; E.log(s, '{d}The poison fades.{/}'); }
  }

  /* ---------- Bumping into things ---------- */
  function bump(s, M, o) {
    const p = s.p;
    switch (o.kind) {
      case 'npc': {
        const n = D.npcs[o.npc];
        return n.shop ? E.openShop(s, n.shop) : E.openDialog(s, n.dialog);
      }
      case 'shrine':
        s.scene = 'shrine';
        E.log(s, '{m}The Shrine of Echoes hums.{/} Spirit shards can coax out echoes of who you might have been.');
        return true;
      case 'chest': return openChest(s, o);
      case 'stone': return touchStone(s, o);
      case 'vista': return lookout(s, M, o);
      case 'sign':
        E.logOnce(s, `{d}The sign reads:{/} ${o.sign}`);
        return true;
      case 'boss': {
        const ready = !o.needs || Object.entries(o.needs).every(([q, st]) => E.qStatus(p, q) === st);
        if (!ready) { E.logOnce(s, o.sleep || '{m}Something huge stirs, then settles. Not yet.{/}'); return true; }
        E.startCombat(s, [o.boss], { boss: true, tile: o.key });
        return true;
      }
    }
    return true;
  }

  function openChest(s, o) {
    const p = s.p, c = o.chest, got = [];
    if (c.gold) {
      const g = E.roll(s, c.gold[0], c.gold[1]);
      p.gold += g;
      got.push(`{y}+${g} gold{/}`);
    }
    if (c.shards) { p.shards += c.shards; got.push(`{m}+${c.shards} shards{/}`); }
    if (c.item) {
      const n = c.count || 1;
      p.inv[c.item] = (p.inv[c.item] || 0) + n;
      got.push(`${D.items[c.item].name}${n > 1 ? ' x' + n : ''}`);
    }
    if (c.weapon) got.push(`{w}${D.weapons[c.weapon].name}{/}`);
    const ab = c.learn ? D.skills[c.learn] || D.spells[c.learn] : null;
    if (ab) got.push(`{c}${D.skills[c.learn] ? 'Manual' : 'Tome'}: ${ab.name}{/}`);
    markGone(s, o.key);
    E.log(s, `You pry open the chest: ${got.join(', ')}.`);
    if (c.weapon) E.gainWeapon(s, c.weapon);
    if (ab) {
      p.known[c.learn] = true;
      E.log(s, `{c}You learned ${ab.name}!{/} ${ab.desc}`);
    }
    E.fx({ t: 'chest', gold: !!c.gold, learn: c.learn || null, weapon: c.weapon || null });
    return true;
  }

  function touchStone(s, o) {
    const p = s.p;
    if (s.world.used[o.key]) { E.logOnce(s, '{d}The standing stone is cold and silent now.{/}'); return true; }
    s.world.used[o.key] = 1;
    p.points += 1;
    p.stones = (p.stones || 0) + 1;
    E.log(s, '{c}A standing stone thrums with ember-light.{/} You press your palm to it and feel your potential deepen: {y}+1 stat point{/}.');
    E.fx({ t: 'stone' });
    return true;
  }

  function lookout(s, M, o) {
    for (const mk of o.reveals || [M.id]) E.seenArr(s, mk).fill(1);
    if (s.world.used[o.key]) { E.logOnce(s, `{d}${o.vista}{/}`); return true; }
    s.world.used[o.key] = 1;
    E.log(s, `{w}${o.vista}{/}`);
    if (o.reveals) E.log(s, '{c}Your map fills in with everything you can see from up here.{/}');
    E.gainXp(s, R.vistaXp, 'for the view');
    E.fx({ t: 'vista' });
    return true;
  }

  /* ---------- Travel between maps ---------- */
  function travel(s, M, o) {
    const p = s.p, [to, mark] = String(o.go).split(':'), T = MAPS[to];
    const src = M.marks[o.ch] || [], dst = (T && T.marks[mark]) || [];
    if (!dst.length) return E.fail('This path leads nowhere.');
    const k = Math.max(0, src.findIndex(([ex, ey]) => ex === o.x && ey === o.y));
    const [ex, ey] = dst[Math.min(k, dst.length - 1)];
    let at = [ex, ey];
    for (const [dx, dy] of E.DIRS) {
      const x = ex + dx, y = ey + dy, t = E.terrain(T, x, y);
      if (!t.block && !t.ledge && !E.objAt(s, T, x, y)) { at = [x, y]; break; }
    }
    const fromZ = M.def.z || 0, toZ = T.def.z || 0, same = M.def.region === T.def.region;
    const dir = same && toZ > fromZ ? 'up' : same && toZ < fromZ ? 'down' : 'edge';
    p.map = to;
    [p.x, p.y] = at;
    p.grace = 4;
    E.invalidateFov();
    E.reveal(s);
    const reg = D.regions[T.def.region] || {};
    if (dir !== 'edge' && reg.climb) E.log(s, `{d}${reg.climb[dir]}{/}`);
    E.log(s, `{c}~ ${T.def.name} ~{/} {d}(${T.def.danger}${dir !== 'edge' || (reg.levels || []).length > 1 ? `, altitude ${toZ}` : ''}){/}`);
    E.discover(s, to);
    E.fx({ t: 'travel', map: to, dir });
    return true;
  }

  E.discover = function (s, mk) {
    const p = s.p;
    if (p.visited[mk]) return;
    p.visited[mk] = 1;
    const xp = R.discoverXp * (D.maps[mk].tier || 1);
    E.gainXp(s, xp, 'for discovering a new area');
  };

  function encounter(s, M, t) {
    const m = M.def;
    if (m.safe || !m.enc || !m.rate) return;
    const rate = t.key === '.' && m.pathRate != null ? m.pathRate : m.rate * (t.danger == null ? 1 : t.danger);
    if (!E.chance(s, rate)) return;
    const keys = [E.pickWeighted(s, m.enc)];
    if (!D.enemies[keys[0]].solo) {
      const max = m.maxGroup || 2;
      while (keys.length < max && E.chance(s, 0.4)) {
        const k = E.pickWeighted(s, m.enc);
        if (!D.enemies[k].solo) keys.push(k);
      }
    }
    E.startCombat(s, keys, {});
  }

  /* ---------- Click-to-walk path ----------
     Shortest walkable route to (tx, ty) through explored tiles, as [dx, dy]
     steps. The target may be something you bump (NPC, chest) or an exit.
     Paths never use ledges or unrevealed cracked walls. */
  E.path = function (s, tx, ty) {
    const p = s.p, M = MAPS[p.map], W = M.W, H = M.H;
    if (tx === p.x && ty === p.y) return [];
    if (tx < 0 || ty < 0 || tx >= W || ty >= H) return null;
    const lit = sightOf(M) >= 99, seen = E.seenArr(s, p.map), goal = ty * W + tx;
    const ok = (x, y, isGoal) => {
      const o = E.objAt(s, M, x, y);
      if (o) return o.kind === 'secret' ? false : isGoal && (o.kind === 'go' || !!BUMP[o.kind]);
      const t = E.terrain(M, x, y);
      return !t.block && !t.ledge;
    };
    if ((!lit && !seen[goal]) || !ok(tx, ty, true)) return null;
    const start = p.y * W + p.x, prev = new Int32Array(W * H).fill(-1), q = [start];
    prev[start] = start;
    for (let qi = 0; qi < q.length && prev[goal] === -1; qi++) {
      const cur = q[qi], cx = cur % W, cy = (cur / W) | 0;
      for (const [dx, dy] of E.DIRS) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const ni = ny * W + nx;
        if (prev[ni] !== -1 || (!lit && !seen[ni])) continue;
        if (!ok(nx, ny, ni === goal)) continue;
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
  };

  /* ---------- Read-only info for the UI ---------- */
  E.mapView = function (s) {
    const M = MAPS[s.p.map], m = M.def, reg = D.regions[m.region] || null;
    return {
      id: M.id, name: m.name, danger: m.danger, W: M.W, H: M.H, z: m.z || 0, safe: !!m.safe,
      region: reg ? { id: m.region, name: reg.name, shape: reg.shape || null, levels: reg.levels } : null,
    };
  };

  // Fraction of a map's walkable cells you've seen (walkable cells cached per map).
  const OPEN = {};
  E.explored = function (s, mk) {
    const M = MAPS[mk];
    if (!OPEN[mk]) {
      OPEN[mk] = [];
      for (let y = 0; y < M.H; y++) for (let x = 0; x < M.W; x++) {
        if (!E.terrain(M, x, y).block || M.objs[x + ',' + y]) OPEN[mk].push(y * M.W + x);
      }
    }
    const seen = E.seenArr(s, mk), list = OPEN[mk];
    let n = 0;
    for (const i of list) n += seen[i] ? 1 : 0;
    return list.length ? n / list.length : 1;
  };

  E.places = function (s) {
    const p = s.p;
    return Object.keys(D.maps).filter((mk) => p.visited[mk]).map((mk) => {
      const M = MAPS[mk];
      let chests = 0, chestsOpen = 0, stones = 0, stonesUsed = 0;
      for (const o of Object.values(M.objs)) {
        if (o.kind === 'chest') { chests++; if (s.world.gone[o.key]) chestsOpen++; }
        if (o.kind === 'stone') { stones++; if (s.world.used[o.key]) stonesUsed++; }
      }
      return { id: mk, name: M.def.name, danger: M.def.danger, z: M.def.z || 0, region: M.def.region,
        explored: E.explored(s, mk), chests, chestsOpen, stones, stonesUsed };
    });
  };
})();
