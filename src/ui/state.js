'use strict';
/* =====================================================================
   SHARDFALL ui - state.js
   UI-only state (what screen is open, hover, animations...) and the
   bridge to the engine: doAction() runs an action, then hands the
   resulting fx list to the animation player.
   The game state itself lives in ui.s and is only changed by Engine.act.
   ===================================================================== */
(function () {
  const U = SF.UI;
  const SAVE_KEY = 'shardfall.save', SETTINGS_KEY = 'shardfall.settings';

  const ui = U.ui = {
    s: null,                       // the game state (from Engine)
    screen: 'title', overlay: null, hover: null, hcell: null, titleHelp: false, msg: null, saveInfo: null,
    cmenu: 'main', target: 0, dsel: 0, shopTab: 'buy', outfitRow: 0, logScroll: 0, newFrom: 0,
    jTab: 'beasts', jSel: 0,      // journal
    walk: [], walkTimer: null,
    create: null,
    timing: null,                  // the strike bar while it's up
    floats: [],                    // floating damage numbers
    banner: null, pull: null, trans: null, pflash: 0, shake: 0,
    stars: [],
  };

  /* ---------- Settings (kept separately from saves) ---------- */
  try { Object.assign(U.settings, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); } catch (e) { /* ignore */ }
  U.saveSettings = function () {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(U.settings)); } catch (e) { /* ignore */ }
  };

  U.resetUi = function () {
    Object.assign(ui, { overlay: null, cmenu: 'main', target: 0, dsel: 0, shopTab: 'buy', logScroll: 0, walk: [],
      floats: [], banner: null, pull: null, trans: null, timing: null, titleHelp: false, msg: null, pflash: 0, shake: 0 });
    ui.newFrom = ui.s ? ui.s.log.length : 0;
    if (U.anim) U.anim.reset();
  };

  /* ---------- Saving ---------- */
  let saveTimer = null;
  U.saveGame = function () {
    if (!ui.s) return;
    try { localStorage.setItem(SAVE_KEY, Engine.save(ui.s)); } catch (e) { /* storage full or blocked */ }
  };
  U.scheduleSave = function () { clearTimeout(saveTimer); saveTimer = setTimeout(U.saveGame, 400); };
  U.readSaveInfo = function () {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const j = JSON.parse(raw);
      return j && j.p ? `(${j.p.name}, Lv ${j.p.lvl})` : null;
    } catch (e) { return null; }
  };
  U.loadGame = function () {
    try {
      ui.s = Engine.load(localStorage.getItem(SAVE_KEY));
      U.resetUi();
      ui.screen = 'game';
      Engine.note(ui.s, `{d}Welcome back, ${ui.s.p.name}.{/}`);
    } catch (e) {
      ui.msg = 'Could not load the save: ' + e.message;
    }
  };
  U.quitToTitle = function () {
    U.saveGame();
    ui.s = null;
    U.resetUi();
    ui.screen = 'title';
    ui.saveInfo = U.readSaveInfo();
  };

  /* ---------- Running actions ---------- */
  U.doAction = function (a) {
    const s = ui.s;
    if (s.log.length > 100) s.log.splice(0, s.log.length - 100);
    const before = s.log.length, prevScene = s.scene;
    const snap = U.anim.snapshot(s);
    const res = Engine.act(s, a);
    if (s.log.length > before) { ui.newFrom = before; ui.logScroll = 0; }
    if (s.scene !== prevScene) {
      ui.cmenu = 'main'; ui.dsel = 0; ui.shopTab = 'buy';
      if (prevScene === 'shrine') ui.pull = null;
    }
    if (a.type === 'choose') ui.dsel = 0;
    U.anim.play(res.fx, snap, before);
    U.fixTarget();
    if (ui.overlay && !U.overlayAllowed(ui.overlay)) ui.overlay = null;
    U.scheduleSave();
    U.render();
    return res;
  };

  U.doCombat = function (a) {
    const res = U.doAction(a);
    if (res.ok) ui.cmenu = 'main';
    return res;
  };

  // Attack and sword skills go through the strike bar first (if enabled).
  U.strike = function (a) {
    if (!U.settings.timed) return U.doCombat(Object.assign({ q: 'good' }, a));
    const w = Engine.data.weapons[ui.s.p.weapon], T = w.timing || { sweep: 900, good: 0.38, perfect: 0.11 };
    const center = 0.35 + Math.random() * 0.3;
    ui.timing = { a, t0: performance.now(), sweep: T.sweep * (U.settings.fast ? 0.85 : 1), good: T.good, perfect: T.perfect, center, done: null };
    U.render();
  };

  U.fixTarget = function () {
    const c = ui.s && ui.s.combat;
    if (!c) return;
    if (!c.enemies[ui.target] || c.enemies[ui.target].hp <= 0) {
      const i = c.enemies.findIndex((e) => e.hp > 0);
      ui.target = i < 0 ? 0 : i;
    }
  };
  U.cycleTarget = function (dir) {
    const c = ui.s.combat, n = c.enemies.length;
    for (let k = 1; k <= n; k++) {
      const i = (ui.target + dir * k + n * 2) % n;
      if (c.enemies[i].hp > 0) { ui.target = i; return; }
    }
  };

  /* ---------- Click-to-walk ---------- */
  U.walkTo = function (tx, ty) {
    const s = ui.s;
    if (s.scene !== 'explore' || ui.overlay || U.anim.busy()) return;
    const steps = Engine.path(s, tx, ty);
    if (!steps || !steps.length) return;
    ui.walk = steps;
    if (!ui.walkTimer) walkStep();
  };
  function walkStep() {
    ui.walkTimer = null;
    const s = ui.s;
    if (!s || !ui.walk.length || s.scene !== 'explore' || ui.overlay) { ui.walk = []; return; }
    if (U.anim.busy()) { ui.walkTimer = setTimeout(walkStep, 60); return; }
    const [dx, dy] = ui.walk.shift();
    const res = U.doAction({ type: 'move', dx, dy });
    if (!res.ok || s.scene !== 'explore' || res.fx.some((f) => f.t === 'travel')) { ui.walk = []; return; }
    if (ui.walk.length) ui.walkTimer = setTimeout(walkStep, 55);
  }

  /* ---------- Overlays (inventory, journal, ...) ---------- */
  U.overlayAllowed = function (name) {
    const s = ui.s;
    if (!s) return false;
    if (s.scene === 'explore') return true;
    return s.scene === 'shrine' && name === 'outfit';
  };
  U.openOverlay = function (name) {
    if (!U.overlayAllowed(name) || U.anim.busy()) return;
    ui.overlay = ui.overlay === name ? null : name;
    if (ui.overlay === 'journal') {   // start on the first creature you've met
      const list = Engine.journal(ui.s), cur = list[ui.jSel];
      if (!cur || !cur.known) ui.jSel = Math.max(0, list.findIndex((e) => e.known));
    }
    ui.walk = [];
  };

  U.float = function (x, y, text, color, dur) {
    ui.floats.push({ x, y, text, color, t0: performance.now(), dur: dur || 900 });
  };
})();
