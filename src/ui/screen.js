'use strict';
/* =====================================================================
   SHARDFALL ui - screen.js
   The game draws onto a 128 x 42 grid of colored characters, plus a
   second FINE grid on top at half the font size (256 x 84) for tiny
   text: slot counts, item names, tooltips, small labels.

   Every frame: clear() -> scenes draw into buffers -> flush() turns
   each row into HTML and only rewrites rows that changed.
     U.put / U.text / U.mtext      normal-size text, in main cells
     U.small / U.msmall            half-size text; x, y in main cells,
                                   may be x.5 / y.5 for half-cell offsets
   The two layers are "last writer wins" per main cell: tiny text blanks
   the big character under it, and drawing a big character (or a modal)
   later erases tiny text under it.

   No emoji, ever: every non-ASCII symbol gets U+FE0E (text style) and
   the page asks for text-style emoji glyphs in CSS.
   ===================================================================== */
(function () {
  const U = SF.UI;
  const COLS = 128, ROWS = 42, N = COLS * ROWS;
  const FCOLS = COLS * 2, FROWS = ROWS * 2, FN = FCOLS * FROWS;

  // Where everything goes. Boxes include their border.
  const L = {
    MAP: { x: 0, y: 0, w: 66, h: 26 },
    SIDE: { x: 66, y: 0, w: 62, h: 26 },
    LOG: { x: 0, y: 26, w: 78, h: 15 },
    PACK: { x: 78, y: 26, w: 50, h: 15 },
    BAR: 41,
  };
  L.VIEW = { x: L.MAP.x + 1, y: L.MAP.y + 1, w: L.MAP.w - 2, h: L.MAP.h - 2 };   // inside the map panel

  Object.assign(U, {
    COLS, ROWS, L,
    FG: '#c8c8d0', DIM: '#6a6a78', MODAL_BG: '#13131b', HOVER_BG: '#2c2c40', SEL_BG: '#1f2d47', BANNER_BG: '#1a1a2a',
    C: { r: '#ff5c5c', g: '#6bdc6b', b: '#5ca8ff', c: '#5fe0e0', m: '#d08bff', y: '#ffd866', o: '#ff9a4a', w: '#ffffff', d: '#7a7a88' },
    FRAMES: { single: '┌┐└┘─│├┤', double: '╔╗╚╝═║╠╣', rounded: '╭╮╰╯─│├┤', heavy: '┏┓┗┛━┃┣┫', ascii: '++++-|++' },
    settings: { timed: true, fast: false },
  });
  const { FG, C } = U;

  /* ---------- DOM: a stage holding the main grid and the fine grid ---------- */
  const screen = document.getElementById('screen');
  const stage = document.createElement('div');
  stage.id = 'stage';
  screen.parentNode.insertBefore(stage, screen);
  stage.appendChild(screen);
  const fine = document.createElement('pre');
  fine.id = 'fine';
  stage.appendChild(fine);
  const css = document.createElement('style');
  css.textContent =
    '#stage{position:relative}' +
    '#screen,#fine{font-variant-emoji:text}' +
    '#fine{position:absolute;left:0;top:0;margin:0;pointer-events:none;white-space:pre;line-height:1.15;font-family:inherit}' +
    '#screen div,#fine div{height:1.15em;overflow:hidden}' +
    '#screen div span,#fine div span{display:inline-block;height:1.15em;vertical-align:top}' +
    '#screen i,#fine i{display:inline-block;width:1ch;font-style:normal;text-align:center;overflow:hidden;vertical-align:top}';
  document.head.appendChild(css);
  fine.style.fontFamily = getComputedStyle(screen).fontFamily;

  function makeRows(el, n) {
    el.textContent = '';
    const rows = [];
    for (let y = 0; y < n; y++) { const d = document.createElement('div'); el.appendChild(d); rows.push(d); }
    return rows;
  }
  const rowEls = makeRows(screen, ROWS), rowHTML = new Array(ROWS).fill('');
  const fineEls = makeRows(fine, FROWS), fineHTML = new Array(FROWS).fill('');
  U.screenEl = screen;
  U.fineEl = fine;

  /* ---------- Buffers ---------- */
  const ch = new Array(N), fg = new Array(N), bg = new Array(N), rg = new Int16Array(N);
  const fch = new Array(FN), ffg = new Array(FN), fbg = new Array(FN);
  const fmark = new Uint8Array(N);              // main cells that currently hold tiny text
  const fUsed = new Uint8Array(FROWS), fWas = new Uint8Array(FROWS);
  U.regions = [];
  U.rg = rg;

  U.clear = function () {
    ch.fill(' '); fg.fill(FG); bg.fill(null); rg.fill(-1); U.regions = [];
    fch.fill(' '); ffg.fill(FG); fbg.fill(null); fmark.fill(0);
    fWas.set(fUsed); fUsed.fill(0);
  };

  function eraseFine(i) {   // a big character landed on this main cell: drop tiny text under it
    fmark[i] = 0;
    const x = (i % COLS) * 2, y = ((i / COLS) | 0) * 2;
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const j = (y + dy) * FCOLS + x + dx; fch[j] = ' '; fbg[j] = null; }
  }

  U.put = function (x, y, c, f, b, r) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
    const i = y * COLS + x;
    if (fmark[i]) eraseFine(i);
    ch[i] = c;
    fg[i] = f || FG;
    if (b) bg[i] = b;
    if (r != null && r >= 0) rg[i] = r;
  };
  U.peek = (x, y) => (x < 0 || y < 0 || x >= COLS || y >= ROWS ? null : { c: ch[y * COLS + x], f: fg[y * COLS + x] });

  U.text = function (x, y, str, f, b, r, max) {
    str = String(str);
    if (max != null && str.length > max) str = str.slice(0, Math.max(0, max - 1)) + '…';
    let n = 0;
    for (const c of str) U.put(x + n++, y, c, f, b, r);
    return n;
  };

  U.fillBg = function (x, y, w, h, color) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      if (xx >= 0 && yy >= 0 && xx < COLS && yy < ROWS) bg[yy * COLS + xx] = color;
    }
  };
  U.blank = function (x, y, w, h, color) {   // wipe a rectangle (characters, tiny text, colors, clicks)
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      if (xx < 0 || yy < 0 || xx >= COLS || yy >= ROWS) continue;
      const i = yy * COLS + xx;
      if (fmark[i]) eraseFine(i);
      ch[i] = ' '; fg[i] = FG; bg[i] = color || null; rg[i] = -1;
    }
  };

  U.region = function (key, fn, alt) { U.regions.push({ key, fn, alt }); return U.regions.length - 1; };
  U.area = function (x, y, w, h, r) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      if (xx >= 0 && yy >= 0 && xx < COLS && yy < ROWS) rg[yy * COLS + xx] = r;
    }
  };

  /* ---------- Tiny text ---------- */
  function fput(fx, fy, c, f, b) {
    if (fx < 0 || fy < 0 || fx >= FCOLS || fy >= FROWS) return;
    const j = fy * FCOLS + fx, i = (fy >> 1) * COLS + (fx >> 1);
    if (!fmark[i]) { fmark[i] = 1; ch[i] = ' '; }   // the big character under it goes away
    fch[j] = c; ffg[j] = f || FG;
    if (b) fbg[j] = b;
    fUsed[fy] = 1;
  }
  U.small = function (x, y, str, f, b, max) {
    let fx = Math.round(x * 2), n = 0;
    const fy = Math.round(y * 2);
    for (const c of String(str)) {
      if (max != null && n >= max) break;
      fput(fx + n++, fy, c, f, b);
    }
    return n / 2;     // width in main cells
  };
  U.msmall = function (x, y, str, base, b, max) {
    let fx = Math.round(x * 2), n = 0;
    const fy = Math.round(y * 2);
    for (const sg of U.segs(String(str), base || FG)) {
      for (const c of sg.t) {
        if (max != null && n >= max) return n / 2;
        fput(fx + n++, fy, c, sg.c, b);
      }
    }
    return n / 2;
  };
  U.smallLen = (str) => U.plainLen(str) / 2;

  /* ---------- HTML ---------- */
  // Symbols that some systems draw as emoji are forced to text style (U+FE0E).
  const EMOJI = /\p{Emoji}/u;
  const escCache = {};
  function esc(c) {
    if (c === '<') return '&lt;';
    if (c === '>') return '&gt;';
    if (c === '&') return '&amp;';
    const n = c.codePointAt(0);
    if (n <= 0x7e) return c;
    if (n >= 0x2500 && n <= 0x259f) return c;              // box drawing and blocks: font-native, always text
    return escCache[c] || (escCache[c] = `<i>${c}${EMOJI.test(c) ? '︎' : ''}</i>`);
  }
  function rowHtml(chs, fgs, bgs, base, width, rgs) {
    let html = '', x = 0;
    while (x < width) {
      const i = base + x, f = fgs[i], b = bgs[i], click = rgs ? rgs[i] >= 0 : false;
      let run = '';
      while (x < width) {
        const j = base + x;
        if ((fgs[j] !== f && chs[j] !== ' ') || bgs[j] !== b || (rgs ? rgs[j] >= 0 : false) !== click) break;
        run += esc(chs[j]);
        x++;
      }
      html += `<span style="color:${f}${b ? ';background:' + b : ''}"${click ? ' data-r' : ''}>${run}</span>`;
    }
    return html;
  }
  U.flush = function () {
    for (let y = 0; y < ROWS; y++) {
      const html = rowHtml(ch, fg, bg, y * COLS, COLS, rg);
      if (html !== rowHTML[y]) { rowHTML[y] = html; rowEls[y].innerHTML = html; }
    }
    for (let y = 0; y < FROWS; y++) {
      if (!fUsed[y] && !fWas[y]) continue;                  // only rows with tiny text (now or last frame)
      const html = fUsed[y] ? rowHtml(fch, ffg, fbg, y * FCOLS, FCOLS, null) : '';
      if (html !== fineHTML[y]) { fineHTML[y] = html; fineEls[y].innerHTML = html; }
    }
  };

  /* ---------- Color markup: {r}red{/}, {#rrggbb}any{/} ---------- */
  const MARK = /\{(#[0-9a-fA-F]{6}|[rgbcmyowd]|\/)\}/g;
  U.segs = function (str, base) {
    const out = [], stack = [base];
    let last = 0, m;
    MARK.lastIndex = 0;
    while ((m = MARK.exec(str))) {
      if (m.index > last) out.push({ t: str.slice(last, m.index), c: stack[stack.length - 1] });
      if (m[1] === '/') { if (stack.length > 1) stack.pop(); }
      else stack.push(m[1][0] === '#' ? m[1] : C[m[1]]);
      last = MARK.lastIndex;
    }
    if (last < str.length) out.push({ t: str.slice(last), c: stack[stack.length - 1] });
    return out;
  };
  U.plainLen = (str) => [...String(str).replace(MARK, '')].length;
  U.strip = (str) => String(str).replace(MARK, '');

  U.mtext = function (x, y, str, base, b, r, max) {
    let n = 0;
    for (const sg of U.segs(String(str), base || FG)) {
      for (const c of sg.t) {
        if (c === '\n') continue;
        if (max != null && n >= max) return n;
        U.put(x + n++, y, c, sg.c, b, r);
      }
    }
    return n;
  };

  // Word-wrap markup text into lines of colored segments.
  U.wrap = function (str, width, base) {
    const lines = [[]];
    let col = 0;
    const push = (t, c) => { lines[lines.length - 1].push({ t, c }); col += [...t].length; };
    for (const sg of U.segs(String(str), base || FG)) {
      for (const part of sg.t.split(/(\n| +)/)) {
        if (!part) continue;
        if (part === '\n') { lines.push([]); col = 0; continue; }
        if (part[0] === ' ') { if (col > 0 && col + part.length < width) push(part, sg.c); continue; }
        let word = part;
        if (col > 0 && col + [...word].length > width) { lines.push([]); col = 0; }
        while ([...word].length > width) { push(word.slice(0, width), sg.c); lines.push([]); col = 0; word = word.slice(width); }
        push(word, sg.c);
      }
    }
    return lines;
  };

  U.drawLine = function (x, y, line, b, r) {
    let n = 0;
    for (const sg of line) for (const c of sg.t) U.put(x + n++, y, c, sg.c, b, r);
    return n;
  };
  U.drawSmallLine = function (x, y, line) {   // a wrapped line in tiny text (wrap at 2x the width)
    let n = 0;
    for (const sg of line) for (const c of sg.t) { U.small(x + n / 2, y, c, sg.c); n++; }
    return n / 2;
  };

  /* ---------- Widgets ---------- */
  U.frame = () => (U.ui && U.ui.s ? Engine.look(U.ui.s.p).frame : { style: 'single', color: '#4a4a60' });

  U.box = function (x, y, w, h, title, opt = {}) {
    const fr = U.frame(), F = U.FRAMES[opt.style || fr.style] || U.FRAMES.single, col = opt.color || fr.color;
    if (opt.bg) U.blank(x, y, w, h, opt.bg);   // modals block clicks underneath
    U.put(x, y, F[0], col); U.put(x + w - 1, y, F[1], col);
    U.put(x, y + h - 1, F[2], col); U.put(x + w - 1, y + h - 1, F[3], col);
    for (let k = 1; k < w - 1; k++) { U.put(x + k, y, F[4], col); U.put(x + k, y + h - 1, F[4], col); }
    for (let k = 1; k < h - 1; k++) { U.put(x, y + k, F[5], col); U.put(x + w - 1, y + k, F[5], col); }
    if (title) U.mtext(x + 2, y, ` ${title} `, FG, opt.bg || null, null, w - 4);
  };

  U.hsep = function (x, y, w, label) {
    const fr = U.frame(), F = U.FRAMES[fr.style] || U.FRAMES.single;
    U.put(x, y, F[6], fr.color);
    for (let k = 1; k < w - 1; k++) U.put(x + k, y, F[4], fr.color);
    U.put(x + w - 1, y, F[7], fr.color);
    if (label) U.mtext(x + 2, y, ` ${label} `);
  };

  // A thin labelled rule inside a panel: ── Label ──────
  U.rule = function (x, y, w, label, color) {
    U.text(x, y, '─'.repeat(w), '#34344a');
    if (label) U.mtext(x + 2, y, ` ${label} `, color || U.DIM);
  };

  // Bars: heavy line for the filled part, thin line for the rest. Partial cells use a half line.
  U.bar = function (x, y, w, val, max, color, empty) {
    const f = max > 0 ? Math.max(0, Math.min(1, val / max)) * w : 0, full = Math.floor(f), half = f - full >= 0.5;
    for (let k = 0; k < w; k++) {
      if (k < full) U.put(x + k, y, '━', color);
      else if (k === full && half) U.put(x + k, y, '╸', color);
      else U.put(x + k, y, '─', empty || '#3a3a50');
    }
  };

  U.button = function (x, y, label, key, fn, opt = {}) {
    const r = U.region(key, fn, opt.alt), b = U.ui.hover === key ? U.HOVER_BG : opt.bg || null;
    let n = U.mtext(x, y, label, opt.color || FG, b, r, opt.max);
    if (opt.w) for (; n < opt.w; n++) U.put(x + n, y, ' ', FG, b, r);
    return n;
  };

  /* ---------- Little helpers ---------- */
  U.hovered = (key) => U.ui.hover === key;
  U.pct = (f) => Math.round(f * 100) + '%';
  U.pad = (t, n) => { const a = [...String(t)]; return a.length > n ? a.slice(0, n - 1).join('') + '…' : String(t) + ' '.repeat(n - a.length); };
  U.center = (cx, y, str, f, b) => U.text(cx - Math.floor([...String(str)].length / 2), y, str, f, b);
  U.mcenter = (cx, y, str, base, b) => U.mtext(cx - Math.floor(U.plainLen(str) / 2), y, str, base, b);
  U.hpColor = (f) => (f > 0.6 ? '#6bdc6b' : f > 0.3 ? '#ffd866' : '#ff5c5c');

  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const toHex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  U.mix = function (a, b, t) {
    if (!a || !b || a[0] !== '#' || b[0] !== '#') return a || b;
    const A = hex(a), B = hex(b);
    return toHex(A.map((v, i) => v + (B[i] - v) * t));
  };
  const dimCache = {};
  U.dim = (h) => dimCache[h] || (dimCache[h] = U.mix(h, '#0b0b10', 0.58));
})();
