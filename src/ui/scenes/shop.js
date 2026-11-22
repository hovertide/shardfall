'use strict';
/* SHARDFALL ui - scenes/shop.js : buy / sell window for any shop. */
(function () {
  const U = SF.UI, ui = U.ui, D = SF.data;

  U.shopEntries = function () {
    const s = ui.s;
    if (ui.shopTab === 'buy') {
      return Engine.shopList(s).map((it, k) => {
        const owned = it.kind === 'weapon' && it.owned;
        const price = owned ? '{d}owned{/}' : `${it.can ? '{y}' : '{r}'}${it.price}g{/}`;
        const extra = it.kind === 'weapon' ? (owned ? '' : '{o}weapon{/}') : `{d}have ${it.owned}{/}`;
        return { label: `{y}[${k + 1}]{/} ${U.pad(it.name, 16)} ${price}  ${extra}`, desc: it.desc, fn: () => U.doAction({ type: 'buy', id: it.id }) };
      });
    }
    return Engine.inventory(s).map((it, k) => ({
      label: `{y}[${k + 1}]{/} ${U.pad(it.name, 16)} {d}x${it.count}{/}  sell for {y}${Engine.sellPrice(it.id)}g{/}`,
      desc: it.desc, fn: () => U.doAction({ type: 'sell', id: it.id }),
    }));
  };

  U.drawShop = function () {
    const s = ui.s, M = U.L.MAP, x = M.x + 2, y = M.y + 1, w = M.w - 4, h = M.h - 2, p = s.p, sh = D.shops[s.shop];
    U.box(x, y, w, h, `{y}${sh ? sh.name : 'Shop'}{/}`, { bg: U.MODAL_BG });
    U.button(x + 2, y + 1, ui.shopTab === 'buy' ? '{y}[ BUY ]{/}' : '{d}[ buy ]{/}', 'shop:tbuy', () => (ui.shopTab = 'buy'));
    U.button(x + 11, y + 1, ui.shopTab === 'sell' ? '{y}[ SELL ]{/}' : '{d}[ sell ]{/}', 'shop:tsell', () => (ui.shopTab = 'sell'));
    const g = `{y}Gold ${p.gold}{/}`;
    U.mtext(x + w - 3 - U.plainLen(g), y + 1, g);
    for (let k = 2; k < w - 2; k++) U.put(x + k, y + 2, '─', '#2c2c38');
    const list = U.shopEntries();
    if (!list.length) U.text(x + 3, y + 4, 'You have nothing to sell.', U.DIM);
    list.slice(0, 9).forEach((e, k) => {
      const yy = y + 3 + k * 2, key = 'shop:' + k;
      U.button(x + 2, yy, e.label, key, e.fn, { w: w - 4 });
      U.area(x + 2, yy + 1, w - 4, 1, U.regions.length - 1);   // description line is clickable too
      if (U.hovered(key)) U.fillBg(x + 2, yy + 1, w - 4, 1, U.HOVER_BG);
      const dw = w - 9;
      if (U.plainLen(e.desc) <= dw) U.mtext(x + 6, yy + 1, `{d}${e.desc}{/}`, U.FG, null, null, dw);
      else U.wrap(`{d}${e.desc}{/}`, dw * 2).slice(0, 2).forEach((ln, i) => U.drawSmallLine(x + 6, yy + 1 + i / 2, ln));  // long text: two tiny lines
    });
    U.button(x + w - 14, y + h - 1, '{y}[Esc]{/} Leave', 'shop:leave', () => U.doAction({ type: 'leave' }));
  };
})();
