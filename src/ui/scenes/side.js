'use strict';
/* =====================================================================
   SHARDFALL ui - scenes/side.js
   The character panel on the right. While exploring its lower half
   shows quests and an altitude gauge; in combat it shows your weapon,
   which lunges at the enemies when you strike.
   ===================================================================== */
(function () {
  const U = SF.UI, ui = U.ui, D = SF.data;
  const X0 = 62, W = 38, x = X0 + 2;

  // Where effects aimed at "you" should go.
  U.SIDE = { hpX: X0 + 12, hpY: 3, anchor: () => ({ x: 61, y: 16 }) };

  function resRow(y, label, val, max, color, brink) {
    U.text(x, y, label, U.DIM);
    if (val < 0 && brink) {   // below zero: how close you are to falling
      const depth = Math.round(Math.min(1, -val / brink) * 18);
      for (let k = 0; k < 18; k++) U.put(x + 4 + k, y, k < depth ? '#' : '-', k < depth ? '#b02040' : '#3a1a22');
    } else U.bar(x + 4, y, 18, val, max, color);
    U.text(x + 23, y, `${val}/${max}`, val <= 0 ? U.C.r : U.FG);
  }

  U.drawSide = function (now) {
    const s = ui.s, p = s.p, d = Engine.derived(p), L = Engine.look(p);
    U.box(X0, 0, W, 22, 'Character');
    U.put(x, 1, L.glyph, L.color);
    U.text(x + 2, 1, p.name, L.color);
    U.text(X0 + W - 2 - L.title.length, 1, L.title, U.DIM);
    const need = Engine.xpNeed(p.lvl);
    U.text(x, 2, `Lv ${p.lvl}`, U.C.y);
    U.bar(x + 7, 2, 16, p.xp, need, '#a07cff');
    U.text(x + 24, 2, `${p.xp}/${need}`, U.DIM);

    const php = U.anim.php(s), flash = now < ui.pflash;
    resRow(3, 'HP', php, d.maxHp, flash ? U.C.w : U.hpColor(php / d.maxHp), d.brink);
    resRow(4, 'ST', p.st, d.maxSt, '#7ddc6f');
    resRow(5, 'SP', p.sp, d.maxSp, '#5ca8ff');
    resRow(6, 'SAN', p.san, d.maxSan, '#c792ea');
    U.mtext(x, 7, `{y}Gold{/} ${U.anim.gold(s)}`);
    U.mtext(x + 16, 7, `{m}Shards{/} ${p.shards}`);
    U.mtext(x, 8, `{d}Weapon{/} ${D.weapons[p.weapon].name} {d}(${d.dmgMin}-${d.dmgMax}){/}`, U.FG, null, null, 34);
    let cx = x;
    for (const c of Engine.conditions(s)) cx += U.text(cx, 9, c.name, c.color) + 1;
    if (p.points > 0 && cx < x + 20) {
      U.button(cx, 9, `{y}* ${p.points} point${p.points > 1 ? 's' : ''}{/} {d}[C]{/}`, 'side:pts', () => U.openOverlay('char'));
    }
    if (U.anim.scene(s) === 'combat') drawWeapon(now);
    else drawExplore();

    // floats aimed at the side panel
    for (const f of ui.floats) {
      if (f.mx != null || f.x < X0) continue;
      const t = (now - f.t0) / f.dur;
      if (t < 1) U.text(Math.min(X0 + W - 2 - f.text.length, f.x), f.y - (t > 0.6 ? 1 : 0), f.text, f.color, U.BANNER_BG);
    }
  };

  function drawExplore() {
    const s = ui.s, p = s.p;
    U.rule(x, 10, 34, 'Quests');
    const rq = U.region('side:quests', () => U.openOverlay('quests'));
    const qs = Engine.questLog(s).filter((q) => q.status !== 'done');
    let y = 11;
    if (!qs.length) U.mtext(x, y, p.flags.chapter1 ? '{y}Chapter I complete.{/} {d}Explore freely.{/}' : '{d}Talk to people to find work.{/}', U.FG, null, rq);
    for (const q of qs) {
      const t = `${q.status === 'ready' ? '{y}!{/}' : '{c}-{/}'} ${q.short}` +
        (q.progress && q.status === 'active' ? ` {d}${q.progress}{/}` : '') + (q.status === 'ready' ? ' {y}(return){/}' : '');
      for (const ln of U.wrap(t, 34, U.FG)) { if (y > 13) break; U.drawLine(x, y++, ln, null, rq); }
    }
    drawWhere(15);
  }

  // Altitude gauge for vertical regions, area info otherwise.
  function drawWhere(y0) {
    const s = ui.s, m = Engine.map(s), reg = m.region;
    U.rule(x, y0 - 1, 34, reg ? reg.name : m.name, U.C.c);
    if (reg && reg.levels.length > 1) {
      const lv = reg.levels, k0 = lv.indexOf(m.id);
      lv.forEach((mk, k) => {
        const here = k === k0, mm = Engine.data.maps[mk], known = ui.s.p.visited[mk];
        let icon;
        if (reg.shape === 'mountain') icon = ' '.repeat(lv.length - 1 - k) + '/' + ' '.repeat(k * 2) + '\\';
        else icon = ' '.repeat(k * 3) + (k ? '|' : '') + '___';
        const col = here ? U.C.y : known ? '#8a8a96' : '#3a3a4a';
        U.text(x, y0 + k, icon, here ? U.C.c : '#5a5a6a');
        U.text(x + 10, y0 + k, known ? mm.name.replace(reg.name + ' ', '').replace('Hollow ', '') : '???', col);
        if (here) U.text(x + 26, y0 + k, '< you', U.C.y);
      });
    } else {
      U.mtext(x, y0, `{d}${m.safe ? 'Safe. Rest and resupply here.' : 'Danger: ' + m.danger}{/}`);
    }
    U.mtext(x, y0 + 5, `{d}explored ${Math.round(Engine.explored(s) * 100)}%  -  standing stones ${ui.s.p.stones || 0}{/}`);
  }

  function drawWeapon(now) {
    const s = ui.s, p = s.p, w = D.weapons[p.weapon], d = Engine.derived(p), c = U.anim.combat(s);
    U.rule(x, 10, 34, w.name, U.C.w);
    const lunge = U.anim.view ? U.anim.view.wlunge || 0 : 0;
    U.drawSprite(w.sprite || p.weapon, X0 + 19 - Math.round(lunge * 6), 15 - Math.round(lunge), { color: U.FG, clip: { x0: X0 + 1, y0: 11, x1: X0 + W - 2, y1: 16 } });
    const T = w.timing || {};
    U.mtext(x, 17, `{d}Dmg{/} ${d.dmgMin}-${d.dmgMax}  {d}Crit{/} ${U.pct(d.crit)}  {d}${T.sweep < 750 ? 'fast' : T.sweep > 1000 ? 'slow' : 'steady'} swing{/}`);
    if (w.el && w.el !== 'phys') U.mtext(x, 18, `{d}Element:{/} {${D.elements[w.el].color}}${D.elements[w.el].name}{/}${w.burn ? ` {d}(${Math.round(w.burn * 100)}% burn){/}` : ''}`);
    if (c && c.hound) {
      const h = c.hound;
      U.mtext(x, 19, '{m}Hound{/}');
      U.bar(x + 6, 19, 10, h.hp, h.maxHp, '#d08bff');
      U.mtext(x + 17, 19, `{d}${h.hp}hp ${h.turns} turns{/}`);
    }
    if (ui.lastQ && now < (ui.lastQt || 0)) U.text(x, 20, ui.lastQ.toUpperCase() + '!', ui.lastQ === 'perfect' ? U.C.y : U.DIM);
  }
})();
