'use strict';
/* =====================================================================
   SHARDFALL ui - scenes/pack.js
   Inventory slots, shared by the Pack panel (bottom right, always
   visible: the first 16 slots, a Minecraft-style hotbar) and the full
   inventory screen (overlays/inventory.js).

     U.drawSlot(x, y, w, h, info, opt)   one slot: frame, icon, tiny count/label
     U.itemAction(info)                  what clicking a slot does here (use / equip)
   ===================================================================== */
(function () {
  const U = SF.UI, ui = U.ui, D = SF.data;
  const B = U.L.PACK, SW = 6, SH = 4, PER_ROW = 8, SHOWN = 16;

  const kindColor = (info) => (info.kind === 'weapon' ? '#ffb347' : '#9fd8a0');

  // One slot. opt: hot (hovered), sel (keyboard cursor), held (being carried: drawn faded),
  //               key (tiny hotkey number), label (tiny name), region
  U.drawSlot = function (x, y, w, h, info, opt = {}) {
    const col = opt.sel ? '#ffd866' : opt.hot ? '#8a8aa8' : '#34344a', bg = opt.hot ? '#1a1a28' : '#101018';
    U.fillBg(x + 1, y + 1, w - 2, h - 2, bg);
    U.put(x, y, '┌', col); U.put(x + w - 1, y, '┐', col); U.put(x, y + h - 1, '└', col); U.put(x + w - 1, y + h - 1, '┘', col);
    for (let k = 1; k < w - 1; k++) { U.put(x + k, y, '─', col); U.put(x + k, y + h - 1, '─', col); }
    for (let k = 1; k < h - 1; k++) { U.put(x, y + k, '│', col); U.put(x + w - 1, y + k, '│', col); }
    if (opt.region != null) U.area(x, y, w, h, opt.region);
    if (opt.key) U.small(x + 1, y, opt.key, opt.sel || opt.hot ? col : '#6a6a80');   // tiny hotkey, set into the top border
    if (!info) return;
    const iconRows = opt.label ? h - 3 : h - 2;
    U.drawSprite(info.icon, x + Math.floor((w - 1) / 2), y + iconRows, { dim: opt.held, region: opt.region });
    if (info.count > 1) U.small(x + w - 1 - String(info.count).length / 2, y + h - 2 + 0.5, String(info.count), '#ffffff');
    if (opt.label) U.small(x + 1, y + h - 2, U.pad(info.name, (w - 2) * 2 - (info.count > 1 ? 3 : 0)), opt.held ? U.DIM : '#a8a8b8');
  };

  // Clicking an item outside the full inventory: use it, or equip a weapon.
  U.itemAction = function (info) {
    const s = ui.s;
    if (!info || U.anim.busy() || ui.timing) return;
    if (info.kind === 'weapon') {
      if (s.scene === 'combat') { Engine.note(s, '{d}You can\'t change weapons mid-fight.{/}'); return; }
      U.doAction({ type: 'equip', id: info.id });
    } else if (s.scene === 'combat') U.doCombat({ type: 'use', id: info.id });
    else U.doAction({ type: 'use', id: info.id });
  };

  U.drawPack = function () {
    const s = ui.s, bag = Engine.bag(s);
    U.box(B.x, B.y, B.w, B.h, 'Pack');
    U.button(B.x + B.w - 18, B.y, '{y}[I]{/} full inventory', 'pack:open', () => U.openOverlay('inv'));
    let hot = null;
    for (let k = 0; k < SHOWN; k++) {
      const sx = B.x + 1 + (k % PER_ROW) * SW, sy = B.y + 1 + Math.floor(k / PER_ROW) * SH, info = bag[k], key = 'pack:' + k;
      const r = U.region(key, () => U.itemAction(info), () => U.itemAction(info));
      if (U.hovered(key)) hot = info;
      U.drawSlot(sx, sy, SW, SH, info, { hot: U.hovered(key), key: k < PER_ROW ? String(k + 1) : null, region: r });
    }
    // details of the hovered slot
    const y0 = B.y + 1 + 2 * SH, x0 = B.x + 2, w = B.w - 4;
    if (hot) {
      U.mtext(x0, y0, `{${kindColor(hot)}}${hot.name}{/}${hot.count > 1 ? ` {d}×${hot.count}{/}` : ''}`);
      U.wrap(hot.desc, w * 2, U.DIM).slice(0, 4).forEach((ln, k) => U.drawSmallLine(x0, y0 + 1 + k / 2, ln));
      const verb = hot.kind === 'weapon' ? 'click: equip' : s.scene === 'combat' ? 'click: use (takes your turn)' : 'click: use';
      U.small(x0, y0 + 3.5, verb, '#8a8aa8');
    } else {
      const free = bag.filter((b) => !b).length;
      U.small(x0, y0 + 0.5, 'Hover a slot for details. Click to use or equip.', U.DIM);
      U.small(x0, y0 + 1.5, `[1-8] use the top row · [I] arrange everything · ${free} free slots`, U.DIM);
    }
  };
})();
