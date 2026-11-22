'use strict';
/* =====================================================================
   SHARDFALL ui - input.js
   Keyboard and mouse -> UI functions / Engine actions.
   While an animation plays, any key or click skips it.
   ===================================================================== */
(function () {
  const U = SF.UI, ui = U.ui, D = SF.data;

  const MOVE = {
    ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
    y: [-1, -1], u: [1, -1], b: [-1, 1], n: [1, 1],
    8: [0, -1], 2: [0, 1], 4: [-1, 0], 6: [1, 0], 7: [-1, -1], 9: [1, -1], 1: [-1, 1], 3: [1, 1],
  };

  function titleKey(k) {
    if (ui.titleHelp) {
      if (k === 'Escape' || k === 'h' || k === 'Enter') { ui.titleHelp = false; return true; }
      return false;
    }
    if (k === 'n') U.startCreate();
    else if (k === 'c' && ui.saveInfo) U.loadGame();
    else if (k === 'h' || k === '?') ui.titleHelp = true;
    else if (k === 'Enter') (ui.saveInfo ? U.loadGame : U.startCreate)();
    else return false;
    return true;
  }

  function createKey(e) {
    const k = e.key, cr = ui.create, n = D.stats.length;
    if (k === 'ArrowUp') cr.sel = (cr.sel + n - 1) % n;
    else if (k === 'ArrowDown') cr.sel = (cr.sel + 1) % n;
    else if (k === 'ArrowLeft' || k === '-') U.adjustStat(cr.sel, -1);
    else if (k === 'ArrowRight' || k === '+' || k === '=') U.adjustStat(cr.sel, 1);
    else if (k === 'Enter') U.beginGame();
    else if (k === 'Escape') ui.screen = 'title';
    else if (k === 'Backspace') cr.name = cr.name.slice(0, -1);
    else if (k.length === 1 && /[A-Za-z0-9 ']/.test(k)) { if (cr.name.length < 14) cr.name += k; }
    else return false;
    return true;
  }

  function outfitKey(k) {
    const T = U.OUTFIT_TYPES;
    if (k === 'ArrowUp' || k === 'w') ui.outfitRow = (ui.outfitRow + T.length - 1) % T.length;
    else if (k === 'ArrowDown' || k === 's') ui.outfitRow = (ui.outfitRow + 1) % T.length;
    else if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'a' || k === 'd') {
      const type = T[ui.outfitRow][0];
      const owned = Object.values(D.cosmetics).filter((c) => c.type === type && ui.s.p.cos.includes(c.id));
      if (owned.length > 1) {
        const cur = owned.findIndex((c) => c.id === ui.s.p.look[type]);
        const dir = k === 'ArrowLeft' || k === 'a' ? -1 : 1;
        U.doAction({ type: 'cosmetic', id: owned[(cur + dir + owned.length) % owned.length].id });
      }
    } else return false;
    return true;
  }

  function journalKey(k) {
    const n = D.enemies ? Object.keys(D.enemies).length : 0;
    if (k === 'Tab') ui.jTab = ui.jTab === 'beasts' ? 'places' : 'beasts';
    else if (k === 'ArrowUp' || k === 'w') ui.jSel = (ui.jSel + n - 1) % n;
    else if (k === 'ArrowDown' || k === 's') ui.jSel = (ui.jSel + 1) % n;
    else return false;
    return true;
  }

  function overlayKey(k) {
    if (ui.overlay === 'inv') return U.invKey(k);
    const n = parseInt(k, 10);
    const closeKey = { char: 'c', quests: 'q', outfit: 'o', help: '?', journal: 'j' }[ui.overlay];
    if (k === 'Escape' || k === closeKey) { ui.overlay = null; return true; }
    switch (ui.overlay) {
      case 'char':
        if (n >= 1 && n <= D.stats.length) { U.doAction({ type: 'alloc', stat: D.stats[n - 1].k }); return true; }
        return false;
      case 'outfit': return outfitKey(k);
      case 'journal': return journalKey(k);
      case 'menu': {
        const m = U.menuItems();
        if (n >= 1 && n <= m.length) { m[n - 1][1](); return true; }
        return false;
      }
    }
    return false;
  }

  function combatKey(k) {
    if (ui.timing) {
      if (k === 'Escape' || k === 'Backspace') { U.cancelTiming(); return true; }
      U.resolveTiming();   // any other key swings
      return true;
    }
    if (k === 'Tab' || k === 'ArrowRight' || k === 'ArrowLeft') { U.cycleTarget(k === 'ArrowLeft' ? -1 : 1); return true; }
    const n = parseInt(k, 10);
    if (ui.cmenu === 'main') {
      const opts = U.combatOptions();
      if (n >= 1 && n <= opts.length) { opts[n - 1].fn(); return true; }
      if (k === 'Enter') { opts[0].fn(); return true; }
      return false;
    }
    if (k === 'Escape' || k === '0' || k === 'Backspace') { ui.cmenu = 'main'; return true; }
    const list = U.combatList();
    if (n >= 1 && n <= Math.min(7, list.length)) { list[n - 1].fn(); return true; }
    return false;
  }

  function gameKey(k, code) {
    const s = ui.s;
    if (k === 'PageUp') { ui.logScroll += 4; return true; }
    if (k === 'PageDown') { ui.logScroll = Math.max(0, ui.logScroll - 4); return true; }
    if (ui.overlay) return overlayKey(k);
    const n = parseInt(k, 10);
    switch (s.scene) {
      case 'explore':
        // top-row number keys use the hotbar; numpad digits (and letters/arrows) move
        if (code && code.startsWith('Digit') && n >= 1 && n <= 8) { U.itemAction(Engine.bag(s)[n - 1]); return true; }
        if (MOVE[k]) { ui.walk = []; U.doAction({ type: 'move', dx: MOVE[k][0], dy: MOVE[k][1] }); return true; }
        if (k === 'i') U.openOverlay('inv');
        else if (k === 'c') U.openOverlay('char');
        else if (k === 'q') U.openOverlay('quests');
        else if (k === 'o') U.openOverlay('outfit');
        else if (k === 'j') U.openOverlay('journal');
        else if (k === '?' || k === '/') U.openOverlay('help');
        else if (k === 'Escape') U.openOverlay('menu');
        else return false;
        return true;
      case 'combat':
        return combatKey(k);
      case 'dialog': {
        const v = Engine.dialogView(s), nc = v.choices.length;
        if (n >= 1 && n <= nc) U.doAction({ type: 'choose', i: n - 1 });
        else if (k === 'ArrowUp' || k === 'w') ui.dsel = (ui.dsel + nc - 1) % nc;
        else if (k === 'ArrowDown' || k === 's') ui.dsel = (ui.dsel + 1) % nc;
        else if (k === 'Enter' || k === ' ') U.doAction({ type: 'choose', i: ui.dsel });
        else if (k === 'Escape') U.doAction({ type: 'leave' });
        else return false;
        return true;
      }
      case 'shop': {
        if (k === 'Escape') { U.doAction({ type: 'leave' }); return true; }
        if (k === 'Tab') { ui.shopTab = ui.shopTab === 'buy' ? 'sell' : 'buy'; return true; }
        const list = U.shopEntries();
        if (n >= 1 && n <= Math.min(9, list.length)) { list[n - 1].fn(); return true; }
        return false;
      }
      case 'shrine':
        if (k === 'Escape') U.doAction({ type: 'leave' });
        else if (k === '1') U.doAction({ type: 'pull', n: 1 });
        else if (k === '2') U.doAction({ type: 'pull', n: 10 });
        else if (k === 'o') U.openOverlay('outfit');
        else return false;
        return true;
      case 'gameover':
        if (k === 'r' || k === 'Enter') { U.doAction({ type: 'respawn' }); return true; }
        return false;
    }
    return false;
  }

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    let used;
    if (ui.screen === 'game' && U.anim.busy()) { U.anim.skip(); used = true; }
    else if (ui.screen === 'title') used = titleKey(k);
    else if (ui.screen === 'create') used = createKey(e);
    else used = gameKey(k, e.code);
    if (used) { e.preventDefault(); U.render(); }
  });

  /* ---------- Mouse ---------- */
  const screen = U.screenEl;
  function cellAt(e) {
    const r = screen.getBoundingClientRect();
    const x = Math.floor((e.clientX - r.left) / (r.width / U.COLS));
    const y = Math.floor((e.clientY - r.top) / (r.height / U.ROWS));
    return x >= 0 && y >= 0 && x < U.COLS && y < U.ROWS ? { x, y } : null;
  }
  screen.addEventListener('mousemove', (e) => {
    const c = cellAt(e), r = c ? U.rg[c.y * U.COLS + c.x] : -1, key = r >= 0 ? U.regions[r].key : null;
    const moved = !ui.hcell || !c || c.x !== ui.hcell.x || c.y !== ui.hcell.y;
    const old = ui.hover;
    ui.hcell = c;
    if (key !== old || (moved && (key === 'map' || ui.overlay === 'inv'))) { ui.hover = key; U.render(); }
  });
  screen.addEventListener('mouseleave', () => { ui.hover = null; ui.hcell = null; U.render(); });
  screen.addEventListener('click', (e) => {
    const c = cellAt(e);
    if (!c) return;
    if (ui.screen === 'game' && U.anim.busy()) { U.anim.skip(); return; }
    const r = U.rg[c.y * U.COLS + c.x];
    // while the strike bar is up, a click anywhere on the combat panel swings
    const M = U.L.MAP;
    if (ui.timing && c.x < M.x + M.w && c.y < M.y + M.h && !(r >= 0 && U.regions[r].key === 'tm:cancel')) { U.resolveTiming(); return; }
    if (r >= 0) { U.regions[r].fn(c.x, c.y); U.render(); }
  });
  // right-click: a region's quick action (use / equip), if it has one
  screen.addEventListener('contextmenu', (e) => {
    const c = cellAt(e);
    if (!c || ui.screen !== 'game') return;
    e.preventDefault();
    if (U.anim.busy()) { U.anim.skip(); return; }
    const r = U.rg[c.y * U.COLS + c.x];
    if (r >= 0 && U.regions[r].alt) { U.regions[r].alt(c.x, c.y); U.render(); }
  });
  screen.addEventListener('wheel', (e) => {
    if (ui.screen !== 'game') return;
    const c = cellAt(e);
    const L = U.L.LOG;
    if (!c || c.y < L.y || c.y >= L.y + L.h || c.x >= L.x + L.w) return;
    e.preventDefault();
    ui.logScroll = Math.max(0, ui.logScroll + (e.deltaY < 0 ? 2 : -2));
    U.render();
  }, { passive: false });
})();
