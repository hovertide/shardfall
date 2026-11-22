'use strict';
/* =====================================================================
   SHARDFALL ui - overlays/inventory.js   [I]
   A Minecraft-style inventory:
     - 32 backpack slots (the top row is the hotbar: keys 1-8 while exploring)
     - click a slot to pick its item up, click another slot to put it
       there (swapping if it's taken); click the background to put it back
     - right-click: use an item / equip a weapon right away
     - drop a weapon on the EQUIPPED slot to wield it
     - hover for a tooltip; keyboard: arrows, Space = pick up / place,
       Enter = use / equip, Esc = put back / close
   Slot drawing is shared with the Pack panel (scenes/pack.js).
   ===================================================================== */
(function () {
  const U = SF.UI, ui = U.ui, D = SF.data;
  const X = 0, Y = 0, W = 128, H = 41;
  const COLS = 8, ROWS = 4, SW = 9, SH = 5, GX = 50, GY = 5;          // backpack grid
  const EQ = { x: 9, y: 5, w: 36, h: 8 };                               // equipped weapon slot

  const slotXY = (k) => [GX + (k % COLS) * SW, GY + Math.floor(k / COLS) * SH];
  const heldInfo = (bag) => (ui.held != null ? bag[ui.held] : null);

  // Click on a backpack slot.
  function clickSlot(k) {
    const bag = Engine.bag(ui.s);
    ui.invSel = k;
    if (ui.held != null) {
      if (ui.held !== k) U.doAction({ type: 'arrange', from: ui.held, to: k });
      ui.held = null;
    } else if (bag[k]) ui.held = k;
  }
  // Click on the equipped slot (with a weapon in hand = equip it).
  function clickEquip() {
    const bag = Engine.bag(ui.s), h = heldInfo(bag);
    ui.invSel = -1;
    if (!h) return;
    if (h.kind === 'weapon') U.doAction({ type: 'equip', id: h.id });
    else Engine.note(ui.s, `{d}The ${h.name} is not a weapon.{/}`);
    ui.held = null;
  }
  function quick(k) {               // right-click / Enter
    const info = Engine.bag(ui.s)[k];
    ui.held = null;
    if (info) U.itemAction(info);
  }

  U.invClose = function () { ui.held = null; ui.overlay = null; };

  U.invKey = function (k) {
    const n = Engine.BAG_SIZE;
    let sel = ui.invSel == null ? 0 : ui.invSel;
    if (k === 'Escape' || k === 'i') {
      if (ui.held != null) ui.held = null; else U.invClose();
      return true;
    }
    if (k === 'ArrowLeft' || k === 'a') sel = sel === -1 ? -1 : sel % COLS === 0 ? -1 : sel - 1;
    else if (k === 'ArrowRight' || k === 'd') sel = sel === -1 ? 0 : sel % COLS === COLS - 1 ? sel : sel + 1;
    else if (k === 'ArrowUp' || k === 'w') sel = sel === -1 ? -1 : sel - COLS >= 0 ? sel - COLS : sel;
    else if (k === 'ArrowDown' || k === 's') sel = sel === -1 ? -1 : sel + COLS < n ? sel + COLS : sel;
    else if (k === ' ') { if (sel === -1) clickEquip(); else clickSlot(sel); return true; }
    else if (k === 'Enter') { if (sel >= 0) quick(sel); return true; }
    else return false;
    ui.invSel = sel;
    return true;
  };

  U.drawInv = function (now) {
    const s = ui.s, p = s.p, bag = Engine.bag(s), w = D.weapons[p.weapon], d = Engine.derived(p);
    U.box(X, Y, W, H, '{y}Inventory{/}', { bg: U.MODAL_BG });
    U.area(X + 1, Y + 1, W - 2, H - 2, U.region('inv:bg', () => { ui.held = null; }));
    if (ui.invSel == null) ui.invSel = 0;

    // ---- equipped weapon ----
    U.text(EQ.x, Y + 2, 'Equipped', U.C.c);
    const eqHot = U.hovered('inv:weapon'), eqSel = ui.invSel === -1, h = heldInfo(bag);
    const eqCol = h && h.kind === 'weapon' && eqHot ? '#ffd866' : eqSel ? '#ffd866' : eqHot ? '#8a8aa8' : '#34344a';
    U.box(EQ.x, EQ.y, EQ.w, EQ.h, null, { color: eqCol, style: 'single' });
    U.fillBg(EQ.x + 1, EQ.y + 1, EQ.w - 2, EQ.h - 2, eqHot ? '#1a1a28' : '#101018');
    const re = U.region('inv:weapon', clickEquip);
    U.area(EQ.x, EQ.y, EQ.w, EQ.h, re);
    U.drawSprite(w.sprite || p.weapon, EQ.x + Math.floor(EQ.w / 2), EQ.y + EQ.h - 3, { clip: { x0: EQ.x + 1, y0: EQ.y + 1, x1: EQ.x + EQ.w - 2, y1: EQ.y + EQ.h - 2 } });
    U.center(EQ.x + EQ.w / 2, EQ.y + EQ.h - 2, w.name, U.C.w);
    U.small(EQ.x + 1, EQ.y, 'weapon', eqCol);

    // ---- you ----
    let y = EQ.y + EQ.h + 1;
    U.mtext(EQ.x, y++, `${p.name} {d}· level ${p.lvl}{/}`, Engine.look(p).color);
    for (const [lab, v, m, c] of [['HP', p.hp, d.maxHp, U.hpColor(p.hp / d.maxHp)], ['ST', p.st, d.maxSt, '#7ddc6f'], ['SP', p.sp, d.maxSp, '#5ca8ff'], ['SAN', p.san, d.maxSan, '#c792ea']]) {
      U.text(EQ.x, y, lab, U.DIM); U.bar(EQ.x + 4, y, 20, v, m, c); U.small(EQ.x + 25, y + 0.5, `${v}/${m}`, U.DIM); y++;
    }
    U.mtext(EQ.x, y++, `{y}◉ Gold{/} ${p.gold}   {m}◇ Shards{/} ${p.shards}`);
    U.mtext(EQ.x, y++, `{d}Dmg{/} ${d.dmgMin}-${d.dmgMax}   {d}Crit{/} ${U.pct(d.crit)}`);

    // ---- backpack ----
    U.text(GX, Y + 2, 'Backpack', U.C.c);
    U.small(GX + 10, Y + 2.5, `top row = hotbar (keys 1-8)  ·  ${bag.filter((b) => !b).length} free slots`, U.DIM);
    let hot = -2;
    for (let k = 0; k < Engine.BAG_SIZE; k++) {
      const [sx, sy] = slotXY(k), key = 'inv:slot:' + k;
      const r = U.region(key, () => clickSlot(k), () => quick(k));
      if (U.hovered(key)) hot = k;
      U.drawSlot(sx, sy, SW, SH, bag[k], {
        hot: U.hovered(key), sel: ui.invSel === k, held: ui.held === k, label: true,
        key: k < COLS ? String(k + 1) : null, region: r,
      });
    }
    U.text(GX - 2, GY + 2, '▸', '#6a6a80');   // marks the hotbar row

    // ---- details (cursor or hovered) ----
    const focus = hot >= 0 ? bag[hot] : ui.invSel >= 0 ? bag[ui.invSel] : null;
    const DX = EQ.x, DY = 26;
    U.rule(DX, DY - 1, X + W - 3 - DX, 'Details');
    if (focus) {
      const col = focus.kind === 'weapon' ? '#ffb347' : '#9fd8a0';
      U.drawSprite(focus.icon, DX + 2, DY + 2);
      U.mtext(DX + 6, DY, `{${col}}${focus.name}{/}${focus.count > 1 ? `  {d}×${focus.count}{/}` : ''}  {d}${focus.kind === 'weapon' ? 'weapon' : 'consumable'}{/}`);
      U.wrap(focus.desc, 70, U.DIM).slice(0, 2).forEach((ln, k) => U.drawLine(DX + 6, DY + 1 + k, ln));
      if (focus.kind === 'weapon') {
        const fw = focus.def, T = fw.timing || {};
        U.small(DX + 6, DY + 3, `damage ${fw.min}-${fw.max} (+${d.dmgMin - w.min} from you)  ·  crit +${fw.crit || 0}%  ·  ${T.sweep < 750 ? 'fast' : T.sweep > 1000 ? 'slow' : 'steady'} swing${fw.el && fw.el !== 'phys' ? '  ·  ' + D.elements[fw.el].name.toLowerCase() : ''}`, '#a8a8b8');
        U.drawSprite(fw.sprite || focus.id, DX + 92, DY + 5, { clip: { x0: DX + 76, y0: DY, x1: X + W - 2, y1: DY + 6 } });
      }
      const k = hot >= 0 ? hot : ui.invSel;
      const verb = focus.kind === 'weapon' ? 'Equip' : 'Use';
      U.button(DX + 6, DY + 5, `{y}[Enter]{/} ${verb}`, 'inv:do', () => quick(k));
    } else U.mtext(DX, DY, '{d}Hover or select a slot to see what it is.{/}');
    U.small(DX, Y + H - 2.5, 'click: pick up / put down  ·  right-click: use or equip  ·  drop a weapon on EQUIPPED to wield it  ·  arrows + Space / Enter  ·  [Esc] close', '#6a6a80');

    // ---- the item in your hand follows the mouse; tooltip otherwise ----
    const hc = ui.hcell;
    if (h && hc) {
      U.drawSprite(h.icon, hc.x + 1, hc.y + 1);
      if (h.count > 1) U.small(hc.x + 2.5, hc.y + 1.5, String(h.count), '#ffffff');
    } else if (hot >= 0 && bag[hot] && hc) U.tooltip(hc.x + 2, hc.y + 1, bag[hot]);
  };

  // A small floating tooltip, Minecraft style.
  U.tooltip = function (x, y, info) {
    const col = info.kind === 'weapon' ? '#ffb347' : '#9fd8a0';
    const lines = U.wrap(info.desc, 44, '#b8b8c8');
    const w = Math.max([...info.name].length + 4, 24), h = 3 + Math.ceil(lines.length / 2);
    if (x + w > U.COLS - 1) x = U.COLS - 1 - w;
    if (y + h > U.ROWS - 1) y = U.ROWS - 1 - h;
    U.box(x, y, w, h, null, { bg: '#14081e', color: '#5a2a8a', style: 'rounded' });
    U.text(x + 2, y + 1, info.name, col);
    lines.forEach((ln, k) => U.drawSmallLine(x + 2, y + 2 + k / 2, ln));
  };
})();
