'use strict';
/* =====================================================================
   SHARDFALL ui - scenes/log.js
   The message log (revealed in step with combat animations), the hint
   bar along the bottom, and the big centered banners.
   ===================================================================== */
(function () {
  const U = SF.UI, ui = U.ui;
  const B = U.L.LOG, TW = B.w - 6, ROWS = B.h - 2;
  let cache = { len: -1, from: -1, last: null, lines: [] };

  function logLines(s, upto) {
    const L = s.log, last = L[upto - 1];
    if (cache.len === upto && cache.from === ui.newFrom && cache.last === last && cache.arr === L) return cache.lines;
    const lines = [];
    for (let i = Math.max(0, upto - 60); i < upto; i++) {
      const fresh = i >= ui.newFrom;
      U.wrap(L[i], TW, fresh ? U.FG : '#8a8a96').forEach((ln, k) => lines.push({ ln, mark: k === 0 && fresh ? '›' : ' ' }));
    }
    cache = { arr: L, len: upto, from: ui.newFrom, last, lines };
    return lines;
  }

  U.drawLog = function () {
    const s = ui.s;
    U.box(B.x, B.y, B.w, B.h, 'Log');
    const lines = logLines(s, Math.min(s.log.length, U.anim.logN(s)));
    ui.logScroll = Math.max(0, Math.min(ui.logScroll, lines.length - ROWS));
    const top = Math.max(0, lines.length - ROWS - ui.logScroll);
    for (let r = 0; r < ROWS && top + r < lines.length; r++) {
      const l = lines[top + r];
      U.put(B.x + 2, B.y + 1 + r, l.mark, U.C.y);
      U.drawLine(B.x + 3, B.y + 1 + r, l.ln);
    }
    if (ui.logScroll > 0) U.text(B.x + B.w - 22, B.y + B.h - 1, ` ▼ ${ui.logScroll} newer lines `, U.C.y);
  };

  U.drawBar = function () {
    const s = ui.s, y = U.L.BAR;
    let x = 1;
    const btn = (label, key, fn) => { x += U.button(x, y, label, 'bar:' + key, fn) + 2; };
    const hint = (t) => U.mtext(x, y, `{d}${t}{/}`);
    if (U.anim.busy()) return hint('[Space] or click to skip');
    switch (s.scene) {
      case 'explore':
        btn('{y}[I]{/}nventory', 'inv', () => U.openOverlay('inv'));
        btn('{y}[C]{/}haracter', 'char', () => U.openOverlay('char'));
        btn('{y}[J]{/}ournal', 'journal', () => U.openOverlay('journal'));
        btn('{y}[Q]{/}uests', 'quests', () => U.openOverlay('quests'));
        btn('{y}[O]{/}utfits', 'outfit', () => U.openOverlay('outfit'));
        btn('{y}[?]{/} Help', 'help', () => U.openOverlay('help'));
        btn('{y}[Esc]{/} Menu', 'menu', () => U.openOverlay('menu'));
        hint('click the map to walk · [1-8] use hotbar items');
        break;
      case 'combat':
        hint(ui.timing ? '[Space], [Enter] or click when the marker is in the gold zone'
          : '[1-6] choose · [Tab] or click an enemy to target · [0]/[Esc] back · click a Pack item to use it');
        break;
      case 'dialog': hint('[1-9] or click to answer · ↑↓ + Enter · [Esc] leave'); break;
      case 'shop': hint('[1-9] buy or sell · [Tab] switch tab · [Esc] leave'); break;
      case 'shrine': hint('[1] echo ×1 · [2] echo ×10 · [O] outfits · [Esc] leave'); break;
      case 'gameover': hint('[R] rise again'); break;
    }
  };

  // Big centered message over the map / combat view.
  U.bannerAt = function (text, color) {
    const V = U.L.VIEW, t = `   ${text}   `, w = [...t].length, x = V.x + Math.floor((V.w - w) / 2), y = V.y + Math.floor(V.h / 2) - 2;
    U.text(x, y - 1, ' '.repeat(w), U.FG, U.BANNER_BG);
    U.text(x, y, t, color, U.BANNER_BG);
    U.text(x, y + 1, ' '.repeat(w), U.FG, U.BANNER_BG);
  };
  U.drawBanner = function (now) {
    const b = ui.banner;
    if (b && now < b.until) U.bannerAt(b.text, b.color);
  };
})();
