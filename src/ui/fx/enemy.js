'use strict';
/* =====================================================================
   SHARDFALL ui - fx/enemy.js
   Enemy move animations. You are the "camera", so attacks land on the
   lower part of the combat panel (ctx.zone, rows 15-20).
     ctx.src  = the attacking enemy's geometry    ctx.heavy = telegraphed move
   `lunge(t)` (optional) moves the enemy sprite toward you, in rows.
   ===================================================================== */
(function () {
  const U = SF.UI, S = U.FX.enemy;
  const clip = (x, y) => x >= 1 && x <= 60 && y >= 1 && y <= 20;
  const put = (x, y, c, col) => { if (clip(x, y)) U.put(x, y, c, col); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const lunge = (t) => (t > 0.15 && t < 0.6 ? (t > 0.3 && t < 0.5 ? 2 : 1) : 0);
  const zc = (z) => ({ x: Math.round((z.x0 + z.x1) / 2), y: Math.round((z.y0 + z.y1) / 2) });

  function impactStar(x, y, t, big, col) {
    if (t < 0.42 || t > 0.85) return;
    const r = big ? 2 : 1;
    const c = col || '#ff6b6b';
    put(x, y, '*', '#ffffff');
    for (let k = 1; k <= r; k++) {
      put(x - k * 2, y, '-', c); put(x + k * 2, y, '-', c);
      put(x, y - k, '|', c); put(x, y + k, '|', c);
      put(x - k * 2, y - k, '\\', c); put(x + k * 2, y + k, '\\', c);
      put(x + k * 2, y - k, '/', c); put(x - k * 2, y + k, '/', c);
    }
  }
  function particles(from, to, t, ch, col) {
    for (let k = 0; k < 8; k++) {
      const tt = t * 1.4 - k * 0.07;
      if (tt < 0 || tt > 1) continue;
      const x = Math.round(lerp(from.x + (k % 3) * 2 - 2, to.cx, tt)), y = Math.round(lerp(from.y, to.cy, tt) - Math.sin(tt * Math.PI) * 2);
      put(x, y, ch, col);
    }
  }

  S.bump = { dur: 380, impact: 0.45, lunge, draw(t, ctx) { const c = zc(ctx.zone); impactStar(c.x, c.y, t, ctx.heavy); } };
  S.smash = { dur: 520, impact: 0.5, lunge, draw(t, ctx) {
    const c = zc(ctx.zone);
    impactStar(c.x, c.y, t, true, '#ff9a3d');
    if (t > 0.45 && t < 0.9) {
      U.ui.shake = Math.max(U.ui.shake, performance.now() + 60);
      for (let k = 0; k < 6; k++) {   // cracks
        const dir = k < 3 ? -1 : 1, len = 3 + Math.floor(U.hash(k, 5) * 5);
        for (let j = 1; j <= len; j++) put(c.x + dir * (j * 2 + 3), c.y + ((k % 3) - 1) + (j % 2 ? 0 : (k % 3) - 1), j % 2 ? '/' : '\\', '#8a5a3a');
      }
    }
  } };
  S.bite = { dur: 420, impact: 0.5, lunge, draw(t, ctx) {
    const c = zc(ctx.zone), w = ctx.heavy ? 14 : 10;
    const close = Math.min(1, t / 0.5), open = t > 0.7 ? (t - 0.7) / 0.3 : 0;
    const top = Math.round(lerp(ctx.zone.y0 - 1, c.y - 1, close - open)), bot = Math.round(lerp(ctx.zone.y1 + 1, c.y + 1, close - open));
    for (let k = -w; k <= w; k += 2) { put(c.x + k, top, 'V', '#ffffff'); put(c.x + k + 1, bot, '^', '#ffffff'); }
    if (t > 0.45) impactStar(c.x, c.y, t, ctx.heavy);
  } };
  S.claw = { dur: 380, impact: 0.5, lunge, draw(t, ctx) {
    const c = zc(ctx.zone), n = Math.floor(Math.min(1, t / 0.5) * 6), fade = t > 0.6;
    for (let s = -1; s <= 1; s++) for (let k = 0; k < n; k++) {
      put(c.x + s * 5 - 6 + k * 2, ctx.zone.y0 + k, '\\', fade ? '#8a2a2a' : k === n - 1 ? '#ffffff' : '#ff5c5c');
    }
  } };
  S.slash = { dur: 400, impact: 0.5, lunge, draw(t, ctx) {
    const c = zc(ctx.zone), n = Math.floor(Math.min(1, t / 0.5) * 14), span = ctx.heavy ? 2 : 1;
    for (let k = 0; k < n; k++) for (let d = 0; d < span; d++) {
      put(c.x + 14 - k * 2 + d, ctx.zone.y0 - 1 + Math.floor(k / 2), '/', k === n - 1 ? '#ffffff' : t > 0.65 ? '#7a2a2a' : '#ff8080');
    }
  } };
  S.gust = { dur: 460, impact: 0.55, lunge, draw(t, ctx) {
    for (let y = ctx.zone.y0; y <= ctx.zone.y1; y++) {
      const off = Math.floor(t * 80) + y * 7;
      for (let x = 1; x <= 60; x++) if ((x + off) % 9 < 3) put(x, y, (x + off) % 9 === 1 ? '~' : '-', U.mix('#ffffff', '#5a7a9a', ((x + off) % 9) / 3));
    }
  } };
  S.dread = { dur: 560, impact: 0.5, draw(t, ctx) {
    const col = ctx.color || '#d08bff';
    for (let y = 1; y <= 20; y++) {
      const amp = Math.sin(t * Math.PI);
      for (let x = 1; x <= 60; x++) {
        const v = Math.sin(x * 0.35 + y * 0.8 - t * 14);
        if (v > 1 - amp * 0.5) put(x, y, '~', U.mix(col, '#2a1a3a', 1 - amp));
      }
    }
  } };
  S.drain = { dur: 520, impact: 0.45, lunge, draw(t, ctx) {
    const c = zc(ctx.zone);
    impactStar(c.x, c.y, Math.min(t, 0.6), false, '#ff6b6b');
    if (t > 0.4) particles(c, ctx.src, (t - 0.4) / 0.6, '*', '#ff4060');
  } };
  S.sap = { dur: 500, impact: 0.4, draw(t, ctx) { particles({ x: 62, y: 7 }, ctx.src, t, '*', '#5ca8ff'); } };
  S.steal = { dur: 520, impact: 0.4, lunge, draw(t, ctx) { particles({ x: 62, y: 7 }, ctx.src, t, '$', '#ffd866'); } };
  S.guard = { dur: 380, impact: 0.5, draw(t, ctx) {
    const g = ctx.src, col = U.mix('#9fd8ff', '#2a4a6a', Math.max(0, t - 0.5) * 2);
    U.text(g.cx - 2, g.cy - 1, '.--.', col); U.text(g.cx - 3, g.cy, '| ## |', col); U.text(g.cx - 2, g.cy + 1, "'--'", col);
  } };
  S.heal = { dur: 420, impact: 0.5, draw(t, ctx) {
    const g = ctx.src;
    for (let k = 0; k < 8; k++) put(g.x0 + Math.floor(U.hash(k, 61) * (g.x1 - g.x0 + 1)), g.bottom - Math.floor(t * 6 * (0.5 + U.hash(k, 62))), '+', U.mix('#9fffb0', '#2a6a3a', t));
  } };
  S.charge = { dur: 480, impact: 0.5, draw(t, ctx) {
    const g = ctx.src;
    for (let k = 0; k < 12; k++) {
      const a = k * 0.52 + t * 6, r = 1 + (1 - t) * 3;
      put(Math.round(g.cx + Math.cos(a) * (g.x1 - g.x0) * 0.4 * r / 2), Math.round(g.cy + Math.sin(a) * r), k % 2 ? '*' : '.', '#ffe066');
    }
  } };
  S.bolt = { dur: 480, impact: 0.45, draw(t, ctx) {
    const c = zc(ctx.zone);
    let x = ctx.src.cx;
    const flick = Math.floor(t * 18) % 2 ? '#ffffff' : '#ffe066';
    for (let y = ctx.src.bottom + 1; y <= Math.round(lerp(ctx.src.bottom + 1, c.y, Math.min(1, t / 0.4))); y++) {
      const st = U.hash(y, 7) < 0.5 ? -1 : 1;
      put(x, y, st < 0 ? '/' : '\\', flick);
      x += st;
    }
    impactStar(c.x, c.y, t, true, '#ffe066');
  } };
  S.poison = { dur: 420, impact: 0.45, lunge, draw(t, ctx) {
    const z = ctx.zone;
    for (let k = 0; k < 14; k++) {
      const x = z.x0 + 4 + Math.floor(U.hash(k, 71) * (z.x1 - z.x0 - 8)), y = z.y0 + Math.floor((t * 1.5 + U.hash(k, 72)) * 6) % 6;
      put(x, y, U.hash(k, 73) < 0.5 ? ',' : '.', '#8fdc4f');
    }
  } };
})();
