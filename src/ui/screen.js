'use strict';
/* =====================================================================
   SHARDFALL ui - screen.js
   The game draws onto a 100 x 34 grid of colored characters.

   Every frame: clear() -> scenes put() characters into a buffer ->
   flush() turns each row into HTML and only rewrites rows that changed.
   Clickable things register a "region"; the mouse code looks it up.

   Strict ASCII mode (Menu > Settings) swaps the box-drawing frame lines
   and bar blocks for plain + - | # . characters at flush time.
   ===================================================================== */
(function () {
  const U = SF.UI;
  const COLS = 100, ROWS = 34, N = COLS * ROWS;
  Object.assign(U, {
    COLS, ROWS,
    FG: '#c8c8d0', DIM: '#6a6a78', MODAL_BG: '#13131b', HOVER_BG: '#2c2c40', SEL_BG: '#1f2d47', BANNER_BG: '#1a1a2a',
    C: { r: '#ff5c5c', g: '#6bdc6b', b: '#5ca8ff', c: '#5fe0e0', m: '#d08bff', y: '#ffd866', o: '#ff9a4a', w: '#ffffff', d: '#7a7a88' },
    FRAMES: { single: '┌┐└┘─│├┤', double: '╔╗╚╝═║╠╣', rounded: '╭╮╰╯─│├┤', heavy: '┏┓┗┛━┃┣┫', ascii: '++++-|++' },
    settings: { ascii: false, timed: true, fast: false },
  });
  const { FG, C } = U;

  // Strict ASCII: box-drawing and block characters -> plain ASCII.
  const ASCII_MAP = {};
  '┌┐└┘╔╗╚╝╭╮╰╯┏┓┗┛├┤╠╣┣┫'.split('').forEach((c) => (ASCII_MAP[c] = '+'));
  '─━'.split('').forEach((c) => (ASCII_MAP[c] = '-'));
  ASCII_MAP['═'] = '=';
  '│║┃'.split('').forEach((c) => (ASCII_MAP[c] = '|'));
  Object.assign(ASCII_MAP, { '█': '#', '▓': '%', '▒': ':', '░': '.' });

  /* ---------- DOM: one <div> per screen row ---------- */
  const screen = document.getElementById('screen');
  const css = document.createElement('style');
  css.textContent =
    '#screen div{height:1.15em;overflow:hidden}' +
    '#screen div span{display:inline-block;height:1.15em;vertical-align:top}' +
    '#screen i{display:inline-block;width:1ch;font-style:normal;text-align:center;overflow:hidden;vertical-align:top}';
  document.head.appendChild(css);
  screen.textContent = '';
  const rowEls = [], rowHTML = [];
  for (let y = 0; y < ROWS; y++) {
    const el = document.createElement('div');
    screen.appendChild(el);
    rowEls.push(el);
    rowHTML.push('');
  }
  U.screenEl = screen;

  /* ---------- Cell buffer ---------- */
  const ch = new Array(N), fg = new Array(N), bg = new Array(N), rg = new Int16Array(N);
  U.regions = [];
  U.rg = rg;

  U.clear = function () { ch.fill(' '); fg.fill(FG); bg.fill(null); rg.fill(-1); U.regions = []; };

  U.put = function (x, y, c, f, b, r) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
    const i = y * COLS + x;
    ch[i] = c;
    fg[i] = f || FG;
    if (b) bg[i] = b;
    if (r != null && r >= 0) rg[i] = r;
  };
  U.peek = (x, y) => (x < 0 || y < 0 || x >= COLS || y >= ROWS ? null : { c: ch[y * COLS + x], f: fg[y * COLS + x] });

  U.text = function (x, y, str, f, b, r, max) {
    str = String(str);
    if (max != null && str.length > max) str = str.slice(0, Math.max(0, max - 1)) + '.';
    for (let k = 0; k < str.length; k++) U.put(x + k, y, str[k], f, b, r);
    return str.length;
  };

  U.fillBg = function (x, y, w, h, color) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      if (xx >= 0 && yy >= 0 && xx < COLS && yy < ROWS) bg[yy * COLS + xx] = color;
    }
  };
  U.blank = function (x, y, w, h, color) {   // wipe a rectangle (characters, colors, clicks)
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      if (xx < 0 || yy < 0 || xx >= COLS || yy >= ROWS) continue;
      const i = yy * COLS + xx;
      ch[i] = ' '; fg[i] = FG; bg[i] = color || null; rg[i] = -1;
    }
  };

  U.region = function (key, fn) { U.regions.push({ key, fn }); return U.regions.length - 1; };
  U.area = function (x, y, w, h, r) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      if (xx >= 0 && yy >= 0 && xx < COLS && yy < ROWS) rg[yy * COLS + xx] = r;
    }
  };

  // Anything outside ASCII and box drawing gets a fixed-width cell so fallback fonts can't break the grid.
  function esc(c) {
    if (U.settings.ascii && ASCII_MAP[c]) c = ASCII_MAP[c];
    if (c === '<') return '&lt;';
    if (c === '>') return '&gt;';
    if (c === '&') return '&amp;';
    const n = c.charCodeAt(0);
    return n > 0x7e && (n < 0x2500 || n > 0x259f) ? `<i>${c}</i>` : c;
  }

  U.flush = function () {
    for (let y = 0; y < ROWS; y++) {
      const base = y * COLS;
      let html = '', x = 0;
      while (x < COLS) {
        const i = base + x, f = fg[i], b = bg[i], click = rg[i] >= 0;
        let run = '';
        while (x < COLS) {
          const j = base + x;
          if ((fg[j] !== f && ch[j] !== ' ') || bg[j] !== b || (rg[j] >= 0) !== click) break;
          run += esc(ch[j]);
          x++;
        }
        html += `<span style="color:${f}${b ? ';background:' + b : ''}"${click ? ' data-r' : ''}>${run}</span>`;
      }
      if (html !== rowHTML[y]) { rowHTML[y] = html; rowEls[y].innerHTML = html; }
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
  U.plainLen = (str) => String(str).replace(MARK, '').length;
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
    const push = (t, c) => { lines[lines.length - 1].push({ t, c }); col += t.length; };
    for (const sg of U.segs(String(str), base || FG)) {
      for (const part of sg.t.split(/(\n| +)/)) {
        if (!part) continue;
        if (part === '\n') { lines.push([]); col = 0; continue; }
        if (part[0] === ' ') { if (col > 0 && col + part.length < width) push(part, sg.c); continue; }
        let word = part;
        if (col > 0 && col + word.length > width) { lines.push([]); col = 0; }
        while (word.length > width) { push(word.slice(0, width), sg.c); lines.push([]); col = 0; word = word.slice(width); }
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

  // A thin labelled rule inside a panel: -- Label ------
  U.rule = function (x, y, w, label, color) {
    const t = label ? `-- ${label} ` : '';
    U.text(x, y, '-'.repeat(w), '#3a3a4a');
    if (label) U.mtext(x, y, `{#3a3a4a}--{/} ${label} `, color || U.DIM);
    return t.length;
  };

  // Bars are plain ASCII: '=' for the filled part, '-' for the rest.
  U.bar = function (x, y, w, val, max, color, empty) {
    const full = max > 0 ? Math.round(Math.max(0, Math.min(1, val / max)) * w) : 0;
    for (let k = 0; k < w; k++) U.put(x + k, y, k < full ? '=' : '-', k < full ? color : empty || '#2c2c38');
  };

  U.button = function (x, y, label, key, fn, opt = {}) {
    const r = U.region(key, fn), b = U.ui.hover === key ? U.HOVER_BG : opt.bg || null;
    let n = U.mtext(x, y, label, opt.color || FG, b, r, opt.max);
    if (opt.w) for (; n < opt.w; n++) U.put(x + n, y, ' ', FG, b, r);
    return n;
  };

  /* ---------- Little helpers ---------- */
  U.hovered = (key) => U.ui.hover === key;
  U.pct = (f) => Math.round(f * 100) + '%';
  U.pad = (t, n) => (t.length > n ? t.slice(0, n - 1) + '.' : t.padEnd(n));
  U.center = (cx, y, str, f, b) => U.text(cx - Math.floor(String(str).length / 2), y, str, f, b);
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
