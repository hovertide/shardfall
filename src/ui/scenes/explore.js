'use strict';
/* =====================================================================
   SHARDFALL ui - scenes/explore.js
   The map panel: a window onto maps of any size (the camera follows you
   on big maps; small maps are centered). Tiles get a little random
   brightness for texture, water shimmers and crystals pulse. Moving
   between altitude levels slides the new map in from above or below.
   ===================================================================== */
(function () {
  const U = SF.UI, ui = U.ui;
  const V = U.L.VIEW;

  // Camera: map cell shown at the top-left of the view.
  U.camera = function (s) {
    const m = Engine.map(s), p = s.p;
    const cx = m.W <= V.w ? -Math.floor((V.w - m.W) / 2) : Math.max(0, Math.min(m.W - V.w, p.x - Math.floor(V.w / 2)));
    const cy = m.H <= V.h ? -Math.floor((V.h - m.H) / 2) : Math.max(0, Math.min(m.H - V.h, p.y - Math.floor(V.h / 2)));
    return { x: cx, y: cy, W: m.W, H: m.H };
  };

  function tileInfo(s, x, y) {
    const m = Engine.map(s);
    if (x < 0 || y < 0 || x >= m.W || y >= m.H) return null;
    if (!Engine.seen(s)[y * m.W + x]) return '{d}Unexplored{/}';
    if (x === s.p.x && y === s.p.y) return `${s.p.name} {d}(you){/}`;
    const c = Engine.cell(s, x, y);
    return c.name + (c.hint ? ` {d}(${c.hint}){/}` : '');
  }

  const SHIMMER = { '≈': '~', '∽': '~' };
  const texCache = {};
  function texture(col, x, y, vary) {
    const h = U.hash(x, y, 3), k = col + Math.round(h * 8);
    return texCache[k] || (texCache[k] = U.mix(col, h < 0.5 ? '#000000' : '#ffffff', Math.abs(Math.round(h * 8) / 8 - 0.5) * 2 * vary));
  }

  U.drawMapPanel = function (now) {
    const s = ui.s, m = Engine.map(s), p = s.p, vis = Engine.fov(s), seen = Engine.seen(s), cam = U.camera(s), M = U.L.MAP;
    const title = `{c}${m.name}{/} {d}${m.danger}${m.region && m.region.levels.length > 1 ? `  ·  altitude ${m.z}` : ''}{/}`;
    U.box(M.x, M.y, M.w, M.h, title);
    const tr = U.anim.view && U.anim.view.trans;
    // during a level change, slide the map in from where you came (edge exits just fade in)
    const off = tr ? Math.round((1 - tr.t) * (tr.dir === 'up' ? V.h : tr.dir === 'down' ? -V.h : 0)) : 0;
    const fade = tr && tr.dir === 'edge' ? 1 - tr.t : 0;
    U.area(V.x, V.y, V.w, V.h, U.region('map', (sx, sy) => U.walkTo(sx - V.x + cam.x, sy - V.y + cam.y)));
    const shimmer = Math.floor(now / 400);
    for (let sy = 0; sy < V.h; sy++) {
      for (let sx = 0; sx < V.w; sx++) {
        const x = sx + cam.x, y = sy + cam.y + off;
        if (x < 0 || y < 0 || x >= m.W || y >= m.H) continue;
        const i = y * m.W + x;
        if (!seen[i]) continue;
        const c = Engine.cell(s, x, y);
        let g = c.g, col = c.c;
        if (c.shimmer && !c.exit && U.hash(x, y, shimmer) < 0.18) g = SHIMMER[g] || g;
        if (c.vary) col = texture(col, x, y, c.vary);
        if (c.glow) col = U.mix(col, '#ffffff', 0.25 + 0.25 * Math.sin(now / 300 + x));
        if (fade) col = U.mix(col, '#0b0b10', fade);
        const lit = vis[i];
        U.put(V.x + sx, V.y + sy, g, lit ? col : U.dim(col), c.bg ? (lit ? c.bg : U.dim(c.bg)) : null);
      }
    }
    const L = Engine.look(p);
    if (!tr) U.put(V.x + p.x - cam.x, V.y + p.y - cam.y, L.glyph, L.color);
    if (tr) {
      const verb = tr.dir === 'up' ? '▲ climbing ▲' : tr.dir === 'down' ? '▼ descending ▼' : '';
      if (verb) U.center(V.x + V.w / 2, V.y + 2, ` ${verb} `, U.C.c, U.BANNER_BG);
    }

    // hover: path preview + description along the bottom border
    const hc = ui.hover === 'map' && ui.hcell;
    if (hc && s.scene === 'explore' && !ui.overlay && !tr) {
      const tx = hc.x - V.x + cam.x, ty = hc.y - V.y + cam.y, path = Engine.path(s, tx, ty);
      if (path) {
        let x = p.x, y = p.y;
        for (const [dx, dy] of path) { x += dx; y += dy; U.fillBg(V.x + x - cam.x, V.y + y - cam.y, 1, 1, '#1b2833'); }
      }
      U.fillBg(hc.x, hc.y, 1, 1, U.HOVER_BG);
      const info = tileInfo(s, tx, ty);
      if (info) { const t = ` ${info} `; U.mtext(M.x + M.w - 2 - U.plainLen(t), M.y + M.h - 1, t); }
    }
    if (cam.y > 0) U.small(V.x + V.w - 5, V.y, 'more ▲', U.DIM);
    if (cam.y + V.h < m.H) U.small(V.x + V.w - 5, V.y + V.h - 0.5, 'more ▼', U.DIM);

    // floats pinned to map tiles
    for (const f of ui.floats) {
      if (f.mx == null || (f.map && f.map !== m.id)) continue;
      const t = (now - f.t0) / f.dur;
      if (t >= 1) continue;
      U.center(V.x + f.mx - cam.x, V.y + f.my - cam.y - 1 - Math.floor(t * 2), f.text, f.color, U.BANNER_BG);
    }
  };
})();
