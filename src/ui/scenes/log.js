'use strict';
/* =====================================================================
   SHARDFALL ui - scenes/log.js
   The message log (revealed in step with combat animations) and the
   hint bar along the bottom of the screen.
   ===================================================================== */
(function () {
  const U = SF.UI, ui = U.ui;
  let cache = { len: -1, from: -1, last: null, lines: [] };

  function logLines(s, upto) {
    const L = s.log, last = L[upto - 1];
    if (cache.len === upto && cache.from === ui.newFrom && cache.last === last && cache.arr === L) return cache.lines;
    const lines = [];
    for (let i = Math.max(0, upto - 60); i < upto; i++) {
      const fresh = i >= ui.newFrom;
      U.wrap(L[i], U.COLS - 6, fresh ? U.FG : '#8a8a96').forEach((ln, k) => lines.push({ ln, mark: k === 0 && fresh ? '>' : ' ' }));
    }
    cache = { arr: L, len: upto, from: ui.newFrom, last, lines };
    return lines;
  }

  U.drawLog = function () {
    const s = ui.s;
    U.box(0, 22, U.COLS, 11, 'Log');
    const lines = logLines(s, Math.min(s.log.length, U.anim.logN(s))), rows = 9;
    ui.logScroll = Math.max(0, Math.min(ui.logScroll, lines.length - rows));
    const top = Math.max(0, lines.length - rows - ui.logScroll);
    for (let r = 0; r < rows && top + r < lines.length; r++) {
      const l = lines[top + r];
      U.put(2, 23 + r, l.mark, U.C.y);
      U.drawLine(3, 23 + r, l.ln);
    }
    if (ui.logScroll > 0) U.text(U.COLS - 22, 32, ` v ${ui.logScroll} newer lines `, U.C.y);
  };

  U.drawBar = function () {
    const s = ui.s;
    let x = 1;
    const btn = (label, key, fn) => { x += U.button(x, 33, label, 'bar:' + key, fn) + 2; };
    const hint = (t) => U.mtext(x, 33, `{d}${t}{/}`);
    if (U.anim.busy()) return hint('[Space] or click to skip');
    switch (s.scene) {
      case 'explore':
        btn('{y}[I]{/}tems', 'inv', () => U.openOverlay('inv'));
        btn('{y}[C]{/}haracter', 'char', () => U.openOverlay('char'));
        btn('{y}[J]{/}ournal', 'journal', () => U.openOverlay('journal'));
        btn('{y}[Q]{/}uests', 'quests', () => U.openOverlay('quests'));
        btn('{y}[O]{/}utfits', 'outfit', () => U.openOverlay('outfit'));
        btn('{y}[?]{/}', 'help', () => U.openOverlay('help'));
        btn('{y}[Esc]{/} Menu', 'menu', () => U.openOverlay('menu'));
        hint('click map to walk');
        break;
      case 'combat':
        hint(ui.timing ? '[Space], [Enter] or click when the marker is in the gold zone'
          : '[1-6] choose - [Tab] or click an enemy to target - [0]/[Esc] back - wheel scrolls the log');
        break;
      case 'dialog': hint('[1-9] or click to answer - Up/Down + Enter - [Esc] leave'); break;
      case 'shop': hint('[1-9] buy or sell - [Tab] switch tab - [Esc] leave'); break;
      case 'shrine': hint('[1] echo x1 - [2] echo x10 - [O] outfits - [Esc] leave'); break;
      case 'gameover': hint('[R] rise again'); break;
    }
  };

  U.drawBanner = function (now) {
    const b = ui.banner;
    if (!b || now >= b.until) return;
    const t = `   ${b.text}   `, x = 1 + Math.floor((60 - t.length) / 2), y = 10;
    U.text(x, y - 1, ' '.repeat(t.length), U.FG, U.BANNER_BG);
    U.text(x, y, t, b.color, U.BANNER_BG);
    U.text(x, y + 1, ' '.repeat(t.length), U.FG, U.BANNER_BG);
  };
})();
