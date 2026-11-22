'use strict';
/* =====================================================================
   SHARDFALL ui - main.js
   The render loop (on demand: it only keeps redrawing while something
   moves) and startup. Loaded last.
   ===================================================================== */
(function () {
  const U = SF.UI, ui = U.ui;
  let pending = false, timer = null, due = 0;

  U.render = function () {
    if (!pending) { pending = true; requestAnimationFrame(draw); }
  };

  // How soon the next frame is needed (ms), or 0 for "only on input".
  function nextFrame(now) {
    if (ui.screen === 'title') return 90;
    if (ui.screen !== 'game' || !ui.s) return 0;
    if (U.anim.busy() || ui.timing) return 16;
    if (ui.banner && now < ui.banner.until) return 50;
    if (now < ui.pflash || now < ui.shake || ui.floats.length) return 33;
    if (ui.pull && now - ui.pull.t0 < ui.pull.results.length * 140 + 200) return 50;
    if (ui.s.scene === 'combat') return 120;          // idle sprite frames, blinking intents
    if (ui.s.scene === 'explore' && !ui.overlay) return 220;   // water shimmer, glowing crystals
    return 0;
  }

  function drawGame(now) {
    const s = ui.s, scene = U.anim.scene(s);
    if (scene === 'combat') U.drawCombat(now);
    else U.drawMapPanel(now);
    U.drawSide(now);
    U.anim.draw(now);          // effects on top of both panels
    U.drawLog();
    U.drawPack();
    U.drawBar();
    if (!U.anim.busy()) {
      if (s.scene === 'dialog') U.drawDialog();
      else if (s.scene === 'shop') U.drawShop();
      else if (s.scene === 'shrine') U.drawShrine(now);
      else if (s.scene === 'gameover') U.drawGameOver();
    }
    switch (ui.overlay) {
      case 'inv': U.drawInv(now); break;
      case 'char': U.drawChar(); break;
      case 'quests': U.drawQuests(); break;
      case 'journal': U.drawJournal(now); break;
      case 'outfit': U.drawOutfit(); break;
      case 'help': U.drawHelp(); break;
      case 'menu': U.drawMenu(); break;
    }
    U.drawBanner(now);
  }

  function draw() {
    pending = false;
    const now = performance.now();
    U.anim.tick(now);
    ui.floats = ui.floats.filter((f) => now < f.t0 + f.dur);
    U.clear();
    try {
      if (ui.screen === 'title') U.drawTitle(now);
      else if (ui.screen === 'create') U.drawCreate();
      else drawGame(now);
    } catch (e) {
      console.error(e);
      U.text(1, 0, ` Drawing error: ${e.message} `.slice(0, 98), '#ff6b6b', '#2a0a10');
    }
    if (SF.problems.length && ui.screen === 'title') U.text(1, U.ROWS - 1, ` ${SF.problems.length} content problem(s): see the browser console (F12) `, '#ff9a4a');
    U.flush();
    const dt = nextFrame(now);
    if (dt && (!timer || now + dt < due - 4)) {     // (re)schedule if we need a frame sooner
      clearTimeout(timer);
      due = now + dt;
      timer = setTimeout(() => { timer = null; U.render(); }, dt);
    }
  }

  /* ---------- Fit the grid to the window ---------- */
  function fit() {
    const el = U.screenEl;
    el.style.fontSize = '20px';
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const scale = Math.min((innerWidth - 8) / r.width, (innerHeight - 8) / r.height);
    const px = Math.max(6, 20 * scale);
    el.style.fontSize = px.toFixed(2) + 'px';
    U.fineEl.style.fontSize = (px / 2).toFixed(3) + 'px';    // the tiny-text layer is exactly half size
  }

  /* ---------- Boot ---------- */
  ui.saveInfo = U.readSaveInfo();
  draw();
  fit();
  addEventListener('resize', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  addEventListener('beforeunload', U.saveGame);
  addEventListener('pagehide', U.saveGame);
})();
