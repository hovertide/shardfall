'use strict';
/* SHARDFALL ui - overlays/inventory.js   [I] */
(function () {
  const U = SF.UI, ui = U.ui, D = SF.data;

  U.closeBtn = function (x, y, w, h) {
    U.button(x + w - 14, y + h - 2, '{y}[Esc]{/} Close', 'ov:close', () => (ui.overlay = null));
  };

  U.drawInv = function () {
    const s = ui.s, x = 2, y = 1, w = 58, h = 20, p = s.p;
    U.box(x, y, w, h, 'Inventory', { bg: U.MODAL_BG });
    let yy = y + 2;
    U.text(x + 3, yy++, 'Weapons', U.C.c);
    for (const id of p.weapons) {
      const wd = D.weapons[id], on = p.weapon === id;
      U.button(x + 3, yy++, `${on ? '{y}>{/}' : ' '} ${U.pad(wd.name, 14)} {d}${wd.desc}{/}`, 'inv:w:' + id,
        () => U.doAction({ type: 'equip', id }), { w: w - 6, max: w - 6, bg: on ? U.SEL_BG : null });
    }
    yy++;
    U.text(x + 3, yy++, 'Items', U.C.c);
    const inv = Engine.inventory(s);
    if (!inv.length) U.text(x + 5, yy++, 'Your pack is empty.', U.DIM);
    inv.forEach((it, k) => U.button(x + 3, yy++, `{y}[${k + 1}]{/} ${U.pad(it.name, 15)} {d}x${it.count}  ${it.desc}{/}`, 'inv:i:' + it.id,
      () => U.doAction({ type: 'use', id: it.id }), { w: w - 6, max: w - 6 }));
    U.mtext(x + 3, y + h - 2, '{d}Click a weapon to equip it, an item to use it{/}');
    U.closeBtn(x, y, w, h);
  };
})();
