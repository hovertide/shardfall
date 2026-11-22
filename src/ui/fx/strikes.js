'use strict';
/* =====================================================================
   SHARDFALL ui - fx/strikes.js
   Your attacks and small self effects. Each effect:
     { dur: ms, impact: 0..1 (when damage lands), draw(t, ctx) }
   ctx.target = { cx, cy, top, bottom, x0, x1 } of the enemy being hit.
   Effects draw over the combat panel (columns 1-60, rows 1-20).
   ===================================================================== */
(function () {
  const U = SF.UI, S = U.FX.strike;
  const V = U.L.VIEW, X1 = V.x + V.w - 1, Y1 = V.y + V.h - 1;
  const clip = (x, y) => x >= V.x && x <= X1 && y >= V.y && y <= Y1;
  const put = (x, y, c, col) => { if (clip(x, y)) U.put(x, y, c, col); };
  // head -> tail color ramp for streaks
  const ramp = (k, n, hot, mid, cold) => (k === 0 ? hot : k < n * 0.5 ? mid : cold);

  /* A slash streak through the target. dir 0: ╱   1: ╲   2: ━ */
  function streak(g, t, dir, cols, thick) {
    const half = Math.max(3, Math.ceil((g.bottom - g.top + 1) / 2) + 1);
    const pts = [];
    for (let k = -half; k <= half; k++) {
      if (dir === 2) pts.push([g.cx + k * 2, g.cy, '━'], [g.cx + k * 2 + 1, g.cy, '━']);
      else {
        const x = g.cx + (dir === 0 ? -k : k) * 2, y = g.cy + k;
        const c = dir === 0 ? '╱' : '╲';
        pts.push([x, y, c]);
        if (thick) pts.push([x + 1, y, c]);
      }
    }
    const n = pts.length, head = Math.floor(Math.min(1, t / 0.5) * n), fade = t > 0.5 ? (t - 0.5) / 0.5 : 0;
    const tail = Math.max(4, Math.floor(n * 0.6));
    for (let k = 0; k < head && k < n; k++) {
      const age = head - 1 - k;
      if (age > tail * (1 - fade)) continue;
      const [x, y, c] = pts[k];
      put(x, y, c, ramp(age, tail, cols[0], cols[1], cols[2]));
    }
  }
  function sparks(g, t, col, ch) {
    if (t < 0.4 || t > 0.85) return;
    const r = 1 + Math.floor((t - 0.4) * 6);
    for (const [dx, dy] of [[-2, -1], [2, -1], [-2, 1], [2, 1], [-r * 2, 0], [r * 2, 0], [0, -r], [0, r]]) put(g.cx + dx, g.cy + dy, ch || '✦', col);
  }

  const WHITE = ['#ffffff', '#fff2b0', '#a08a60'];
  const PERFECT = ['#ffffff', '#9ff8ff', '#3a8a9a'];
  const FIRE = ['#fff2b0', '#ff9a3d', '#9a3a20'];
  const pal = (ctx) => (ctx.el === 'fire' ? FIRE : ctx.q === 'perfect' ? PERFECT : WHITE);

  S.slash = { dur: 260, impact: 0.45, draw(t, ctx) {
    streak(ctx.target, t, ctx.hit % 2, pal(ctx), ctx.crit || ctx.q === 'perfect');
    if (ctx.crit) sparks(ctx.target, t, U.C.y);
  } };
  S.slash2 = { dur: 230, impact: 0.45, draw(t, ctx) {
    streak(ctx.target, t, ctx.hit % 2, pal(ctx), ctx.crit);
    if (ctx.crit) sparks(ctx.target, t, U.C.y);
  } };
  S.slash3 = { dur: 210, impact: 0.45, draw(t, ctx) {
    streak(ctx.target, t, ctx.hit % 3, pal(ctx), ctx.crit);
    if (ctx.crit) sparks(ctx.target, t, U.C.y);
  } };
  S.flameslash = { dur: 420, impact: 0.4, draw(t, ctx) {
    streak(ctx.target, Math.min(1, t * 1.4), 0, FIRE, true);
    const g = ctx.target;
    if (t > 0.35) {
      for (let k = 0; k < 9; k++) {
        const x = g.cx - 6 + Math.floor(U.hash(k, 3) * 13), rise = Math.floor((t - 0.35) * 8 * (0.5 + U.hash(k, 5)));
        put(x, g.bottom - rise, U.hash(k, 9) < 0.5 ? '▴' : '•', U.mix('#ffdd66', '#c03010', Math.min(1, rise / 6)));
      }
    }
  } };
  S.whirl = { dur: 520, impact: 0.55, draw(t, ctx) {
    // a spinning arc sweeping across every foe
    const xs = ctx.targets.length ? ctx.targets : [{ cx: 30, cy: 6 }];
    const y = Math.round(xs.reduce((a, g) => a + g.cy, 0) / xs.length);
    const front = X1 - Math.floor(t * (V.w + 2));
    for (let x = front; x < front + 14; x++) {
      const age = x - front;
      const col = age < 2 ? '#ffffff' : age < 7 ? '#fff2b0' : '#8a7a5a';
      put(x, y, age % 3 === 0 ? '═' : '─', col);
      put(x, y - 1 - (age % 2), age < 4 ? '∿' : '·', col);
      put(x, y + 1 + (age % 2), age < 4 ? '∿' : '·', col);
    }
    for (const g of ctx.targets) if (front <= g.cx && front > g.cx - 10) sparks(g, 0.5, '#ffffff', '+');
  } };
  S.hound = { dur: 260, impact: 0.5, draw(t, ctx) {
    const g = ctx.target;
    for (let k = 0; k < 3; k++) streak({ cx: g.cx - 3 + k * 3, cy: g.cy, top: g.cy - 2, bottom: g.cy + 2 }, t, 1, ['#ffffff', '#d08bff', '#6a3a8a'], false);
  } };
  S.burn = { dur: 260, draw(t, ctx) {
    const g = ctx.target;
    for (let k = 0; k < 6; k++) {
      const x = g.cx - 4 + Math.floor(U.hash(k, 11) * 9), rise = Math.floor(t * 4 * (0.6 + U.hash(k, 12)));
      put(x, g.bottom - rise, U.hash(k, 13) < 0.5 ? '▴' : '•', U.mix('#ffdd66', '#c03010', t));
    }
  } };
  S.frozen = { dur: 300, draw(t, ctx) {
    const g = ctx.target;
    for (let k = 0; k < 10; k++) {
      if (U.hash(k, Math.floor(t * 6)) < 0.5) continue;
      put(g.x0 - 1 + Math.floor(U.hash(k, 21) * (g.x1 - g.x0 + 3)), g.top + Math.floor(U.hash(k, 22) * (g.bottom - g.top + 1)), '❆', '#bfefff');
    }
  } };

  /* ---------- you, in the side panel ---------- */
  const SB = U.L.SIDE;
  S.item = { dur: 340, draw(t) {
    for (let k = 0; k < 14; k++) {
      const x = SB.x + 2 + Math.floor(U.hash(k, 31) * (SB.w - 4)), y = 8 - Math.floor(t * 6 * (0.5 + U.hash(k, 32)));
      if (y >= 2) U.put(x, y, k % 3 ? '+' : '✦', U.mix('#9fffb0', '#2a6a3a', t));
    }
  } };
  S.defend = { dur: 360, draw(t) {
    const art = ['╭──────╮', '│  ╱╲  │', '│  ╲╱  │', '╰╮    ╭╯', ' ╰────╯ '];
    const col = U.mix('#9ff8ff', '#2a5a6a', Math.max(0, t - 0.5) * 2), w = U.SIDE.weapon;
    art.forEach((ln, j) => U.text(w.cx - 4, w.bottom - 4 + j, ln, col));
  } };
  S.terror = { dur: 420, draw(t) {
    const Z = U.ZONE;
    for (let y = Z.y0; y <= Z.y1; y++) for (let x = Z.x0; x <= Z.x1; x++) {
      if (U.hash(x, y, Math.floor(t * 8)) < 0.12) U.put(x, y, '∿', U.mix('#d08bff', '#3a2a4a', t));
    }
  } };
  S.flee = { dur: 300, draw(t) {
    const Z = U.ZONE;
    for (let k = 0; k < 14; k++) {
      const x = Z.x0 + 36 + Math.floor(t * 24) + Math.floor(U.hash(k, 41) * 10), y = Z.y0 + Math.floor(U.hash(k, 42) * (Z.y1 - Z.y0 + 1));
      put(x, y, U.hash(k, 43) < 0.5 ? '·' : '∴', '#8a8a96');
    }
  } };
})();
