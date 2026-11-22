'use strict';
/* =====================================================================
   SHARDFALL ui - scenes/combat.js
   The combat panel (the map panel's space, 64 x 24 inside):
     row 1      move callouts          rows 2-11  enemy sprites
     row 12     names                  row 13     HP bars
     row 14     INTENT: what each enemy will do next turn
     row 15     status, in tiny text (burning, guarding, stolen gold)
     rows 17-24 your menu, or the strike bar (scenes/timing.js)
   ===================================================================== */
(function () {
  const U = SF.UI, ui = U.ui, D = SF.data;
  const V = U.L.VIEW, M = U.L.MAP;
  U.ZONE = { x0: V.x, y0: 17, x1: V.x + V.w - 1, y1: V.y + V.h - 1 };   // where enemy attacks "hit the camera"
  const ART_BOTTOM = 11, NAME = 12, HPROW = 13, INTENT_ROW = 14, TAGS = 15, SEP = 16, MENU = 17;

  U.combatGeo = function (c, i) {
    const n = c ? c.enemies.length : 1, slot = Math.floor(V.w / n), sx = V.x + i * slot, cx = sx + Math.floor(slot / 2);
    const e = c && c.enemies[i], sp = e ? U.sprite(D.enemies[e.key].sprite || e.key) : null;
    const h = sp ? sp.h : 5, w = sp ? sp.w : 10, top = ART_BOTTOM - h + 1;
    return { cx, cy: Math.round((top + ART_BOTTOM) / 2), top, bottom: ART_BOTTOM, x0: cx - Math.floor(w / 2), x1: cx - Math.floor(w / 2) + w - 1, sx, slot };
  };

  const INTENT = {
    attack: ['>', '#ff6b6b'], heavy: ['!!', '#ff9a3d'], dread: ['?', '#d08bff'], guard: ['+', '#5ca8ff'],
    charge: ['*', '#ffe066'], other: ['$', '#ffd866'], frozen: ['=', '#7fd8ff'],
  };

  U.drawCombat = function (now) {
    const s = ui.s, c = U.anim.combat(s), view = U.anim.view;
    if (!c) return;
    const first = D.enemies[c.enemies[0].key];
    const title = c.boss ? `{r}BOSS{/}  ${first.name}` : `{r}Combat{/} {d}round ${c.round}{/}`;
    const hurt = now < ui.pflash;
    U.box(M.x, M.y, M.w, M.h, title, hurt ? { color: '#ff5c5c' } : {});
    const sx = now < ui.shake ? (Math.floor(now / 35) % 2 ? 1 : -1) : 0;
    const intro = view && view.intro != null ? view.intro : null;

    c.enemies.forEach((e, i) => {
      const def = D.enemies[e.key], g = U.combatGeo(c, i), cx = g.cx;
      const gone = view ? view.gone[i] : e.hp <= 0;
      const dissolve = view && view.dead[i] ? view.dead[i] : 0;
      const hp = U.anim.ehp(i, e), alive = !gone && hp > 0 || dissolve > 0;
      const sel = !gone && hp > 0 && i === ui.target, hot = !gone && U.hovered('enemy:' + i);
      const r = U.region('enemy:' + i, () => { if (!gone && hp > 0) ui.target = i; });
      if (!gone) U.area(g.sx, V.y, g.slot, TAGS, r);

      if (alive || dissolve) {
        const flash = view && now < (view.flash[i] || 0) ? '#ffffff' : null;
        let col = def.color;
        if (e.frozen > 0) col = '#a8e4ff';
        if (e.next) col = U.mix(def.color, '#ffe066', 0.35 + 0.35 * Math.sin(now / 120));   // winding up
        const dy = (view && view.lunge[i] || 0) + (intro != null ? -Math.round((1 - intro) * 11) : 0);
        U.drawSprite(def.sprite || e.key, cx + sx, ART_BOTTOM, {
          color: col, now: now + i * 230, flash, dissolve, dy, region: gone ? null : r,
          clip: { x0: g.sx, y0: V.y, x1: g.sx + g.slot - 1, y1: TAGS },
        });
      }
      if (intro != null && intro < 0.6) return;
      if (gone) { U.center(cx, NAME, e.name, '#44444e'); U.center(cx, HPROW, 'slain', '#44444e'); return; }
      const name = sel ? `► ${e.name} ◄` : e.name;
      U.center(cx, NAME, name, sel ? U.C.y : hot ? U.C.w : U.FG, sel ? U.SEL_BG : hot ? U.HOVER_BG : null);
      const bw = Math.min(16, g.slot - 7);
      const bx = cx - Math.floor((bw + 5) / 2);
      U.bar(bx, HPROW, bw, hp, e.maxHp, U.hpColor(hp / e.maxHp));
      U.text(bx + bw + 1, HPROW, String(Math.max(0, hp)), U.DIM);
      U.small(bx + bw + 1 + String(Math.max(0, hp)).length, HPROW + 0.5, `/${e.maxHp}`, '#4a4a58');

      const it = Engine.intent(s, e);
      if (it && hp > 0) {
        const [sym, scol] = INTENT[it.kind] || INTENT.attack;
        const blink = it.kind === 'heavy' && Math.floor(now / 350) % 2;
        const txt = `{${blink ? '#ffffff' : scol}}${sym}{/} ${it.name}${it.text ? ` {d}${it.text}{/}` : ''}`;
        const len = U.plainLen(txt), max = g.slot - 1;
        U.mtext(cx - Math.floor(Math.min(len, max) / 2), INTENT_ROW, txt, U.FG, null, null, max);
      }
      const tags = [];
      if (e.burn > 0) tags.push(`{o}burning ${e.burn}{/}`);
      if (e.frozen > 0) tags.push(`{c}frozen ${e.frozen}{/}`);
      if (e.guard) tags.push('{b}guarding{/}');
      if (e.next) tags.push('{#ffe066}winding up!{/}');
      if (e.stolen > 0) tags.push(`{y}holds ${e.stolen} of your gold{/}`);
      if (tags.length) { const t = tags.join(' · '); U.msmall(cx - U.smallLen(t) / 2, TAGS + 0.25, t); }
    });

    U.hsep(M.x, SEP, M.w);
    if (ui.timing) U.drawTiming(now);
    else if (!view) drawMenu();
    else U.mtext(V.x + 1, MENU, '{d}…{/}');

    // floating numbers over enemies
    for (const f of ui.floats) {
      if (f.mx != null || f.x >= M.x + M.w) continue;
      const t = (now - f.t0) / f.dur;
      if (t < 1) U.center(f.x + sx, Math.max(V.y, f.y - Math.floor(t * 2)), f.text, f.color, U.BANNER_BG);
    }
    if (view && view.dim) {   // fading out (defeat / escape)
      for (let y = V.y; y < V.y + V.h; y++) for (let x = V.x; x < V.x + V.w; x++) {
        const p = U.peek(x, y);
        if (p && p.c !== ' ') U.put(x, y, p.c, U.mix(p.f, '#0b0b10', view.dim));
      }
    }
  };

  /* ---------- Menu ---------- */
  U.combatOptions = function () {
    const s = ui.s, c = s.combat, d = Engine.derived(s.p);
    return [
      { label: 'Attack', fn: () => U.strike({ type: 'attack', target: ui.target }), desc: `Strike for ${d.dmgMin}-${d.dmgMax}. Stop the strike bar in the gold zone for a perfect hit.` },
      { label: 'Skills >', fn: () => (ui.cmenu = 'skills'), desc: 'Sword skills. They cost stamina and use the strike bar too.' },
      { label: 'Spells >', fn: () => (ui.cmenu = 'spells'), desc: 'Spells. They cost spirit, ignore half of defense, and hit weaknesses hard.' },
      { label: 'Items >', fn: () => (ui.cmenu = 'items'), desc: 'Use an item. Takes your turn.' },
      { label: 'Defend', fn: () => U.doCombat({ type: 'defend' }), desc: 'Halve damage. Against a heavy move ({o}!!{/}{d}) take only 20% and riposte!' },
      { label: 'Flee', fn: () => U.doCombat({ type: 'flee' }), off: c.boss, desc: c.boss ? 'There is no escape from this fight.' : 'Try to escape. Strength improves your odds.' },
    ];
  };

  U.combatList = function () {
    const s = ui.s;
    if (ui.cmenu === 'items') {
      return Engine.inventory(s).map((it) => ({
        name: `${it.name} x${it.count}`, cost: '', ok: true, desc: it.desc, el: null,
        fn: () => U.doCombat({ type: 'use', id: it.id }),
      }));
    }
    return Engine.abilities(s)[ui.cmenu].map((a) => ({
      name: a.name, cost: a.locked ? `Lv ${a.lvl}` : `${a.cost} ${a.res === 'st' ? 'ST' : 'SP'}`, el: a.el,
      ok: a.can, locked: a.locked, desc: a.desc,
      fn: () => (ui.cmenu === 'skills'
        ? U.strike({ type: 'skill', id: a.id, target: ui.target })
        : U.doCombat({ type: 'spell', id: a.id, target: ui.target })),
    }));
  };

  function targetInfo() {
    const s = ui.s, t = s.combat.enemies[ui.target];
    if (!t || t.hp <= 0) return '';
    const j = (s.p.journal || {})[t.key] || { el: {} }, def = D.enemies[t.key];
    const weak = Object.keys(j.el).filter((k) => j.el[k] === 'weak').map((k) => `{${D.elements[k].color}}${D.elements[k].name.toLowerCase()}{/}`);
    const res = Object.keys(j.el).filter((k) => j.el[k] === 'resist').map((k) => D.elements[k].name.toLowerCase());
    return `{d}Target:{/} ${t.name} {d}Lv ${def.lvl || 1}${j.kills ? ` - ATK ${t.atk} DEF ${t.def}` : ''}{/}` +
      (weak.length ? `  {d}weak:{/} ${weak.join(', ')}` : '') + (res.length ? `  {d}resists: ${res.join(', ')}{/}` : '') +
      (!weak.length && !res.length ? '  {d}weakness unknown{/}' : '');
  }

  function drawMenu() {
    const s = ui.s, p = s.p, d = Engine.derived(p), Y = MENU, X = V.x + 1, TW = V.w - 2;
    if (ui.cmenu === 'main') {
      let desc = null;
      U.text(X, Y, 'What will you do?', U.FG);
      U.combatOptions().forEach((o, k) => {
        const key = 'cm:' + k;
        U.button(X + (k % 3) * 21, Y + 2 + Math.floor(k / 3), `{y}[${k + 1}]{/} ${o.off ? '{d}' + o.label + '{/}' : o.label}`, key, o.fn, { w: 19 });
        if (U.hovered(key)) desc = o.desc;
      });
      const info = desc ? `{d}${desc}{/}` : targetInfo();
      U.wrap(info, TW, U.FG).slice(0, 2).forEach((ln, k) => U.drawLine(X, Y + 5 + k, ln));
      return;
    }
    const title = {
      skills: `{o}Skills{/}  {d}stamina ${p.st}/${d.maxSt}{/}`,
      spells: `{b}Spells{/}  {d}spirit ${p.sp}/${d.maxSp}{/}`,
      items: '{g}Items{/}',
    }[ui.cmenu];
    U.mtext(X, Y, title);
    U.button(X + TW - 10, Y, '{y}[0]{/} Back', 'cm:back', () => (ui.cmenu = 'main'));
    const list = U.combatList();
    if (!list.length) U.text(X + 2, Y + 1, 'Nothing to use.', U.DIM);
    list.slice(0, 7).forEach((e, k) => {
      const costCol = e.locked ? '{d}' : e.ok ? '{y}' : '{r}';
      const el = e.el ? `{${D.elements[e.el].color}}${D.elements[e.el].name.slice(0, 5).padEnd(6)}{/}` : '      ';
      const name = e.ok ? U.pad(e.name, 16) : `{d}${U.pad(e.name, 16)}{/}`;
      const label = `{y}[${k + 1}]{/} ${name} ${costCol}${U.pad(e.cost, 6)}{/} ${el}{d}${e.desc}{/}`;
      U.button(X, Y + 1 + k, label, 'cl:' + k, e.fn, { w: TW, max: TW });
    });
  }
})();
