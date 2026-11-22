'use strict';
/* =====================================================================
   SHARDFALL ui - scenes/side.js
   The character panel (top right).
     rows 1-8    name, level, HP / ST / SP / SAN, gold, conditions
     rows 10-16  exploring: quests | altitude gauge
                 in combat: what you know about the target | your status
     rows 17-24  your weapon (it lunges at enemies when you strike)
   ===================================================================== */
(function () {
  const U = SF.UI, ui = U.ui, D = SF.data;
  const B = U.L.SIDE, x = B.x + 2, W = B.w - 4, colR = x + 31, colW = 27;

  // Where effects aimed at "you" should go.
  U.SIDE = {
    hpX: x + 22, hpY: 3,
    anchor: () => ({ x: U.L.VIEW.x + U.L.VIEW.w, y: 20 }),    // spells leave from the right edge of the view
    weapon: { cx: x + 29, bottom: 22 },
  };

  function resRow(y, label, val, max, color, brink) {
    const bw = 38;
    U.text(x, y, label, U.DIM);
    if (val < 0 && brink) {   // below zero: how close you are to falling
      const depth = Math.round(Math.min(1, -val / brink) * bw);
      for (let k = 0; k < bw; k++) U.put(x + 5 + k, y, k < depth ? '━' : '─', k < depth ? '#d02848' : '#3a1a22');
    } else U.bar(x + 5, y, bw, val, max, color);
    U.text(x + 5 + bw + 2, y, `${val}`, val <= 0 ? U.C.r : U.FG);
    U.small(x + 5 + bw + 2 + String(val).length, y + 0.5, `/${max}`, U.DIM);
  }

  U.drawSide = function (now) {
    const s = ui.s, p = s.p, d = Engine.derived(p), L = Engine.look(p);
    U.box(B.x, B.y, B.w, B.h, 'Character');
    U.put(x, 1, L.glyph, L.color);
    U.text(x + 2, 1, p.name, L.color);
    U.text(B.x + B.w - 3 - [...L.title].length, 1, L.title, U.DIM);
    const need = Engine.xpNeed(p.lvl);
    U.text(x, 2, `Lv ${p.lvl}`, U.C.y);
    U.bar(x + 7, 2, 36, p.xp, need, '#a07cff');
    U.small(x + 45, 2.5, `${p.xp} / ${need} xp`, U.DIM);

    const php = U.anim.php(s), flash = now < ui.pflash;
    resRow(3, 'HP', php, d.maxHp, flash ? U.C.w : U.hpColor(php / d.maxHp), d.brink);
    resRow(4, 'ST', p.st, d.maxSt, '#7ddc6f');
    resRow(5, 'SP', p.sp, d.maxSp, '#5ca8ff');
    resRow(6, 'SAN', p.san, d.maxSan, '#c792ea');
    U.mtext(x, 7, `{y}◉ Gold{/} ${U.anim.gold(s)}`);
    U.mtext(x + 16, 7, `{m}◇ Shards{/} ${p.shards}`);
    U.mtext(x + 33, 7, `{c}Π Stones{/} ${p.stones || 0}`);
    let cx = x;
    for (const c of Engine.conditions(s)) cx += U.text(cx, 8, c.name, c.color) + 1;
    if (p.points > 0) U.button(cx, 8, `{y}★ ${p.points} stat point${p.points > 1 ? 's' : ''} to spend{/} {d}[C]{/}`, 'side:pts', () => U.openOverlay('char'));

    if (U.anim.scene(s) === 'combat') drawCombatInfo(now);
    else drawExplore();
    drawWeapon(now);

    // floats aimed at the side panel
    for (const f of ui.floats) {
      if (f.mx != null || f.x < B.x) continue;
      const t = (now - f.t0) / f.dur;
      if (t < 1) U.text(Math.min(B.x + B.w - 2 - [...f.text].length, f.x), f.y - (t > 0.6 ? 1 : 0), f.text, f.color, U.BANNER_BG);
    }
  };

  function drawExplore() {
    const s = ui.s, p = s.p;
    U.rule(x, 10, colW + 1, 'Quests');
    const rq = U.region('side:quests', () => U.openOverlay('quests'));
    const qs = Engine.questLog(s).filter((q) => q.status !== 'done');
    let y = 11;
    if (!qs.length) {
      const t = p.flags.chapter1 ? '{y}Chapter I complete.{/} {d}Explore freely.{/}' : '{d}Talk to people to find work.{/}';
      for (const ln of U.wrap(t, colW, U.FG)) U.drawLine(x, y++, ln, null, rq);
    }
    for (const q of qs) {
      const t = `${q.status === 'ready' ? '{y}!{/}' : '{c}•{/}'} ${q.short}` +
        (q.progress && q.status === 'active' ? ` {d}${q.progress}{/}` : '') + (q.status === 'ready' ? ' {y}(return){/}' : '');
      for (const ln of U.wrap(t, colW, U.FG)) { if (y > 16) break; U.drawLine(x, y++, ln, null, rq); }
    }
    drawWhere();
  }

  // Altitude gauge for vertical regions, area info otherwise.
  function drawWhere() {
    const s = ui.s, m = Engine.map(s), reg = m.region;
    U.rule(colR, 10, colW, reg ? reg.name : m.name, U.C.c);
    if (reg && reg.levels.length > 1) {
      const lv = reg.levels, k0 = lv.indexOf(m.id);
      lv.forEach((mk, k) => {
        const here = k === k0, mm = D.maps[mk], known = s.p.visited[mk];
        const icon = reg.shape === 'mountain'
          ? ' '.repeat(lv.length - 1 - k) + '╱' + ' '.repeat(k * 2) + '╲'
          : ' '.repeat(k * 2) + (k ? '└' : '─') + '──';
        U.text(colR, 11 + k, icon, here ? U.C.c : '#5a5a6a');
        U.text(colR + 9, 11 + k, known ? mm.name.replace(reg.name + ' ', '').replace('Hollow ', '') : '???', here ? U.C.y : known ? '#8a8a96' : '#3a3a4a');
        if (here) U.text(colR + 22, 11 + k, '◄ you', U.C.y);
      });
    } else {
      for (const [k, ln] of U.wrap(`{d}${m.safe ? 'Safe. Rest and resupply here.' : 'Danger: ' + m.danger}{/}`, colW).entries()) U.drawLine(colR, 11 + k, ln);
    }
    U.small(colR, 16, `explored ${Math.round(Engine.explored(s) * 100)}%`, U.DIM);
  }

  // In combat the middle shows what you know about your target.
  function drawCombatInfo() {
    const s = ui.s, c = U.anim.combat(s), t = c && c.enemies[ui.target];
    U.rule(x, 10, colW + 1, 'Target');
    if (t && t.hp > 0) {
      const def = D.enemies[t.key], j = (s.p.journal || {})[t.key] || { el: {}, kills: 0 };
      U.text(x, 11, t.name, def.color);
      U.small(x, 12, `Level ${def.lvl || 1}${j.kills ? `   ATK ${t.atk}   DEF ${t.def}` : '   (defeat one to learn more)'}`, U.DIM);
      const el = (ids) => ids.map((k) => `{${D.elements[k].color}}${D.elements[k].name}{/}`).join(', ');
      const weak = Object.keys(j.el).filter((k) => j.el[k] === 'weak'), res = Object.keys(j.el).filter((k) => j.el[k] === 'resist');
      U.mtext(x, 13, `{d}Weak:{/} ${weak.length ? el(weak) : '{d}?{/}'}`, U.FG, null, null, colW);
      U.mtext(x, 14, `{d}Resists:{/} ${res.length ? el(res) : '{d}?{/}'}`, U.FG, null, null, colW);
      if (t.guard) U.small(x, 15, 'guarding: half damage this turn', '#5ca8ff');
      if (t.next) U.small(x, 15.5, 'winding up: DEFEND next turn!', '#ffe066');
    }
    U.rule(colR, 10, colW, 'You');
    let y = 11;
    for (const cd of Engine.conditions(s)) { U.mtext(colR, y, `{${cd.color}}${cd.name}{/}`); U.small(colR + cd.name.length + 1, y + 0.5, cd.desc, U.DIM, null, 2 * (colW - cd.name.length - 1)); y++; if (y > 15) break; }
    if (y === 11) U.small(colR, 11.5, 'no conditions', U.DIM);
    if (c && c.hound) {
      const h = c.hound;
      U.mtext(colR, 16, '{m}Hound{/}');
      U.bar(colR + 6, 16, 10, h.hp, h.maxHp, '#d08bff');
      U.small(colR + 17, 16.5, `${h.hp}hp · ${h.turns} turns`, U.DIM);
    }
  }

  function drawWeapon(now) {
    const s = ui.s, p = s.p, w = D.weapons[p.weapon], d = Engine.derived(p), W2 = U.SIDE.weapon;
    U.rule(x, 17, W, w.name, U.C.w);
    const lunge = U.anim.view ? U.anim.view.wlunge || 0 : 0;
    U.drawSprite(w.sprite || p.weapon, W2.cx - Math.round(lunge * 7), W2.bottom - Math.round(lunge), { color: U.FG, clip: { x0: B.x + 1, y0: 18, x1: B.x + B.w - 2, y1: 22 } });
    const T = w.timing || {};
    U.mtext(x, 23, `{d}Dmg{/} ${d.dmgMin}-${d.dmgMax}  {d}Crit{/} ${U.pct(d.crit)}  {d}${T.sweep < 750 ? 'fast' : T.sweep > 1000 ? 'slow' : 'steady'} swing{/}` +
      (w.el && w.el !== 'phys' ? `  {${D.elements[w.el].color}}${D.elements[w.el].name}{/}${w.burn ? ` {d}${Math.round(w.burn * 100)}% burn{/}` : ''}` : ''));
    if (ui.lastQ && now < (ui.lastQt || 0)) U.text(x, 24, ui.lastQ === 'perfect' ? '★ PERFECT STRIKE ★' : ui.lastQ === 'good' ? 'good hit' : 'clumsy swing', ui.lastQ === 'perfect' ? U.C.y : U.DIM);
  }
})();
