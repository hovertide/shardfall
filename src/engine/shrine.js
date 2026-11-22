'use strict';
/* =====================================================================
   SHARDFALL engine - shrine.js
   The Shrine of Echoes: spend spirit shards on cosmetic "echoes"
   (glyphs, colors, titles, frames). Pity timers guarantee Epic and
   Legendary pulls; duplicates refund shards. Cosmetics never affect stats.
   ===================================================================== */
(function () {
  const E = SF.E, D = E.D, R = E.R;
  const COS = {};
  for (const c of Object.values(D.cosmetics)) COS[c.id] = c;
  const POOLS = D.rarity.map((_, r) => Object.values(D.cosmetics).filter((c) => c.r === r && !c.def));
  E.COS = COS;

  function rollRarity(s, min) {
    return E.pickWeighted(s, D.rarity.map((r, i) => [i, i >= min ? r.weight : 0]).filter(([, w]) => w > 0));
  }
  const cosName = (id) => `{${D.rarity[COS[id].r].color}}${COS[id].name}{/} {d}(${COS[id].type}){/}`;

  E.pull = function (s, a) {
    const p = s.p, n = a.n === 10 ? 10 : 1, cost = R.pullCost * n;
    if (p.shards < cost) return E.fail(`You need ${cost} spirit shards (you have ${p.shards}).`);
    p.shards -= cost;
    const results = [];
    for (let i = 0; i < n; i++) {
      p.pity.e++; p.pity.l++; p.pulls++;
      let r = p.pity.l >= D.pity.legendary ? 3 : rollRarity(s, p.pity.e >= D.pity.epic ? 2 : 0);
      while (r > 0 && !POOLS[r].length) r--;
      if (r >= 2) p.pity.e = 0;
      if (r === 3) p.pity.l = 0;
      const c = E.pickOne(s, POOLS[r]);
      const dupe = p.cos.includes(c.id), refund = dupe ? D.pity.dupeRefund[r] : 0;
      if (dupe) p.shards += refund;
      else p.cos.push(c.id);
      results.push({ id: c.id, r, dupe, refund });
    }
    const fresh = results.filter((x) => !x.dupe).map((x) => cosName(x.id));
    const refunded = results.reduce((t, x) => t + x.refund, 0);
    E.log(s, `{m}The shrine answers with ${n} echo${n > 1 ? 'es' : ''}.{/}` +
      (fresh.length ? ` New: ${fresh.join(', ')}.` : ' Nothing new.') +
      (refunded ? ` {d}Duplicates refunded ${refunded} shards.{/}` : ''));
    E.fx({ t: 'pull', results });
    return true;
  };

  E.wearCosmetic = function (s, a) {
    const p = s.p, c = COS[a.id];
    if (!c || !p.cos.includes(a.id)) return E.fail("You don't own that.");
    p.look[c.type] = a.id;
    E.log(s, `{d}Now using ${c.type}: ${c.name}.{/}`);
    return true;
  };

  E.look = function (p) {
    const L = p.look, g = COS[L.glyph], c = COS[L.color], t = COS[L.title], f = COS[L.frame];
    return {
      glyph: g ? g.val : '@',
      color: c ? c.val : '#f0f0f0',
      title: t ? t.name : '',
      frame: f ? f.val : { style: 'single', color: '#4a4a60' },
    };
  };
})();
