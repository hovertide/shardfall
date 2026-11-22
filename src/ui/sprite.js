'use strict';
/* =====================================================================
   SHARDFALL ui - sprite.js
   Draws ASCII sprites from content/sprites with their colors, idle
   animation frames, flashes and a dissolve effect for deaths.

     U.drawSprite('wolf', cx, bottom, { color, now, flash, dissolve, dy })
   anchors the sprite by its bottom-center.
   ===================================================================== */
(function () {
  const U = SF.UI, D = SF.data;

  // stable pseudo-random number per cell (for dissolves and sparkles)
  U.hash = function (x, y, k) {
    let h = (x * 374761393 + y * 668265263 + (k || 0) * 2147483647) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };

  U.sprite = (id) => D.sprites[id] || null;

  U.spriteFrame = function (sp, now, speed) {
    if (!sp || sp.frames.length < 2 || now == null) return sp ? sp.frames[0] : [];
    return sp.frames[Math.floor(now / (speed || 650)) % sp.frames.length];
  };

  // opt: color, now (for idle frames), speed, frame (fixed index), flash (color),
  //      dissolve (0..1), dim (bool), dx/dy offsets, region, clip {x0,y0,x1,y1}
  U.drawSprite = function (id, cx, bottom, opt = {}) {
    const sp = U.sprite(id);
    if (!sp) return null;
    const lines = opt.frame != null ? sp.frames[opt.frame % sp.frames.length] : U.spriteFrame(sp, opt.now, opt.speed);
    const w = sp.w, h = lines.length;
    const x0 = cx - Math.floor(w / 2) + (opt.dx || 0), y0 = bottom - h + 1 + (opt.dy || 0);
    const base = opt.color || U.FG, tint = sp.tint || {}, bands = sp.bands || null, clip = opt.clip;
    lines.forEach((ln, j) => {
      for (let i = 0; i < ln.length; i++) {
        const c = ln[i];
        if (c === ' ') continue;
        const x = x0 + i, y = y0 + j;
        if (clip && (x < clip.x0 || x > clip.x1 || y < clip.y0 || y > clip.y1)) continue;
        let col = tint[c] || base;
        if (bands) for (const [a, b, bc] of bands) if (i >= a && i < b) { col = tint[c] || bc; break; }
        if (opt.dissolve) {
          const r = U.hash(x, y, 7);
          if (r < opt.dissolve) continue;
          if (r < opt.dissolve + 0.25) { U.put(x, y, r < opt.dissolve + 0.12 ? '.' : ':', U.dim(col), null, opt.region); continue; }
          col = U.mix(col, '#34343e', opt.dissolve);
        }
        if (opt.flash) col = opt.flash;
        else if (opt.dim) col = U.dim(col);
        U.put(x, y, c, col, null, opt.region);
      }
    });
    return { x0, y0, w, h, cx: x0 + Math.floor(w / 2), cy: y0 + Math.floor(h / 2) };
  };
})();
