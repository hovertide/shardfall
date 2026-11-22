'use strict';
/* SHARDFALL ui - scenes/shrine.js : the Shrine of Echoes (cosmetic pulls). */
(function () {
  const U = SF.UI, ui = U.ui, D = SF.data, R = D.rules;

  U.chipLabel = function (c) {
    const rc = D.rarity[c.r].color;
    if (c.type === 'glyph') return `{${rc}}${c.val} ${c.name}{/}`;
    if (c.type === 'color') return `{${c.val}}■{/} {${rc}}${c.name}{/}`;
    if (c.type === 'frame') {
      const F = U.FRAMES[c.val.style] || U.FRAMES.single;
      return `{${c.val.color}}${F[0]}${F[4]}${F[1]}{/} {${rc}}${c.name}{/}`;
    }
    return `{${rc}}${c.name}{/}`;
  };

  U.drawShrine = function (now) {
    const s = ui.s, M = U.L.MAP, x = M.x + 3, y = M.y + 2, w = M.w - 6, h = M.h - 4, p = s.p;
    U.box(x, y, w, h, '{m}Shrine of Echoes{/}', { bg: U.MODAL_BG });
    U.drawSprite('shrine', x + 9, y + 8, { color: '#d08bff' });
    U.mtext(x + 19, y + 2, `Spirit shards: {m}${p.shards}{/}`);
    U.mtext(x + 19, y + 3, `{d}Epic+ within ${D.pity.epic - p.pity.e} - Legendary within ${D.pity.legendary - p.pity.l}{/}`);
    U.button(x + 19, y + 5, `{y}[1]{/} Echo x1  {d}${R.pullCost} shards{/}`, 'sh:1', () => U.doAction({ type: 'pull', n: 1 }));
    U.button(x + 19, y + 6, `{y}[2]{/} Echo x10 {d}${R.pullCost * 10} shards{/}`, 'sh:10', () => U.doAction({ type: 'pull', n: 10 }));
    U.button(x + 19, y + 7, '{y}[O]{/} Outfits', 'sh:out', () => U.openOverlay('outfit'));
    const total = D.rarity.reduce((t, r) => t + r.weight, 0);
    U.mcenter(x + w / 2, y + 9, D.rarity.map((r) => `{${r.color}}${r.name} ${Math.round((r.weight / total) * 100)}%{/}`).join('  '));
    for (let k = 2; k < w - 2; k++) U.put(x + k, y + 10, '─', '#2c2c38');

    if (ui.pull) {
      const shown = Math.min(ui.pull.results.length, Math.floor((now - ui.pull.t0) / 140) + 1);
      U.text(x + 3, y + 11, 'The echoes take shape:', U.DIM);
      ui.pull.results.slice(0, shown).forEach((res, k) => {
        const tag = res.dupe ? `{d}+${res.refund}{/}` : '{g}NEW{/}';
        U.mtext(x + 3 + (k < 5 ? 0 : 27), y + 12 + (k % 5), `${U.chipLabel(Engine.data.cosmetics[res.id])} ${tag}`, U.FG, null, null, 26);
      });
    } else {
      for (const [k, ln] of U.wrap('{d}"The shards are memories, child. Echoes of lives that might have been." - the Old Hermit{/}', w - 6).entries()) {
        U.drawLine(x + 3, y + 12 + k, ln);
      }
    }
    U.button(x + w - 14, y + h - 2, '{y}[Esc]{/} Leave', 'sh:leave', () => U.doAction({ type: 'leave' }));
  };
})();
