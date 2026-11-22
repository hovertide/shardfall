'use strict';
/* SHARDFALL ui - scenes/create.js : name + starting stat points. */
(function () {
  const U = SF.UI, ui = U.ui, D = SF.data, R = D.rules;

  U.startCreate = function () {
    ui.create = { name: '', alloc: { vit: 0, str: 0, sta: 0, spi: 0, wil: 0 }, sel: 0 };
    ui.screen = 'create';
    ui.msg = null;
  };

  U.adjustStat = function (k, delta) {
    const cr = ui.create, key = D.stats[k].k;
    const used = D.stats.reduce((t, st) => t + cr.alloc[st.k], 0);
    if (delta > 0 && used >= R.startPoints) return;
    cr.alloc[key] = Math.max(0, cr.alloc[key] + delta);
  };

  function renamePrompt() {
    let n = null;
    try { n = window.prompt('Your name:', ui.create.name); } catch (e) { /* prompts blocked */ }
    if (n != null) ui.create.name = n.replace(/[^A-Za-z0-9 '\-]/g, '').slice(0, 14);
  }

  U.beginGame = function () {
    const cr = ui.create;
    ui.s = Engine.newGame({ name: cr.name, alloc: cr.alloc });
    U.resetUi();
    ui.newFrom = 0;
    ui.screen = 'game';
    Engine.note(ui.s, '{d}Tip: press [?] for help, [J] for your journal. Click any explored tile to walk there.{/}');
    U.saveGame();
  };

  U.drawCreate = function () {
    const x = 15, y = 3, w = 70, h = 27, cr = ui.create;
    const used = D.stats.reduce((t, st) => t + cr.alloc[st.k], 0), left = R.startPoints - used;
    U.box(x, y, w, h, '{y}A new wanderer{/}', { bg: U.MODAL_BG });
    U.text(x + 3, y + 2, 'Who were you, before the sky cracked?', U.FG);
    U.text(x + 3, y + 4, 'Name', U.DIM);
    U.button(x + 9, y + 4, `[ ${U.pad(cr.name + '_', 15)} ]`, 'cr:name', renamePrompt);
    U.mtext(x + 31, y + 4, '{d}type, or click to rename{/}');
    U.mtext(x + 3, y + 6, `Points to spend: {y}${left}{/}  {d}(+${R.pointsPerLevel} per level, more from standing stones){/}`);

    D.stats.forEach((st, k) => {
      const yy = y + 8 + k * 2, sel = cr.sel === k;
      U.area(x + 2, yy, w - 4, 2, U.region('cr:row:' + k, () => (cr.sel = k)));
      if (sel) U.fillBg(x + 2, yy, w - 4, 2, U.SEL_BG);
      U.text(x + 3, yy, sel ? '>' : ' ', U.C.y);
      U.text(x + 5, yy, st.name, st.color);
      U.button(x + 16, yy, '{d}[-]{/}', 'cr:-:' + k, () => { cr.sel = k; U.adjustStat(k, -1); });
      U.text(x + 20, yy, String(R.baseStat + cr.alloc[st.k]).padStart(3), U.C.w);
      U.button(x + 24, yy, '{g}[+]{/}', 'cr:+:' + k, () => { cr.sel = k; U.adjustStat(k, 1); });
      U.wrap(st.desc, w - 33, U.DIM).slice(0, 2).forEach((ln, j) => U.drawLine(x + 30, yy + j, ln));
    });

    const stats = {};
    for (const st of D.stats) stats[st.k] = R.baseStat + cr.alloc[st.k];
    const d = Engine.derived({ stats, lvl: 1, weapon: R.start.weapon });
    const pct = U.pct;
    U.mtext(x + 3, y + 19, `{d}HP{/} ${d.maxHp}  {d}Stamina{/} ${d.maxSt}  {d}Spirit{/} ${d.maxSp}  {d}Damage{/} ${d.dmgMin}-${d.dmgMax}  {d}Crit{/} ${pct(d.crit)}  {d}Dodge{/} ${pct(d.dodge)}`);
    U.mtext(x + 3, y + 20, `{d}Resist{/} ${pct(d.resist)}  {d}Brink{/} -${d.brink} HP  {d}Fury{/} +${pct(d.furyBonus)}  {d}Dread resist{/} ${pct(d.dreadResist)}`);
    if (ui.saveInfo) U.mtext(x + 3, y + 22, `{o}Starting will overwrite your saved game ${ui.saveInfo}.{/}`);
    U.button(x + 3, y + 24, '{y}[Enter]{/} Begin', 'cr:go', U.beginGame);
    U.button(x + 22, y + 24, '{y}[Esc]{/} Back', 'cr:back', () => (ui.screen = 'title'));
    U.mtext(x + 38, y + 24, '{d}Up/Down pick - Left/Right adjust{/}');
  };
})();
