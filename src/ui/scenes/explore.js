'use strict';
/* =====================================================================
   SHARDFALL ui - scenes/explore.js
   The map panel: a 60 x 20 window onto maps of any size (the camera
   follows you on big maps). Water shimmers and crystals pulse. Moving
   between altitude levels slides the new map in from above or below.
   ===================================================================== */
(function () {
  const U = SF.UI, ui = U.ui;
  const VW = 60, VH = 20;   // viewport inside the panel

  // Camera: top-left map cell shown at panel cell (1,1). Small maps are centered.
  U.camera = function (s) {
    const m = Engine.map(s), p = s.p;
    const cx = m.W <= VW ? -Math.floor((VW - m.W) / 2) : Math.max(0, Math.min(m.W - VW, p.x - Math.floor(VW / 2)));
    const cy = m.H <= VH ? -Math.floor((VH - m.H) / 2) : Math.max(0, Math.min(m.H - VH, p.y - Math.floor(VH / 2)));
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

  U.drawMapPanel = function (now) {
    const s = ui.s, m = Engine.map(s), p = s.p, vis = Engine.fov(s), seen = Engine.seen(s), cam = U.camera(s);
    const title = `{c}${m.name}{/} {d}${m.danger}${m.region && m.region.levels.length > 1 ? `  alt ${m.z}` : ''}{/}`;
    U.box(0, 0, VW + 2, VH + 2, title);
    const tr = U.anim.view && U.anim.view.trans;
    // during a level change, slide the map in from where you came
    // (edge exits just fade in)
    const off = tr ? Math.round((1 - tr.t) * (tr.dir === 'up' ? VH : tr.dir === 'down' ? -VH : 0)) : 0;
    const fade = tr && tr.dir === 'edge' ? 1 - tr.t : 0;
    U.area(1, 1, VW, VH, U.region('map', (sx, sy) => U.walkTo(sx - 1 + cam.x, sy - 1 + cam.y)));
    const shimmer = Math.floor(now / 400);
    for (let sy = 0; sy < VH; sy++) {
      for (let sx = 0; sx < VW; sx++) {
        const x = sx + cam.x, y = sy + cam.y + off;
        if (x < 0 || y < 0 || x >= m.W || y >= m.H) continue;
        const i = y * m.W + x;
        if (!seen[i]) continue;
        const c = Engine.cell(s, x, y);
        let g = c.g, col = c.c;
        if (g === '~' && !c.exit && U.hash(x, y, shimmer) < 0.18) g = '-';
        if (c.glow) col = U.mix(col, '#ffffff', 0.25 + 0.25 * Math.sin(now / 300 + x));
        const lit = vis[i];
        if (fade) col = U.mix(col, '#0b0b10', fade);
        U.put(1 + sx, 1 + sy, g, lit ? col : U.dim(col), c.bg ? (lit ? c.bg : U.dim(c.bg)) : null);
      }
    }
    const L = Engine.look(p);
    if (!tr) U.put(1 + p.x - cam.x, 1 + p.y - cam.y, L.glyph, L.color);
    if (tr) {   // climb / descend label
      const verb = tr.dir === 'up' ? '^ climbing ^' : tr.dir === 'down' ? 'v descending v' : '';
      if (verb) U.center(31, 3, ` ${verb} `, U.C.c, U.BANNER_BG);
    }

    // hover: path preview + description
    const hc = ui.hover === 'map' && ui.hcell;
    if (hc && s.scene === 'explore' && !ui.overlay && !tr) {
      const tx = hc.x - 1 + cam.x, ty = hc.y - 1 + cam.y, path = Engine.path(s, tx, ty);
      if (path) {
        let x = p.x, y = p.y;
        for (const [dx, dy] of path) { x += dx; y += dy; U.fillBg(1 + x - cam.x, 1 + y - cam.y, 1, 1, '#1b2833'); }
      }
      U.fillBg(hc.x, hc.y, 1, 1, U.HOVER_BG);
      const info = tileInfo(s, tx, ty);
      if (info) { const t = ` ${info} `; U.mtext(VW + 1 - U.plainLen(t), VH + 1, t); }
    }
    // scroll hints on big maps
    if (cam.y > 0) U.text(VW - 6, 1, ' more ^', U.DIM);
    if (cam.y + VH < m.H) U.text(VW - 6, VH, ' more v', U.DIM);

    // floats pinned to map tiles
    for (const f of ui.floats) {
      if (f.mx == null || (f.map && f.map !== m.id)) continue;
      const t = (now - f.t0) / f.dur;
      if (t >= 1) continue;
      U.center(1 + f.mx - cam.x, f.my - cam.y - Math.floor(t * 2), f.text, f.color, U.BANNER_BG);
    }
  };
})();
