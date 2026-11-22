'use strict';
/* =====================================================================
   SHARDFALL engine - items.js
   Consumables, weapons, and shops (any number of shops, each defined in
   content/shops and opened by an NPC with `shop: 'id'`).
   ===================================================================== */
(function () {
  const E = SF.E, D = E.D;
  const RES_NAME = { hp: 'health', st: 'stamina', sp: 'spirit', san: 'sanity' };

  E.itemBlocked = function (s, it) {
    const p = s.p, d = E.derived(p);
    if (it.stat === 'flee') {
      if (s.scene !== 'combat') return `${it.name} only works in combat.`;
      return s.combat.boss ? 'There is no escape from this fight!' : null;
    }
    if (it.stat === 'cure') return p.poison ? null : "You aren't poisoned.";
    const max = { hp: d.maxHp, st: d.maxSt, sp: d.maxSp, san: d.maxSan }[it.stat];
    return p[it.stat] >= max ? `Your ${RES_NAME[it.stat]} is already full.` : null;
  };

  E.applyItem = function (s, id) {
    const it = D.items[id], p = s.p, d = E.derived(p);
    if (--p.inv[id] <= 0) delete p.inv[id];
    if (it.stat === 'flee') return E.endFlee(s, 'You hurl a smoke bomb and vanish in the haze!');
    if (it.stat === 'cure') {
      p.poison = null;
      E.log(s, `You drink the ${it.name}. {g}The poison is gone.{/}`);
      E.fx({ t: 'heal', stat: 'cure' });
      return;
    }
    const max = { hp: d.maxHp, st: d.maxSt, sp: d.maxSp, san: d.maxSan }[it.stat];
    const amt = it.amt + (it.stat === 'hp' ? 2 * p.stats.vit : 0);
    const before = p[it.stat];
    p[it.stat] = Math.min(max, p[it.stat] + amt);
    E.log(s, `You use a ${it.name}: {g}+${p[it.stat] - before} ${RES_NAME[it.stat]}{/}.`);
    E.fx({ t: 'heal', stat: it.stat });
  };

  E.useItem = function (s, a) {
    if (s.scene === 'combat') return E.combatTurn(s, { type: 'use', id: a.id });
    const it = D.items[a.id];
    if (!it || !(s.p.inv[a.id] > 0)) return E.fail("You don't have that.");
    const why = E.itemBlocked(s, it);
    if (why) return E.fail(why);
    E.applyItem(s, a.id);
    return true;
  };

  // Add a weapon you found or bought; equip it if it hits harder.
  E.gainWeapon = function (s, id) {
    const p = s.p, w = D.weapons[id];
    if (p.weapons.includes(id)) return false;
    p.weapons.push(id);
    const cur = D.weapons[p.weapon];
    if (w.min + w.max > cur.min + cur.max) {
      p.weapon = id;
      E.log(s, `You equip the {w}${w.name}{/}. {d}${w.desc}{/}`);
    }
    return true;
  };

  E.equip = function (s, a) {
    const p = s.p, w = D.weapons[a.id];
    if (!w || !p.weapons.includes(a.id)) return E.fail("You don't own that weapon.");
    if (p.weapon === a.id) return E.fail(`${w.name} is already equipped.`);
    p.weapon = a.id;
    E.log(s, `You equip the {w}${w.name}{/}.`);
    return true;
  };

  /* ---------- Shops ---------- */
  E.openShop = function (s, id) {
    const sh = D.shops[id];
    if (!sh) return E.fail('The shop is closed.');
    s.shop = id;
    s.scene = 'shop';
    E.log(s, sh.greet);
    return true;
  };

  const priceOf = (id) => (D.weapons[id] || D.items[id]).price;
  E.sellPrice = (id) => Math.max(1, Math.floor(D.items[id].price / 2));

  E.buy = function (s, a) {
    const p = s.p, id = a.id, sh = D.shops[s.shop];
    if (!sh || !sh.stock.includes(id)) return E.fail('Not for sale.');
    const w = D.weapons[id], it = D.items[id], price = priceOf(id);
    if (w && p.weapons.includes(id)) return E.fail(`You already own the ${w.name}.`);
    if (p.gold < price) return E.fail(`You need ${price - p.gold} more gold.`);
    p.gold -= price;
    if (w) {
      E.log(s, `Bought the {w}${w.name}{/} for ${price} gold.`);
      E.gainWeapon(s, id);
    } else {
      p.inv[id] = (p.inv[id] || 0) + 1;
      E.log(s, `Bought ${it.name} for ${price} gold.`);
    }
    E.fx({ t: 'buy' });
    return true;
  };

  E.sell = function (s, a) {
    const p = s.p, it = D.items[a.id];
    if (!it || !(p.inv[a.id] > 0)) return E.fail("You don't have that.");
    const price = E.sellPrice(a.id);
    if (--p.inv[a.id] <= 0) delete p.inv[a.id];
    p.gold += price;
    E.log(s, `Sold ${it.name} for {y}${price} gold{/}.`);
    return true;
  };

  E.inventory = (s) => Object.keys(D.items).filter((id) => s.p.inv[id] > 0)
    .map((id) => Object.assign({ id, count: s.p.inv[id] }, D.items[id]));

  E.shopList = function (s) {
    const p = s.p, sh = D.shops[s.shop];
    if (!sh) return [];
    return sh.stock.map((id) => {
      const w = D.weapons[id], x = w || D.items[id];
      const owned = w ? p.weapons.includes(id) : p.inv[id] || 0;
      return { id, kind: w ? 'weapon' : 'item', name: x.name, price: x.price, desc: x.desc,
        owned, can: p.gold >= x.price && !(w && owned) };
    });
  };
})();
