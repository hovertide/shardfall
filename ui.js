'use strict';
/* =====================================================================
   SHARDFALL — ui.js
   Draws the game as colored text on a 100x34 character grid and turns
   mouse clicks / key presses into Engine actions. No game rules here.

   How drawing works: every frame is drawn into a cell buffer
   (char, color, background, click region). Each row is then turned into
   HTML, and only rows that changed are written to the page. The game
   redraws only on input or during short animations.
   ===================================================================== */
(function () {
  const D = Engine.data, W = Engine.W, H = Engine.H, RULES = D.rules;
  const COLS = 100, ROWS = 34, N = COLS * ROWS;
  const SAVE_KEY = 'shardfall.save';
  const FG = '#c8c8d0', DIM = '#6a6a78', MODAL_BG = '#13131b', HOVER_BG = '#2c2c40', SEL_BG = '#1f2d47', BANNER_BG = '#1a1a2a';
  const C = { r: '#ff5c5c', g: '#6bdc6b', b: '#5ca8ff', c: '#5fe0e0', m: '#d08bff', y: '#ffd866', o: '#ff9a4a', w: '#ffffff', d: '#7a7a88' };
  const FRAMES = { single: '┌┐└┘─│├┤', double: '╔╗╚╝═║╠╣', rounded: '╭╮╰╯─│├┤', heavy: '┏┓┗┛━┃┣┫', ascii: '++++-|++' };
  const COS = {};
  for (const c of D.cosmetics) COS[c.id] = c;

  // Shown when hovering the map. A tile in data.js can override this with a `name` field.
  const TILE_NAMES = {
    '#': 'Wall', '.': 'Path', ',': 'Tall grass {d}(beasts hide here){/}', T: 'Tree', '~': 'Deep water', '=': 'Bridge',
    '+': 'Door', o: 'Fountain', $: "{y}Bram's shop{/}", I: '{o}The inn{/} {d}(rest here){/}', S: '{m}Shrine of Echoes{/}',
    E: '{y}Elder Maren{/}', H: '{c}Old Hermit{/}', C: '{y}Chest{/}', A: '{c}Shard Altar{/}', B: '{r}A towering shadow{/}',
  };

  const MOVE = {
    ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
    k: [0, -1], j: [0, 1], h: [-1, 0], l: [1, 0], y: [-1, -1], u: [1, -1], b: [-1, 1], n: [1, 1],
    8: [0, -1], 2: [0, 1], 4: [-1, 0], 6: [1, 0], 7: [-1, -1], 9: [1, -1], 1: [-1, 1], 3: [1, 1],
  };

  const OUTFIT_TYPES = [['glyph', 'Glyph'], ['color', 'Color'], ['title', 'Title'], ['frame', 'Frame']];

  const HELP = [
    ['{y}Move{/}', 'WASD, arrow keys or hjkl (y u b n for diagonals). Or click any explored tile to walk there.'],
    ['{y}Interact{/}', 'Walk into people, chests ({y}■{/}), the shop ({y}${/}) and the shrine ({m}Ω{/}). Exits ({c}>{/}) lead to new areas.'],
    ['{y}Danger{/}', 'Beasts hide in tall grass ({g}"{/}). Paths are safer and the village is safe. The log shows each area\'s level.'],
    null,
    ['{y}Combat{/}', '[1] Attack  [2] Skills  [3] Spells  [4] Items  [5] Defend  [6] Flee. Change target with Tab or by clicking an enemy.'],
    ['{y}Rewards{/}', 'Enemies drop gold and XP. Levels give stat points, spirit shards and new abilities.'],
    null,
    ['{r}Vitality{/}', 'More HP, damage resistance, regeneration and stronger potions.'],
    ['{o}Strength{/}', 'Weapon damage, critical hits, dodge and escaping.'],
    ['{g}Stamina{/}', 'Stamina for strength skills (Double, Triple and Flaming Slash).'],
    ['{b}Spirit{/}', 'Spirit for spells, plus stronger spells and hounds.'],
    ['{m}Willpower{/}', 'Keep fighting below 0 HP (Brink), deal more damage when badly hurt (Fury), and resist sanity loss.'],
    ['{m}Sanity{/}', 'Dread attacks drain it. Under 30 you may freeze; at 0 you deal less damage. Tea, the hermit and the inn restore it.'],
    null,
    ['{m}Shards{/}', 'Spend spirit shards at the Shrine of Echoes for cosmetics: glyphs, colors, titles and frames.'],
    ['{y}Keys{/}', '[I]tems  [C]haracter  [Q]uests  [O]utfits  [?] help  [Esc] menu. Scroll the log with the mouse wheel or PgUp/PgDn.'],
    ['{y}Saving{/}', 'The game saves automatically in this browser.'],
  ];

  const FONT = {
    S: ['███████╗', '██╔════╝', '███████╗', '╚════██║', '███████║', '╚══════╝'],
    H: ['██╗  ██╗', '██║  ██║', '███████║', '██╔══██║', '██║  ██║', '╚═╝  ╚═╝'],
    A: [' █████╗ ', '██╔══██╗', '███████║', '██╔══██║', '██║  ██║', '╚═╝  ╚═╝'],
    R: ['██████╗ ', '██╔══██╗', '██████╔╝', '██╔══██╗', '██║  ██║', '╚═╝  ╚═╝'],
    D: ['██████╗ ', '██╔══██╗', '██║  ██║', '██║  ██║', '██████╔╝', '╚═════╝ '],
    F: ['███████╗', '██╔════╝', '█████╗  ', '██╔══╝  ', '██║     ', '╚═╝     '],
    L: ['██╗     ', '██║     ', '██║     ', '██║     ', '███████╗', '╚══════╝'],
  };
  const LOGO = [0, 1, 2, 3, 4, 5].map((r) => [...'SHARDFALL'].map((ch) => FONT[ch][r]).join(''));
  const LOGO_COLORS = ['#5fe0e0', '#72d2f2', '#86c2ff', '#a4adff', '#c096ff', '#d08bff'];

  /* ---------- DOM: one <div> per screen row ---------- */
  const screen = document.getElementById('screen');
  const css = document.createElement('style');
  css.textContent =
    '#screen div{height:1.15em;overflow:hidden}' +
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

  /* ---------- Cell buffer ---------- */
  const ch = new Array(N), fg = new Array(N), bg = new Array(N), rg = new Int16Array(N);
  let regions = [];

  function clear() { ch.fill(' '); fg.fill(FG); bg.fill(null); rg.fill(-1); regions = []; }

  function put(x, y, c, f, b, r) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
    const i = y * COLS + x;
    ch[i] = c;
    fg[i] = f || FG;
    if (b) bg[i] = b;
    if (r != null && r >= 0) rg[i] = r;
  }

  function text(x, y, str, f, b, r, max) {
    str = String(str);
    if (max != null && str.length > max) str = str.slice(0, Math.max(0, max - 1)) + '…';
    for (let k = 0; k < str.length; k++) put(x + k, y, str[k], f, b, r);
    return str.length;
  }

  function fillBg(x, y, w, h, color) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      if (xx >= 0 && yy >= 0 && xx < COLS && yy < ROWS) bg[yy * COLS + xx] = color;
    }
  }

  function region(key, fn) { regions.push({ key, fn }); return regions.length - 1; }
  function area(x, y, w, h, r) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      if (xx >= 0 && yy >= 0 && xx < COLS && yy < ROWS) rg[yy * COLS + xx] = r;
    }
  }

  // Characters outside ASCII and box-drawing get a fixed-width cell so fallback fonts can't break the grid.
  function esc(c) {
    if (c === '<') return '&lt;';
    if (c === '>') return '&gt;';
    if (c === '&') return '&amp;';
    const n = c.charCodeAt(0);
    return n > 0x7e && (n < 0x2500 || n > 0x259f) ? `<i>${c}\uFE0E</i>` : c;
  }

  function flush() {
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
  }

  /* ---------- Color markup: {r}red{/}, {#rrggbb}any{/} ---------- */
  const MARK = /\{(#[0-9a-fA-F]{6}|[rgbcmyowd]|\/)\}/g;
  function segs(str, base) {
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
  }
  const plainLen = (str) => String(str).replace(MARK, '').length;

  function mtext(x, y, str, base, b, r, max) {
    let n = 0;
    for (const sg of segs(String(str), base || FG)) {
      for (const c of sg.t) {
        if (c === '\n') continue;
        if (max != null && n >= max) return n;
        put(x + n++, y, c, sg.c, b, r);
      }
    }
    return n;
  }

  // Word-wrap markup text into lines of colored segments.
  function wrap(str, width, base) {
    const lines = [[]];
    let col = 0;
    const push = (t, c) => { lines[lines.length - 1].push({ t, c }); col += t.length; };
    for (const sg of segs(String(str), base || FG)) {
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
  }

  function drawLine(x, y, line, b, r) {
    let n = 0;
    for (const sg of line) for (const c of sg.t) put(x + n++, y, c, sg.c, b, r);
    return n;
  }

  /* ---------- Widgets ---------- */
  const frame = () => (s ? Engine.look(s.p).frame : { style: 'single', color: '#4a4a60' });

  function box(x, y, w, h, title, opt = {}) {
    const fr = frame(), F = FRAMES[opt.style || fr.style] || FRAMES.single, col = opt.color || fr.color;
    if (opt.bg) {
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
        if (xx < 0 || yy < 0 || xx >= COLS || yy >= ROWS) continue;
        const i = yy * COLS + xx;
        ch[i] = ' '; fg[i] = FG; bg[i] = opt.bg; rg[i] = -1;   // modals block clicks underneath
      }
    }
    put(x, y, F[0], col); put(x + w - 1, y, F[1], col);
    put(x, y + h - 1, F[2], col); put(x + w - 1, y + h - 1, F[3], col);
    for (let k = 1; k < w - 1; k++) { put(x + k, y, F[4], col); put(x + k, y + h - 1, F[4], col); }
    for (let k = 1; k < h - 1; k++) { put(x, y + k, F[5], col); put(x + w - 1, y + k, F[5], col); }
    if (title) mtext(x + 2, y, ` ${title} `, FG, null, null, w - 4);
  }

  function hsep(x, y, w) {
    const fr = frame(), F = FRAMES[fr.style] || FRAMES.single;
    put(x, y, F[6], fr.color);
    for (let k = 1; k < w - 1; k++) put(x + k, y, F[4], fr.color);
    put(x + w - 1, y, F[7], fr.color);
  }

  function bar(x, y, w, val, max, color) {
    const full = max > 0 ? Math.round(Math.max(0, Math.min(1, val / max)) * w) : 0;
    for (let k = 0; k < w; k++) put(x + k, y, k < full ? '█' : '░', k < full ? color : '#2c2c38');
  }

  function button(x, y, label, key, fn, opt = {}) {
    const r = region(key, fn), b = ui.hover === key ? HOVER_BG : opt.bg || null;
    let n = mtext(x, y, label, opt.color || FG, b, r, opt.max);
    if (opt.w) for (; n < opt.w; n++) put(x + n, y, ' ', FG, b, r);
    return n;
  }

  const hovered = (key) => ui.hover === key;
  const pct = (f) => Math.round(f * 100) + '%';
  const pad = (t, n) => (t.length > n ? t.slice(0, n - 1) + '…' : t.padEnd(n));
  const center = (cx, y, str, f, b) => text(cx - Math.floor(String(str).length / 2), y, str, f, b);
  const mcenter = (cx, y, str, base) => mtext(cx - Math.floor(plainLen(str) / 2), y, str, base);
  const hpColor = (f) => (f > 0.6 ? '#6bdc6b' : f > 0.3 ? '#ffd866' : '#ff5c5c');
  const dimCache = {};
  function dim(hex) {
    if (dimCache[hex]) return dimCache[hex];
    const n = parseInt(hex.slice(1), 16), mix = (a, z) => Math.round(a * 0.42 + z * 0.58);
    const out = '#' + [mix(n >> 16, 0x0b), mix((n >> 8) & 255, 0x0b), mix(n & 255, 0x10)]
      .map((v) => v.toString(16).padStart(2, '0')).join('');
    return (dimCache[hex] = out);
  }

  /* ---------- UI state (display only; game state lives in `s`) ---------- */
  let s = null;
  const ui = {
    screen: 'title', overlay: null, hover: null, hcell: null, titleHelp: false, msg: null, saveInfo: null,
    cmenu: 'main', target: 0, dsel: 0, shopTab: 'buy', outfitRow: 0, logScroll: 0, newFrom: 0,
    walk: [], walkTimer: null,
    create: null,
    efloat: {}, eflash: {}, pflash: 0, pfloat: null, banner: null, pull: null,
    stars: [],
  };

  function resetUi() {
    Object.assign(ui, { overlay: null, cmenu: 'main', target: 0, dsel: 0, shopTab: 'buy', logScroll: 0,
      walk: [], efloat: {}, eflash: {}, pflash: 0, pfloat: null, banner: null, pull: null, titleHelp: false, msg: null });
    ui.newFrom = s ? s.log.length : 0;
  }

  /* ---------- Saving ---------- */
  let saveTimer = null;
  function saveGame() {
    if (!s) return;
    try { localStorage.setItem(SAVE_KEY, Engine.save(s)); } catch (e) { /* storage full or blocked */ }
  }
  function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(saveGame, 400); }
  function readSaveInfo() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const j = JSON.parse(raw);
      return j && j.p ? `(${j.p.name}, Lv ${j.p.lvl})` : null;
    } catch (e) { return null; }
  }
  function loadGame() {
    try {
      s = Engine.load(localStorage.getItem(SAVE_KEY));
      resetUi();
      ui.screen = 'game';
      Engine.note(s, `{d}Welcome back, ${s.p.name}.{/}`);
    } catch (e) {
      ui.msg = 'Could not load the save: ' + e.message;
    }
  }
  function quitToTitle() {
    saveGame();
    s = null;
    resetUi();
    ui.screen = 'title';
    ui.saveInfo = readSaveInfo();
  }

  /* ---------- Actions ---------- */
  function doAction(a) {
    if (s.log.length > 100) s.log.splice(0, s.log.length - 100);
    const before = s.log.length, prevScene = s.scene;
    const res = Engine.act(s, a);
    if (s.log.length > before) { ui.newFrom = before; ui.logScroll = 0; }
    if (s.scene !== prevScene) {
      ui.cmenu = 'main'; ui.dsel = 0; ui.shopTab = 'buy';
      if (prevScene === 'shrine') ui.pull = null;
    }
    if (a.type === 'choose') ui.dsel = 0;
    handleFx(res.fx);
    fixTarget();
    if (ui.overlay && !overlayAllowed(ui.overlay)) ui.overlay = null;
    scheduleSave();
    render();
    return res;
  }

  function doCombat(a) {
    const res = doAction(a);
    if (res.ok) ui.cmenu = 'main';
  }

  function handleFx(list) {
    const now = performance.now(), hits = {};
    let pdmg = 0;
    for (const f of list) {
      switch (f.t) {
        case 'start':
          Object.assign(ui, { cmenu: 'main', target: 0, efloat: {}, eflash: {}, walk: [] });
          ui.banner = f.boss ? { text: 'THE VEIL WARDEN', color: C.r, until: now + 1600 } : null;
          break;
        case 'ehit':
          (hits[f.i] = hits[f.i] || { parts: [], crit: false }).parts.push(f.dmg);
          if (f.crit) hits[f.i].crit = true;
          ui.eflash[f.i] = now + 160;
          break;
        case 'phit': pdmg += f.dmg; ui.pflash = now + 220; break;
        case 'dodge': ui.pfloat = { text: 'dodge!', color: C.c, until: now + 800 }; break;
        case 'dread': ui.pfloat = { text: `-${f.amt} sanity`, color: C.m, until: now + 900 }; break;
        case 'win': ui.banner = { text: 'VICTORY', color: C.g, until: now + 1100 }; break;
        case 'level': ui.banner = { text: `LEVEL ${f.lvl}`, color: C.y, until: now + 1800 }; break;
        case 'lose': ui.banner = null; break;
        case 'pull': ui.pull = { results: f.results, t0: now }; break;
        case 'travel': ui.walk = []; break;
      }
    }
    for (const i in hits) {
      ui.efloat[i] = { text: hits[i].parts.map((d) => '-' + d).join(' '), color: hits[i].crit ? C.y : C.w, until: now + 900 };
    }
    if (pdmg) ui.pfloat = { text: `-${pdmg}`, color: C.r, until: now + 900 };
  }

  function fixTarget() {
    const c = s && s.combat;
    if (!c) return;
    if (!c.enemies[ui.target] || c.enemies[ui.target].hp <= 0) {
      const i = c.enemies.findIndex((e) => e.hp > 0);
      ui.target = i < 0 ? 0 : i;
    }
  }
  function cycleTarget(dir) {
    const c = s.combat, n = c.enemies.length;
    for (let k = 1; k <= n; k++) {
      const i = (ui.target + dir * k + n * 2) % n;
      if (c.enemies[i].hp > 0) { ui.target = i; return; }
    }
  }

  // Click-to-walk: follow the engine's path one step at a time; stops on encounters or interactions.
  function walkTo(tx, ty) {
    if (s.scene !== 'explore' || ui.overlay) return;
    const steps = Engine.path(s, tx, ty);
    if (!steps || !steps.length) return;
    ui.walk = steps;
    if (!ui.walkTimer) walkStep();
  }
  function walkStep() {
    ui.walkTimer = null;
    if (!s || !ui.walk.length || s.scene !== 'explore' || ui.overlay) { ui.walk = []; return; }
    const [dx, dy] = ui.walk.shift();
    const res = doAction({ type: 'move', dx, dy });
    if (!res.ok || s.scene !== 'explore') { ui.walk = []; return; }
    if (ui.walk.length) ui.walkTimer = setTimeout(walkStep, 55);
  }

  function overlayAllowed(name) {
    if (!s) return false;
    if (s.scene === 'explore') return true;
    return s.scene === 'shrine' && name === 'outfit';
  }
  function openOverlay(name) {
    if (!overlayAllowed(name)) return;
    ui.overlay = ui.overlay === name ? null : name;
    ui.walk = [];
  }

  /* ---------- Title & character creation ---------- */
  function drawTitle(now) {
    for (const st of ui.stars) put(st.x, Math.floor((st.y0 + now * st.sp) % ROWS), st.ch, st.c);
    LOGO.forEach((ln, k) => text(14, 5 + k, ln, LOGO_COLORS[k]));
    center(50, 12, 'Shards are falling. The Veil is cracked. You remember nothing.', DIM);
    let y = 16;
    button(42, y, '{y}[N]{/} New game', 'title:new', startCreate, { w: 22 });
    y += 2;
    if (ui.saveInfo) {
      button(42, y, `{y}[C]{/} Continue  {d}${ui.saveInfo}{/}`, 'title:cont', loadGame, { w: 22 });
      y += 2;
    }
    button(42, y, '{y}[H]{/} How to play', 'title:help', () => (ui.titleHelp = true), { w: 22 });
    if (ui.msg) center(50, 25, ui.msg, C.r);
    center(50, 31, 'text only · mouse & keyboard · saves in your browser', '#4a4a58');
    if (ui.titleHelp) drawHelp();
  }

  function startCreate() {
    ui.create = { name: '', alloc: { vit: 0, str: 0, sta: 0, spi: 0, wil: 0 }, sel: 0 };
    ui.screen = 'create';
    ui.msg = null;
  }

  function adjust(k, delta) {
    const cr = ui.create, key = Engine.STATS[k].k;
    const used = Engine.STATS.reduce((t, st) => t + cr.alloc[st.k], 0);
    if (delta > 0 && used >= RULES.startPoints) return;
    cr.alloc[key] = Math.max(0, cr.alloc[key] + delta);
  }

  function renamePrompt() {
    let n = null;
    try { n = window.prompt('Your name:', ui.create.name); } catch (e) { /* prompts blocked */ }
    if (n != null) ui.create.name = n.replace(/[^A-Za-z0-9 '\-]/g, '').slice(0, 14);
  }

  function begin() {
    const cr = ui.create;
    s = Engine.newGame({ name: cr.name, alloc: cr.alloc });
    resetUi();
    ui.newFrom = 0;
    ui.screen = 'game';
    Engine.note(s, '{d}Tip: press [?] for help. Click any explored tile to walk there.{/}');
    saveGame();
  }

  function drawCreate() {
    const x = 15, y = 3, w = 70, h = 27, cr = ui.create;
    const used = Engine.STATS.reduce((t, st) => t + cr.alloc[st.k], 0), left = RULES.startPoints - used;
    box(x, y, w, h, '{y}A new wanderer{/}', { bg: MODAL_BG });
    text(x + 3, y + 2, 'Who were you, before the sky cracked?', FG);
    text(x + 3, y + 4, 'Name', DIM);
    button(x + 9, y + 4, `[ ${pad(cr.name + '_', 15)} ]`, 'cr:name', renamePrompt);
    mtext(x + 31, y + 4, '{d}type, or click to rename{/}');
    mtext(x + 3, y + 6, `Points to spend: {y}${left}{/}  {d}(+${RULES.pointsPerLevel} more every level){/}`);

    Engine.STATS.forEach((st, k) => {
      const yy = y + 8 + k * 2, sel = cr.sel === k;
      area(x + 2, yy, w - 4, 2, region('cr:row:' + k, () => (cr.sel = k)));
      if (sel) fillBg(x + 2, yy, w - 4, 2, SEL_BG);
      text(x + 3, yy, sel ? '►' : ' ', C.y);
      text(x + 5, yy, st.name, st.color);
      button(x + 16, yy, '{d}[-]{/}', 'cr:-:' + k, () => { cr.sel = k; adjust(k, -1); });
      text(x + 20, yy, String(RULES.baseStat + cr.alloc[st.k]).padStart(3), C.w);
      button(x + 24, yy, '{g}[+]{/}', 'cr:+:' + k, () => { cr.sel = k; adjust(k, 1); });
      wrap(st.desc, w - 33, DIM).slice(0, 2).forEach((ln, j) => drawLine(x + 30, yy + j, ln));
    });

    const stats = {};
    for (const st of Engine.STATS) stats[st.k] = RULES.baseStat + cr.alloc[st.k];
    const d = Engine.derived({ stats, lvl: 1, weapon: 'wooden_sword' });
    mtext(x + 3, y + 19, `{d}HP{/} ${d.maxHp}  {d}Stamina{/} ${d.maxSt}  {d}Spirit{/} ${d.maxSp}  {d}Damage{/} ${d.dmgMin}-${d.dmgMax}  {d}Crit{/} ${pct(d.crit)}  {d}Dodge{/} ${pct(d.dodge)}`);
    mtext(x + 3, y + 20, `{d}Resist{/} ${pct(d.resist)}  {d}Brink{/} -${d.brink} HP  {d}Fury{/} +${pct(d.furyBonus)}  {d}Dread resist{/} ${pct(d.dreadResist)}`);
    if (ui.saveInfo) mtext(x + 3, y + 22, `{o}Starting will overwrite your saved game ${ui.saveInfo}.{/}`);
    button(x + 3, y + 24, '{y}[Enter]{/} Begin', 'cr:go', begin);
    button(x + 22, y + 24, '{y}[Esc]{/} Back', 'cr:back', () => (ui.screen = 'title'));
    mtext(x + 38, y + 24, '{d}↑↓ pick · ←→ adjust{/}');
  }

  /* ---------- Game screen ---------- */
  function drawGame(now) {
    if (s.scene === 'combat' && s.combat) drawCombat(now);
    else drawMapPanel();
    drawSide(now);
    drawLog();
    drawBar();
    if (s.scene === 'dialog') drawDialog();
    else if (s.scene === 'shop') drawShop();
    else if (s.scene === 'shrine') drawShrine(now);
    else if (s.scene === 'gameover') drawGameOver();
    if (ui.overlay) drawOverlay();
    if (ui.banner && now < ui.banner.until) drawBanner();
  }

  function tileInfo(x, y) {
    if (x < 0 || y < 0 || x >= W || y >= H) return null;
    if (!Engine.seen(s)[y * W + x]) return '{d}Unexplored{/}';
    if (x === s.p.x && y === s.p.y) return `${s.p.name} {d}(you){/}`;
    const t = Engine.tileAt(s, x, y);
    if (t.exit) {
      const l = D.links[t.key], to = l[0] === s.p.map ? l[1] : l[0];
      return `{c}Path to ${D.maps[to].name}{/}`;
    }
    return t.name || TILE_NAMES[t.key] || '';
  }

  function drawMapPanel() {
    const m = Engine.curMap(s), p = s.p, vis = Engine.fov(s), seen = Engine.seen(s);
    box(0, 0, W + 2, H + 2, `{c}${m.name}{/} {d}${m.danger}{/}`);
    area(1, 1, W, H, region('map', (cx, cy) => walkTo(cx - 1, cy - 1)));
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (!seen[i]) continue;
        const t = Engine.tileAt(s, x, y);
        put(1 + x, 1 + y, t.g, vis[i] ? t.c : dim(t.c));
      }
    }
    const L = Engine.look(p);
    put(1 + p.x, 1 + p.y, L.glyph, L.color);

    const hc = ui.hover === 'map' && ui.hcell;
    if (hc && s.scene === 'explore' && !ui.overlay) {
      const tx = hc.x - 1, ty = hc.y - 1, path = Engine.path(s, tx, ty);
      if (path) {
        let x = p.x, y = p.y;
        for (const [dx, dy] of path) { x += dx; y += dy; fillBg(1 + x, 1 + y, 1, 1, '#1b2833'); }
      }
      fillBg(hc.x, hc.y, 1, 1, HOVER_BG);
      const info = tileInfo(tx, ty);
      if (info) { const t = ` ${info} `; mtext(W + 1 - plainLen(t), H + 1, t); }
    }
  }

  function resRow(x, y, label, val, max, color, brink) {
    text(x, y, label, DIM);
    if (val < 0 && brink) {   // below zero: show how close you are to falling
      const depth = Math.round(Math.min(1, -val / brink) * 18);
      for (let k = 0; k < 18; k++) put(x + 4 + k, y, k < depth ? '▓' : '░', k < depth ? '#b02040' : '#3a1a22');
    } else bar(x + 4, y, 18, val, max, color);
    text(x + 23, y, `${val}/${max}`, val <= 0 ? C.r : FG);
  }

  function drawSide(now) {
    const p = s.p, d = Engine.derived(p), L = Engine.look(p), X = W + 2, x = X + 2;
    box(X, 0, COLS - X, 22, 'Character');
    put(x, 1, L.glyph, L.color);
    text(x + 2, 1, p.name, L.color);
    text(x + 2, 2, L.title, DIM);
    const need = Engine.xpNeed(p.lvl);
    text(x, 3, `Lv ${p.lvl}`, C.y);
    bar(x + 7, 3, 16, p.xp, need, '#a07cff');
    text(x + 24, 3, `${p.xp}/${need}`, DIM);

    resRow(x, 5, 'HP', p.hp, d.maxHp, now < ui.pflash ? C.w : hpColor(p.hp / d.maxHp), d.brink);
    resRow(x, 6, 'ST', p.st, d.maxSt, '#7ddc6f');
    resRow(x, 7, 'SP', p.sp, d.maxSp, '#5ca8ff');
    resRow(x, 8, 'SAN', p.san, d.maxSan, '#c792ea');

    mtext(x, 10, `{y}Gold{/} ${p.gold}`);
    mtext(x + 16, 10, `{m}Shards{/} ${p.shards}`);
    mtext(x, 11, `{d}Weapon{/} ${D.weapons[p.weapon].name} {d}(${d.dmgMin}-${d.dmgMax}){/}`, FG, null, null, 34);
    let cx = x;
    for (const c of Engine.conditions(s)) cx += text(cx, 12, c.name, c.color) + 1;
    if (p.points > 0) {
      button(x, 13, `{y}★ ${p.points} stat point${p.points > 1 ? 's' : ''} to spend{/} {d}[C]{/}`, 'side:pts', () => openOverlay('char'));
    }

    mtext(x, 15, '{d}── Quests ────────────────────────{/}');
    const rq = region('side:quests', () => openOverlay('quests'));
    const qs = Engine.questLog(s).filter((q) => q.status !== 'done');
    let y = 16;
    if (!qs.length) {
      mtext(x, y, p.flags.chapter1 ? '{y}Chapter I complete.{/} {d}Explore freely.{/}' : '{d}Talk to people to find work.{/}', FG, null, rq);
    }
    for (const q of qs) {
      const t = `${q.status === 'ready' ? '{y}!{/}' : '{c}•{/}'} ${q.short}` +
        (q.progress && q.status === 'active' ? ` {d}${q.progress}{/}` : '') +
        (q.status === 'ready' ? ' {y}(return){/}' : '');
      for (const ln of wrap(t, 34, FG)) { if (y > 20) break; drawLine(x, y++, ln, null, rq); }
    }
  }

  let logCache = { arr: null, len: -1, from: -1, last: null, lines: [] };
  function logLines() {
    const L = s.log, last = L[L.length - 1];
    if (logCache.arr === L && logCache.len === L.length && logCache.from === ui.newFrom && logCache.last === last) return logCache.lines;
    const lines = [];
    for (let i = Math.max(0, L.length - 60); i < L.length; i++) {
      const fresh = i >= ui.newFrom;
      wrap(L[i], COLS - 6, fresh ? FG : '#8a8a96').forEach((ln, k) => lines.push({ ln, mark: k === 0 && fresh ? '›' : ' ' }));
    }
    logCache = { arr: L, len: L.length, from: ui.newFrom, last, lines };
    return lines;
  }

  function drawLog() {
    box(0, 22, COLS, 11, 'Log');
    const lines = logLines(), rows = 9;
    ui.logScroll = Math.max(0, Math.min(ui.logScroll, lines.length - rows));
    const top = Math.max(0, lines.length - rows - ui.logScroll);
    for (let r = 0; r < rows && top + r < lines.length; r++) {
      const l = lines[top + r];
      put(2, 23 + r, l.mark, C.y);
      drawLine(3, 23 + r, l.ln);
    }
    if (ui.logScroll > 0) text(COLS - 22, 32, ` ↓ ${ui.logScroll} newer lines `, C.y);
  }

  function drawBar() {
    let x = 1;
    const btn = (label, key, fn) => { x += button(x, 33, label, 'bar:' + key, fn) + 2; };
    const hint = (t) => mtext(x, 33, `{d}${t}{/}`);
    switch (s.scene) {
      case 'explore':
        btn('{y}[I]{/}tems', 'inv', () => openOverlay('inv'));
        btn('{y}[C]{/}haracter', 'char', () => openOverlay('char'));
        btn('{y}[Q]{/}uests', 'quests', () => openOverlay('quests'));
        btn('{y}[O]{/}utfits', 'outfit', () => openOverlay('outfit'));
        btn('{y}[?]{/} Help', 'help', () => openOverlay('help'));
        btn('{y}[Esc]{/} Menu', 'menu', () => openOverlay('menu'));
        hint('click map to walk');
        break;
      case 'combat': hint('[1-6] choose · [Tab] or click an enemy to target · [0]/[Esc] back · wheel scrolls the log'); break;
      case 'dialog': hint('[1-9] or click to answer · ↑↓ + Enter · [Esc] leave'); break;
      case 'shop': hint('[1-9] buy or sell · [Tab] switch tab · [Esc] leave'); break;
      case 'shrine': hint('[1] echo x1 · [2] echo x10 · [O] outfits · [Esc] leave'); break;
      case 'gameover': hint('[R] rise again'); break;
    }
  }

  function drawBanner() {
    const b = ui.banner, t = `   ${b.text}   `, x = 1 + Math.floor((W - t.length) / 2), y = 10;
    text(x, y - 1, ' '.repeat(t.length), FG, BANNER_BG);
    text(x, y, t, b.color, BANNER_BG);
    text(x, y + 1, ' '.repeat(t.length), FG, BANNER_BG);
  }

  /* ---------- Combat ---------- */
  function combatOptions() {
    const c = s.combat, d = Engine.derived(s.p);
    return [
      { label: 'Attack', fn: () => doCombat({ type: 'attack', target: ui.target }), desc: `Strike for ${d.dmgMin}-${d.dmgMax} damage, ${pct(d.crit)} crit chance.` },
      { label: 'Skills ›', fn: () => (ui.cmenu = 'skills'), desc: 'Strength skills. They cost stamina.' },
      { label: 'Spells ›', fn: () => (ui.cmenu = 'spells'), desc: 'Spells. They cost spirit.' },
      { label: 'Items ›', fn: () => (ui.cmenu = 'items'), desc: 'Use an item. Takes your turn.' },
      { label: 'Defend', fn: () => doCombat({ type: 'defend' }), desc: 'Halve damage this round and recover extra stamina and spirit.' },
      { label: 'Flee', fn: () => doCombat({ type: 'flee' }), off: c.boss, desc: c.boss ? 'There is no escape from this fight.' : 'Try to escape. Strength improves your odds.' },
    ];
  }

  function combatList() {
    if (ui.cmenu === 'items') {
      return Engine.inventory(s).map((it) => ({
        name: `${it.name} x${it.count}`, cost: '', ok: true, desc: it.desc,
        fn: () => doCombat({ type: 'use', id: it.id }),
      }));
    }
    return Engine.abilities(s)[ui.cmenu].map((a) => ({
      name: a.name, cost: a.locked ? `Lv ${a.lvl}` : `${a.cost} ${a.res === 'st' ? 'ST' : 'SP'}`,
      ok: a.can, locked: a.locked, desc: a.desc,
      fn: () => doCombat({ type: ui.cmenu === 'skills' ? 'skill' : 'spell', id: a.id, target: ui.target }),
    }));
  }

  function drawCombat(now) {
    const c = s.combat, n = c.enemies.length, slot = Math.floor(W / n), p = s.p;
    const title = c.boss ? '{r}BOSS{/}  The Veil Warden' : `{r}Combat{/} {d}round ${c.round}{/}`;
    box(0, 0, W + 2, H + 2, title, now < ui.pflash ? { color: '#ff5c5c' } : {});

    c.enemies.forEach((e, i) => {
      const def = D.enemies[e.key], x0 = 1 + i * slot, cx = x0 + Math.floor(slot / 2);
      const dead = e.hp <= 0, sel = !dead && i === ui.target, hot = !dead && hovered('enemy:' + i);
      const r = region('enemy:' + i, () => { if (!dead) ui.target = i; });
      if (!dead) area(x0, 1, slot, 12, r);
      const flash = now < (ui.eflash[i] || 0);
      const col = dead ? '#34343e' : flash ? C.w : e.frozen > 0 ? '#a8e4ff' : def.color;
      const top = 8 - def.art.length;
      def.art.forEach((ln, k) => text(cx - Math.floor(ln.length / 2), top + k, ln, col));
      const fl = ui.efloat[i];
      if (fl && now < fl.until) center(cx, top - 1, fl.text, fl.color);
      const name = sel ? `► ${e.name} ◄` : e.name;
      center(cx, 9, name, dead ? '#44444e' : sel ? C.y : hot ? C.w : FG, sel ? SEL_BG : hot ? HOVER_BG : null);
      if (dead) { center(cx, 10, 'slain', '#44444e'); return; }
      const bw = Math.min(16, slot - 4);
      bar(cx - Math.floor(bw / 2), 10, bw, e.hp, e.maxHp, hpColor(e.hp / e.maxHp));
      center(cx, 11, `${e.hp}/${e.maxHp}`, DIM);
      const tags = [];
      if (e.burn > 0) tags.push(`{o}BURN ${e.burn}{/}`);
      if (e.frozen > 0) tags.push(`{c}FROZEN ${e.frozen}{/}`);
      if (e.stolen > 0) tags.push(`{y}+${e.stolen}g{/}`);
      if (tags.length) mcenter(cx, 12, tags.join(' '));
    });

    hsep(0, 13, W + 2);
    const L = Engine.look(p);
    put(2, 14, L.glyph, L.color);
    text(4, 14, p.name, L.color);
    if (ui.pfloat && now < ui.pfloat.until) text(5 + p.name.length, 14, ui.pfloat.text, ui.pfloat.color);
    if (c.hound) {
      const h = c.hound;
      mtext(30, 14, '{m}♦ Hound{/}');
      bar(39, 14, 8, h.hp, h.maxHp, '#d08bff');
      mtext(48, 14, `{d}${h.hp}hp ${h.turns}t{/}`);
    }
    drawCombatMenu();
  }

  function drawCombatMenu() {
    const p = s.p, d = Engine.derived(p), c = s.combat, Y = 15;
    if (ui.cmenu === 'main') {
      let desc = null;
      text(2, Y, 'What will you do?', FG);
      combatOptions().forEach((o, k) => {
        const key = 'cm:' + k;
        button(2 + (k % 3) * 20, Y + 1 + Math.floor(k / 3), `{y}[${k + 1}]{/} ${o.off ? '{d}' + o.label + '{/}' : o.label}`, key, o.fn, { w: 18 });
        if (hovered(key)) desc = o.desc;
      });
      const t = c.enemies[ui.target];
      const info = desc ? `{d}${desc}{/}` : t && t.hp > 0 ? `{d}Target:{/} ${t.name} {d}· ATK ${t.atk} · DEF ${t.def} · [Tab] switch{/}` : '';
      mtext(2, Y + 4, info, FG, null, null, W - 2);
      return;
    }
    const title = {
      skills: `{o}Skills{/}  {d}stamina ${p.st}/${d.maxSt}{/}`,
      spells: `{b}Spells{/}  {d}spirit ${p.sp}/${d.maxSp}{/}`,
      items: '{g}Items{/}',
    }[ui.cmenu];
    mtext(2, Y, title);
    button(W - 10, Y, '{y}[0]{/} Back', 'cm:back', () => (ui.cmenu = 'main'));
    const list = combatList();
    if (!list.length) text(4, Y + 1, 'Nothing to use.', DIM);
    list.slice(0, 5).forEach((e, k) => {
      const costCol = e.locked ? '{d}' : e.ok ? '{y}' : '{r}';
      const name = e.ok ? pad(e.name, 18) : `{d}${pad(e.name, 18)}{/}`;
      const label = `{y}[${k + 1}]{/} ${name} ${costCol}${pad(e.cost, 6)}{/} {d}${e.desc}{/}`;
      button(2, Y + 1 + k, label, 'cl:' + k, e.fn, { w: W - 2, max: W - 2 });
    });
  }

  /* ---------- Dialogue, shop, shrine, death ---------- */
  function drawDialog() {
    const v = Engine.dialogView(s);
    if (!v) return;
    const w = 56, x = 3, lines = wrap(v.text, w - 4, FG), nc = v.choices.length;
    const textRows = Math.min(lines.length, 19 - nc);
    const h = textRows + nc + 3, y = Math.max(0, Math.floor((22 - h) / 2));
    box(x, y, w, h, `{y}${v.name}{/}`, { bg: MODAL_BG });
    for (let k = 0; k < textRows; k++) drawLine(x + 2, y + 1 + k, lines[k]);
    if (ui.dsel >= nc) ui.dsel = 0;
    v.choices.forEach((t, k) => button(x + 2, y + textRows + 2 + k, `{y}[${k + 1}]{/} ${t}`, 'dlg:' + k,
      () => doAction({ type: 'choose', i: k }), { w: w - 4, bg: ui.dsel === k ? SEL_BG : null }));
  }

  function shopEntries() {
    if (ui.shopTab === 'buy') {
      return Engine.shopList(s).map((it, k) => {
        const owned = it.kind === 'weapon' && it.owned;
        const price = owned ? '{d}owned{/}' : `${it.can ? '{y}' : '{r}'}${it.price}g{/}`;
        const extra = it.kind === 'weapon' ? (owned ? '' : '{o}weapon{/}') : `{d}have ${it.owned}{/}`;
        return { label: `{y}[${k + 1}]{/} ${pad(it.name, 16)} ${price}  ${extra}`, desc: it.desc, fn: () => doAction({ type: 'buy', id: it.id }) };
      });
    }
    return Engine.inventory(s).map((it, k) => ({
      label: `{y}[${k + 1}]{/} ${pad(it.name, 16)} {d}x${it.count}{/}  sell for {y}${Engine.sellPrice(it.id)}g{/}`,
      desc: it.desc, fn: () => doAction({ type: 'sell', id: it.id }),
    }));
  }

  function drawShop() {
    const x = 2, y = 1, w = 58, h = 20, p = s.p;
    box(x, y, w, h, "{y}Bram's Goods{/}", { bg: MODAL_BG });
    button(x + 2, y + 1, ui.shopTab === 'buy' ? '{y}[ BUY ]{/}' : '{d}[ buy ]{/}', 'shop:tbuy', () => (ui.shopTab = 'buy'));
    button(x + 11, y + 1, ui.shopTab === 'sell' ? '{y}[ SELL ]{/}' : '{d}[ sell ]{/}', 'shop:tsell', () => (ui.shopTab = 'sell'));
    const g = `{y}Gold ${p.gold}{/}`;
    mtext(x + w - 3 - plainLen(g), y + 1, g);
    for (let k = 2; k < w - 2; k++) put(x + k, y + 2, '─', '#2c2c38');
    const list = shopEntries();
    if (!list.length) text(x + 3, y + 4, 'You have nothing to sell.', DIM);
    list.slice(0, 7).forEach((e, k) => {
      const yy = y + 3 + k * 2, key = 'shop:' + k;
      button(x + 2, yy, e.label, key, e.fn, { w: w - 4 });
      area(x + 2, yy + 1, w - 4, 1, regions.length - 1);   // description line is clickable too
      if (hovered(key)) fillBg(x + 2, yy + 1, w - 4, 1, HOVER_BG);
      mtext(x + 6, yy + 1, `{d}${e.desc}{/}`, FG, null, null, w - 9);
    });
    button(x + w - 14, y + h - 2, '{y}[Esc]{/} Leave', 'shop:leave', () => doAction({ type: 'leave' }));
  }

  function chipLabel(c) {
    const rc = D.rarity[c.r].color;
    if (c.type === 'glyph') return `{${rc}}${c.val} ${c.name}{/}`;
    if (c.type === 'color') return `{${c.val}}■{/} {${rc}}${c.name}{/}`;
    if (c.type === 'frame') {
      const F = FRAMES[c.val.style] || FRAMES.single;
      return `{${c.val.color}}${F[0]}${F[4]}${F[1]}{/} {${rc}}${c.name}{/}`;
    }
    return `{${rc}}${c.name}{/}`;
  }

  function drawShrine(now) {
    const x = 2, y = 1, w = 58, h = 20, p = s.p;
    box(x, y, w, h, '{m}Shrine of Echoes{/}', { bg: MODAL_BG });
    const art = ['    _/\\_    ', '   /    \\   ', '  |  Ω   |  ', '  |______|  ', ' /________\\ '];
    art.forEach((l, k) => text(x + 2, y + 2 + k, l, '#d08bff'));
    mtext(x + 17, y + 2, `Spirit shards: {m}${p.shards}◆{/}`);
    mtext(x + 17, y + 3, `{d}Epic+ within ${D.pity.epic - p.pity.e} · Legendary within ${D.pity.legendary - p.pity.l}{/}`);
    button(x + 17, y + 5, `{y}[1]{/} Echo x1  {d}${RULES.pullCost}◆{/}`, 'sh:1', () => doAction({ type: 'pull', n: 1 }));
    button(x + 37, y + 5, `{y}[2]{/} Echo x10  {d}${RULES.pullCost * 10}◆{/}`, 'sh:10', () => doAction({ type: 'pull', n: 10 }));
    button(x + 17, y + 6, '{y}[O]{/} Outfits', 'sh:out', () => openOverlay('outfit'));
    const total = D.rarity.reduce((t, r) => t + r.weight, 0);
    mcenter(x + w / 2, y + 8, D.rarity.map((r) => `{${r.color}}${r.name} ${Math.round((r.weight / total) * 100)}%{/}`).join('  '));
    for (let k = 2; k < w - 2; k++) put(x + k, y + 9, '─', '#2c2c38');

    if (ui.pull) {
      const shown = Math.min(ui.pull.results.length, Math.floor((now - ui.pull.t0) / 140) + 1);
      text(x + 3, y + 10, 'The echoes take shape:', DIM);
      ui.pull.results.slice(0, shown).forEach((res, k) => {
        const tag = res.dupe ? `{d}+${res.refund}◆{/}` : '{g}NEW{/}';
        mtext(x + 3 + (k < 5 ? 0 : 27), y + 11 + (k % 5), `${chipLabel(COS[res.id])} ${tag}`, FG, null, null, 26);
      });
    } else {
      for (const [k, ln] of wrap('{d}"The shards are memories, child. Echoes of lives that might have been." - the Old Hermit{/}', w - 6).entries()) {
        drawLine(x + 3, y + 11 + k, ln);
      }
    }
    button(x + w - 14, y + h - 2, '{y}[Esc]{/} Leave', 'sh:leave', () => doAction({ type: 'leave' }));
  }

  function drawGameOver() {
    const x = 9, y = 5, w = 44, h = 11, cx = x + Math.floor(w / 2), p = s.p;
    box(x, y, w, h, '{r}Fallen{/}', { bg: '#1a0c12', color: '#8a2a3a' });
    center(cx, y + 2, 'Y O U   H A V E   F A L L E N', C.r);
    center(cx, y + 4, `Slain by ${s.dead ? s.dead.by : 'the dark'}.`, FG);
    center(cx, y + 5, 'Your will drags you back from the dark...', DIM);
    center(cx, y + 6, `You will lose ${Math.floor(p.gold * 0.25)} gold.`, C.y);
    button(cx - 7, y + 8, '{y}[R]{/} Rise again', 'go:rise', () => doAction({ type: 'respawn' }));
  }

  /* ---------- Overlays (inventory, character, quests, outfits, help, menu) ---------- */
  function drawOverlay() {
    switch (ui.overlay) {
      case 'inv': return drawInv();
      case 'char': return drawChar();
      case 'quests': return drawQuests();
      case 'outfit': return drawOutfit();
      case 'help': return drawHelp();
      case 'menu': return drawMenu();
    }
  }

  function closeBtn(x, y, w, h) {
    button(x + w - 14, y + h - 2, '{y}[Esc]{/} Close', 'ov:close', () => (ui.overlay = null));
  }

  function drawInv() {
    const x = 2, y = 1, w = 58, h = 20, p = s.p;
    box(x, y, w, h, 'Inventory', { bg: MODAL_BG });
    let yy = y + 2;
    text(x + 3, yy++, 'Weapons', C.c);
    for (const id of p.weapons) {
      const wd = D.weapons[id], on = p.weapon === id;
      button(x + 3, yy++, `${on ? '{y}►{/}' : ' '} ${pad(wd.name, 14)} {d}${wd.desc}{/}`, 'inv:w:' + id,
        () => doAction({ type: 'equip', id }), { w: w - 6, max: w - 6, bg: on ? SEL_BG : null });
    }
    yy++;
    text(x + 3, yy++, 'Items', C.c);
    const inv = Engine.inventory(s);
    if (!inv.length) text(x + 5, yy++, 'Your pack is empty.', DIM);
    inv.forEach((it, k) => button(x + 3, yy++, `{y}[${k + 1}]{/} ${pad(it.name, 15)} {d}x${it.count}  ${it.desc}{/}`, 'inv:i:' + it.id,
      () => doAction({ type: 'use', id: it.id }), { w: w - 6, max: w - 6 }));
    mtext(x + 3, y + h - 2, '{d}Click a weapon to equip it, an item to use it{/}');
    closeBtn(x, y, w, h);
  }

  function drawChar() {
    const x = 2, y = 1, w = 58, h = 20, p = s.p, d = Engine.derived(p), L = Engine.look(p);
    box(x, y, w, h, 'Character', { bg: MODAL_BG });
    mtext(x + 3, y + 1, `${p.name} {d}${L.title} · Level ${p.lvl}{/}`, L.color);
    const pts = p.points ? `{y}${p.points} point${p.points > 1 ? 's' : ''} to spend{/}` : '{d}no points to spend{/}';
    mtext(x + w - 3 - plainLen(pts), y + 1, pts);
    Engine.STATS.forEach((st, k) => {
      const yy = y + 3 + k;
      mtext(x + 3, yy, `{y}[${k + 1}]{/}`);
      text(x + 7, yy, st.short, st.color);
      text(x + 11, yy, String(p.stats[st.k]).padStart(3), C.w);
      if (p.points > 0) button(x + 15, yy, '{g}[+]{/}', 'char:' + st.k, () => doAction({ type: 'alloc', stat: st.k }));
      text(x + 19, yy, st.desc, DIM, null, null, w - 21);
    });
    const rows = [
      `{d}Max HP{/} ${d.maxHp}   {d}Stamina{/} ${d.maxSt}   {d}Spirit{/} ${d.maxSp}`,
      `{d}Damage{/} ${d.dmgMin}-${d.dmgMax}   {d}Crit{/} ${pct(d.crit)}   {d}Dodge{/} ${pct(d.dodge)}`,
      `{d}Damage resist{/} ${pct(d.resist)}   {d}Regen per round{/} ${d.regen} HP, ${d.stRegen} ST, ${d.spRegen} SP`,
      `{m}Brink:{/} keep fighting down to {r}-${d.brink} HP{/}`,
      `{o}Fury:{/} +${pct(d.furyBonus)} damage under 35% HP, +${pct(d.furyBonus * 2)} below 0`,
      `{m}Sanity{/} ${p.san}/${d.maxSan}   {d}Dread resist{/} ${pct(d.dreadResist)}   {d}Terror{/} ${pct(d.terror)}`,
    ];
    rows.forEach((r, k) => mtext(x + 3, y + 9 + k, r, FG, null, null, w - 6));
    mtext(x + 3, y + 16, `{d}Kills ${p.kills} · Steps ${p.steps} · Deaths ${p.deaths} · Echoes ${p.pulls}{/}`);
    if (p.points > 0) mtext(x + 3, y + h - 2, '{d}[1-5] or [+] to raise a stat{/}');
    closeBtn(x, y, w, h);
  }

  function drawQuests() {
    const x = 2, y = 1, w = 58, h = 20;
    box(x, y, w, h, 'Quests', { bg: MODAL_BG });
    const order = { ready: 0, active: 1, done: 2 };
    const qs = Engine.questLog(s).sort((a, b) => order[a.status] - order[b.status]);
    let yy = y + 2;
    if (!qs.length) {
      for (const ln of wrap('No quests yet. Elder Maren in Emberhollow village may need help.', w - 6, DIM)) drawLine(x + 3, yy++, ln);
    }
    for (const q of qs) {
      if (yy > y + h - 3) break;
      const tag = { ready: '{y}READY {/}', active: '{c}ACTIVE{/}', done: '{d}DONE  {/}' }[q.status];
      const name = q.status === 'done' ? `{d}${q.name}{/}` : q.name;
      mtext(x + 3, yy++, `${tag} ${name}${q.progress && q.status === 'active' ? ` {d}(${q.progress}){/}` : ''}`);
      if (q.status !== 'done') {
        const body = q.status === 'ready' ? `Return to ${q.giver}.` : q.desc;
        for (const ln of wrap(body, w - 13, DIM)) { if (yy > y + h - 3) break; drawLine(x + 10, yy++, ln); }
      }
      yy++;
    }
    closeBtn(x, y, w, h);
  }

  function drawOutfit() {
    const x = 2, y = 1, w = 58, h = 20, p = s.p, L = Engine.look(p);
    box(x, y, w, h, '{m}Outfits{/}', { bg: MODAL_BG });
    put(x + 3, y + 1, L.glyph, L.color);
    mtext(x + 5, y + 1, `${p.name} {d}${L.title}{/}`, L.color);
    let yy = y + 3;
    OUTFIT_TYPES.forEach(([type, label], row) => {
      const all = D.cosmetics.filter((c) => c.type === type), owned = all.filter((c) => p.cos.includes(c.id));
      mtext(x + 2, yy++, `${ui.outfitRow === row ? '{y}►{/}' : ' '} {c}${label}{/} {d}${owned.length}/${all.length}{/}`);
      let cx = x + 4;
      for (const c of owned) {
        const lab = chipLabel(c), len = plainLen(lab) + 2;
        if (cx + len > x + w - 2) { yy++; cx = x + 4; }
        const on = p.look[type] === c.id;
        button(cx, yy, ` ${lab} `, 'out:' + c.id, () => { ui.outfitRow = row; doAction({ type: 'cosmetic', id: c.id }); },
          { bg: on ? SEL_BG : null });
        cx += len + 1;
      }
      yy++;
    });
    mtext(x + 2, y + h - 2, '{d}Click to wear · ↑↓ slot · ←→ cycle{/}');
    closeBtn(x, y, w, h);
  }

  function drawHelp() {
    const x = 10, y = 1, w = 80, h = 31;
    box(x, y, w, h, '{y}How to play{/}', { bg: MODAL_BG });
    let yy = y + 2;
    for (const e of HELP) {
      if (!e) { yy++; continue; }
      mtext(x + 3, yy, e[0]);
      for (const ln of wrap(e[1], w - 20, FG)) { if (yy > y + h - 3) break; drawLine(x + 17, yy++, ln); }
    }
    button(x + w - 14, y + h - 2, '{y}[Esc]{/} Close', 'help:close', () => {
      if (ui.screen === 'title') ui.titleHelp = false;
      else ui.overlay = null;
    });
  }

  const menuItems = () => [
    ['Resume', () => (ui.overlay = null)],
    ['Save game', () => { saveGame(); Engine.note(s, '{d}Game saved.{/}'); ui.overlay = null; }],
    ['Quit to title', quitToTitle],
  ];
  function drawMenu() {
    const x = 16, y = 6, w = 30, h = 9;
    box(x, y, w, h, 'Menu', { bg: MODAL_BG });
    menuItems().forEach(([label, fn], k) => button(x + 2, y + 2 + k * 2, `{y}[${k + 1}]{/} ${label}`, 'menu:' + k, fn, { w: w - 4 }));
  }

  /* ---------- Render loop (on demand) ---------- */
  let pending = false, animTimer = null;
  function render() {
    if (!pending) { pending = true; requestAnimationFrame(draw); }
  }
  function animating(now) {
    if (ui.screen === 'title') return true;
    if (ui.screen !== 'game') return false;
    if (ui.banner && now < ui.banner.until) return true;
    if (now < ui.pflash || (ui.pfloat && now < ui.pfloat.until)) return true;
    for (const k in ui.efloat) if (now < ui.efloat[k].until) return true;
    for (const k in ui.eflash) if (now < ui.eflash[k]) return true;
    return !!(ui.pull && now - ui.pull.t0 < ui.pull.results.length * 140 + 200);
  }
  function draw() {
    pending = false;
    const now = performance.now();
    clear();
    if (ui.screen === 'title') drawTitle(now);
    else if (ui.screen === 'create') drawCreate();
    else drawGame(now);
    flush();
    if (!animTimer && animating(now)) {
      animTimer = setTimeout(() => { animTimer = null; render(); }, ui.screen === 'title' ? 100 : 50);
    }
  }

  /* ---------- Keyboard ---------- */
  function titleKey(k) {
    if (ui.titleHelp) {
      if (k === 'Escape' || k === 'h' || k === 'Enter') { ui.titleHelp = false; return true; }
      return false;
    }
    if (k === 'n') startCreate();
    else if (k === 'c' && ui.saveInfo) loadGame();
    else if (k === 'h' || k === '?') ui.titleHelp = true;
    else if (k === 'Enter') (ui.saveInfo ? loadGame : startCreate)();
    else return false;
    return true;
  }

  function createKey(e) {
    const k = e.key, cr = ui.create;
    if (k === 'ArrowUp') cr.sel = (cr.sel + 4) % 5;
    else if (k === 'ArrowDown') cr.sel = (cr.sel + 1) % 5;
    else if (k === 'ArrowLeft' || k === '-') adjust(cr.sel, -1);
    else if (k === 'ArrowRight' || k === '+' || k === '=') adjust(cr.sel, 1);
    else if (k === 'Enter') begin();
    else if (k === 'Escape') ui.screen = 'title';
    else if (k === 'Backspace') cr.name = cr.name.slice(0, -1);
    else if (k.length === 1 && /[A-Za-z0-9 ']/.test(k)) { if (cr.name.length < 14) cr.name += k; }
    else return false;
    return true;
  }

  function outfitKey(k) {
    const T = OUTFIT_TYPES;
    if (k === 'ArrowUp' || k === 'w') ui.outfitRow = (ui.outfitRow + T.length - 1) % T.length;
    else if (k === 'ArrowDown' || k === 's') ui.outfitRow = (ui.outfitRow + 1) % T.length;
    else if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'a' || k === 'd') {
      const type = T[ui.outfitRow][0];
      const owned = D.cosmetics.filter((c) => c.type === type && s.p.cos.includes(c.id));
      if (owned.length > 1) {
        const cur = owned.findIndex((c) => c.id === s.p.look[type]);
        const dir = k === 'ArrowLeft' || k === 'a' ? -1 : 1;
        doAction({ type: 'cosmetic', id: owned[(cur + dir + owned.length) % owned.length].id });
      }
    } else return false;
    return true;
  }

  function overlayKey(k) {
    const n = parseInt(k, 10);
    const closeKey = { inv: 'i', char: 'c', quests: 'q', outfit: 'o', help: '?' }[ui.overlay];
    if (k === 'Escape' || k === closeKey) { ui.overlay = null; return true; }
    switch (ui.overlay) {
      case 'inv': {
        const inv = Engine.inventory(s);
        if (n >= 1 && n <= inv.length) { doAction({ type: 'use', id: inv[n - 1].id }); return true; }
        return false;
      }
      case 'char':
        if (n >= 1 && n <= Engine.STATS.length) { doAction({ type: 'alloc', stat: Engine.STATS[n - 1].k }); return true; }
        return false;
      case 'outfit':
        return outfitKey(k);
      case 'menu': {
        const m = menuItems();
        if (n >= 1 && n <= m.length) { m[n - 1][1](); return true; }
        return false;
      }
    }
    return false;
  }

  function combatKey(k) {
    if (k === 'Tab' || k === 'ArrowRight' || k === 'ArrowLeft') { cycleTarget(k === 'ArrowLeft' ? -1 : 1); return true; }
    const n = parseInt(k, 10);
    if (ui.cmenu === 'main') {
      const opts = combatOptions();
      if (n >= 1 && n <= opts.length) { opts[n - 1].fn(); return true; }
      if (k === 'Enter') { opts[0].fn(); return true; }
      return false;
    }
    if (k === 'Escape' || k === '0' || k === 'Backspace') { ui.cmenu = 'main'; return true; }
    const list = combatList();
    if (n >= 1 && n <= Math.min(5, list.length)) { list[n - 1].fn(); return true; }
    return false;
  }

  function gameKey(k) {
    if (k === 'PageUp') { ui.logScroll += 4; return true; }
    if (k === 'PageDown') { ui.logScroll = Math.max(0, ui.logScroll - 4); return true; }
    if (ui.overlay) return overlayKey(k);
    const n = parseInt(k, 10);
    switch (s.scene) {
      case 'explore':
        if (MOVE[k]) { ui.walk = []; doAction({ type: 'move', dx: MOVE[k][0], dy: MOVE[k][1] }); return true; }
        if (k === 'i') openOverlay('inv');
        else if (k === 'c') openOverlay('char');
        else if (k === 'q') openOverlay('quests');
        else if (k === 'o') openOverlay('outfit');
        else if (k === '?' || k === '/') openOverlay('help');
        else if (k === 'Escape') openOverlay('menu');
        else return false;
        return true;
      case 'combat':
        return combatKey(k);
      case 'dialog': {
        const v = Engine.dialogView(s), nc = v.choices.length;
        if (n >= 1 && n <= nc) doAction({ type: 'choose', i: n - 1 });
        else if (k === 'ArrowUp' || k === 'w') ui.dsel = (ui.dsel + nc - 1) % nc;
        else if (k === 'ArrowDown' || k === 's') ui.dsel = (ui.dsel + 1) % nc;
        else if (k === 'Enter' || k === ' ') doAction({ type: 'choose', i: ui.dsel });
        else if (k === 'Escape') doAction({ type: 'leave' });
        else return false;
        return true;
      }
      case 'shop': {
        if (k === 'Escape') { doAction({ type: 'leave' }); return true; }
        if (k === 'Tab') { ui.shopTab = ui.shopTab === 'buy' ? 'sell' : 'buy'; return true; }
        const list = shopEntries();
        if (n >= 1 && n <= Math.min(7, list.length)) { list[n - 1].fn(); return true; }
        return false;
      }
      case 'shrine':
        if (k === 'Escape') doAction({ type: 'leave' });
        else if (k === '1') doAction({ type: 'pull', n: 1 });
        else if (k === '2') doAction({ type: 'pull', n: 10 });
        else if (k === 'o') openOverlay('outfit');
        else return false;
        return true;
      case 'gameover':
        if (k === 'r' || k === 'Enter') { doAction({ type: 'respawn' }); return true; }
        return false;
    }
    return false;
  }

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    let used;
    if (ui.screen === 'title') used = titleKey(k);
    else if (ui.screen === 'create') used = createKey(e);
    else used = gameKey(k);
