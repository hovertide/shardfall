'use strict';
/* SHARDFALL ui - overlays/outfits.js   [O]  wear cosmetics from the shrine. */
(function () {
  const U = SF.UI, ui = U.ui, D = SF.data;
  U.OUTFIT_TYPES = [['glyph', 'Glyph'], ['color', 'Color'], ['title', 'Title'], ['frame', 'Frame']];

  U.drawOutfit = function () {
    const s = ui.s, x = 2, y = 1, w = 58, h = 20, p = s.p, L = Engine.look(p);
    U.box(x, y, w, h, '{m}Outfits{/}', { bg: U.MODAL_BG });
    U.put(x + 3, y + 1, L.glyph, L.color);
    U.mtext(x + 5, y + 1, `${p.name} {d}${L.title}{/}`, L.color);
    let yy = y + 3;
    const all = Object.values(D.cosmetics);
    U.OUTFIT_TYPES.forEach(([type, label], row) => {
      const ofType = all.filter((c) => c.type === type), owned = ofType.filter((c) => p.cos.includes(c.id));
      U.mtext(x + 2, yy++, `${ui.outfitRow === row ? '{y}>{/}' : ' '} {c}${label}{/} {d}${owned.length}/${ofType.length}{/}`);
      let cx = x + 4;
      for (const c of owned) {
        const lab = U.chipLabel(c), len = U.plainLen(lab) + 2;
        if (cx + len > x + w - 2) { yy++; cx = x + 4; }
        const on = p.look[type] === c.id;
        U.button(cx, yy, ` ${lab} `, 'out:' + c.id, () => { ui.outfitRow = row; U.doAction({ type: 'cosmetic', id: c.id }); },
          { bg: on ? U.SEL_BG : null });
        cx += len + 1;
      }
      yy++;
    });
    U.mtext(x + 2, y + h - 2, '{d}Click to wear - Up/Down slot - Left/Right cycle{/}');
    U.closeBtn(x, y, w, h);
  };
})();
