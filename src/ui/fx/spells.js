'use strict';
/* =====================================================================
   SHARDFALL ui - fx/spells.js
   Spell animations. ctx.targets = enemy geometries hit by the spell,
   ctx.from = where your magic comes from (the edge of your panel).
   To add a spell animation: add U.FX.spell.name and use anim: 'name'
   in the spell's content entry.
   ===================================================================== */
(function () {
  const U = SF.UI, S = U.FX.spell;
  const clip = (x, y) => x >= 1 && x <= 61 && y >= 1 && y <= 20;
  const put = (x, y, c, col) => { if (clip(x, y)) U.put(x, y, c, col); };
  const lerp = (a, b, t) => a + (b - a) * t;

  // A projectile flying from `from` to `to` on a shallow arc, with a trail.
  function projectile(from, to, t, head, trail, cols) {
    const n = trail.length;
    for (let k = n; k >= 0; k--) {
      const tt = t - k * 0.06;
      if (tt < 0) continue;
      const x = Math.round(lerp(from.x, to.cx, tt)), y = Math.round(lerp(from.y, to.cy, tt) - Math.sin(tt * Math.PI) * 3);
      put(x, y, k === 0 ? head : trail[k - 1], cols[Math.min(cols.length - 1, k)]);
    }
  }
  // An expanding ring of sparks. cells are ~2x taller than wide, so x is stretched.
  function burst(g, t, chars, cols, R) {
    const r = Math.max(0.5, t * (R || 4));
    const steps = Math.max(8, Math.round(r * 10));
    for (let k = 0; k < steps; k++) {
      const a = (k / steps) * Math.PI * 2;
      put(Math.round(g.cx + Math.cos(a) * r * 2), Math.round(g.cy + Math.sin(a) * r), chars[k % chars.length], cols[Math.min(cols.length - 1, Math.floor(t * cols.length))]);
    }
  }

  S.fireball = { dur: 620, impact: 0.62, draw(t, ctx) {
    const g = ctx.targets[0] || { cx: 30, cy: 6 };
    if (t < 0.6) projectile(ctx.from, g, t / 0.6, '@', ['*', '+', '~', '.'], ['#fff2b0', '#ffd040', '#ff9a3d', '#c04020', '#5a2010']);
    else {
      const e = (t - 0.6) / 0.4;
      if (e < 0.35) for (let dy = -1; dy <= 1; dy++) for (let dx = -3; dx <= 3; dx++) put(g.cx + dx, g.cy + dy, 'x', '#fff2b0');
      burst(g, e, ['*', '+', '*', '.'], ['#ffffff', '#ffd040', '#ff7a2d', '#a03010'], 4);
      burst(g, Math.max(0, e - 0.2), ['.', "'"], ['#ff9a3d', '#5a2010'], 5);
    }
  } };

  S.frostwave = { dur: 720, impact: 0.7, draw(t, ctx) {
    const front = Math.round(61 - t * 64);
    for (let y = 2; y <= 13; y++) {
      const wob = Math.round(Math.sin(y * 1.3 + t * 9) * 1.5);
      for (let x = front + wob; x <= 61; x++) {
        const age = x - front - wob;
        if (age === 0) { put(x, y, '*', '#ffffff'); continue; }
        if (U.hash(x, y, 3) < Math.max(0.05, 0.45 - age * 0.02)) put(x, y, U.hash(x, y, 4) < 0.5 ? '+' : '.', age < 6 ? '#bfefff' : '#4a7a9a');
      }
    }
    if (t > 0.7) for (const g of ctx.targets) burst(g, (t - 0.7) / 0.3, ['*'], ['#ffffff', '#7fd8ff'], 3);
  } };

  S.lightning = { dur: 640, impact: 0.42, draw(t, ctx) {
    const [first, ...rest] = ctx.targets.length ? ctx.targets : [{ cx: 30, cy: 6 }];
    const flick = Math.floor(t * 20) % 2 ? '#ffffff' : '#ffe066';
    if (t < 0.6) {      // bolt from the sky
      let x = first.cx;
      const bottom = Math.round(lerp(1, first.cy, Math.min(1, t / 0.3)));
      for (let y = 1; y <= bottom; y++) {
        const step = U.hash(y, 77) < 0.5 ? -1 : 1;
        put(x, y, step < 0 ? '/' : '\\', flick);
        put(x + step, y, step < 0 ? '/' : '\\', '#a08a30');
        x += step;
      }
      if (t > 0.3) burst(first, (t - 0.3) / 0.3, ['*', '+'], ['#ffffff', '#ffe066', '#806020'], 3);
    }
    if (t > 0.35) {    // arcs jumping to the rest
      const e = Math.min(1, (t - 0.35) / 0.4);
      for (const g of rest) {
        const len = Math.round((g.cx - first.cx) * e), dir = Math.sign(len) || 1;
        for (let k = 0; k !== len; k += dir) {
          const y = Math.round(lerp(first.cy, g.cy, Math.abs(k / (g.cx - first.cx)))) + (U.hash(k, 88, Math.floor(t * 12)) < 0.3 ? -1 : 0);
          put(first.cx + k, y, U.hash(k, 89) < 0.5 ? '~' : '-', flick);
        }
        if (e >= 1) burst(g, (t - 0.75) / 0.25, ['*'], ['#ffffff', '#ffe066'], 2);
      }
    }
  } };

  S.beam = { dur: 760, impact: 0.5, draw(t, ctx) {
    const g = ctx.targets[0] || { cx: 30, cy: 6, x1: 34 };
    const y = g.cy, px = 58;
    const open = Math.min(1, t / 0.25);
    const ring = ['(', '((', '(((' ][Math.min(2, Math.floor(open * 3))];
    for (let dy = -2; dy <= 2; dy++) if (Math.abs(dy) <= Math.ceil(open * 2)) put(px + 1, y + dy, dy === 0 ? 'O' : '|', '#d08bff');
    U.text(px - ring.length + 1, y, ring, '#ffffff');
    if (t > 0.25 && t < 0.9) {
      const e = Math.min(1, (t - 0.25) / 0.2), end = Math.round(lerp(px - 2, g.cx, e));
      const flick = Math.floor(t * 24) % 2 ? '#ffffff' : '#e8b0ff';
      for (let x = px - 2; x >= end; x--) {
        put(x, y, '=', flick);
        if ((x + Math.floor(t * 30)) % 3) { put(x, y - 1, '-', '#a06ad0'); put(x, y + 1, '-', '#a06ad0'); }
      }
      if (e >= 1) burst(g, (t - 0.45) / 0.45, ['*', '+', '.'], ['#ffffff', '#d08bff', '#6a3a8a'], 4);
    }
  } };

  S.summon = { dur: 700, impact: 0.8, draw(t) {
    // spirit motes spiral in toward your panel, then a howl
    const cx = 80, cy = 17;
    for (let k = 0; k < 14; k++) {
      const a = k * 0.9 + t * 7, r = (1 - t) * (4 + (k % 4));
      U.put(Math.round(cx + Math.cos(a) * r * 2), Math.round(cy + Math.sin(a) * r), k % 3 ? '.' : '*', U.mix('#ffffff', '#d08bff', k / 14));
    }
    if (t > 0.6) U.text(cx - 3, 13, 'AWOOO!', '#d08bff');
  } };

  S.bolt = { dur: 420, impact: 0.75, draw(t, ctx) {
    const g = ctx.targets[0] || { cx: 30, cy: 6 };
    if (t < 0.75) projectile(ctx.from, g, t / 0.75, '*', ['+', '.'], ['#ffffff', '#d08bff', '#6a3a8a']);
    else burst(g, (t - 0.75) / 0.25, ['*', '.'], ['#ffffff', '#d08bff'], 2);
  } };
})();
