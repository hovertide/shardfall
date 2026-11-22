'use strict';
/* =====================================================================
   SHARDFALL ui - scenes/timing.js
   The strike bar. A marker sweeps back and forth; stop it in the gold
   zone for a PERFECT strike (+35% damage, +25% crit), the green zone for
   a normal hit, anywhere else for a weak one. Each weapon has its own
   speed and zone sizes (content/weapons, `timing`). It can be turned off
   in Menu > Settings.
   ===================================================================== */
(function () {
  const U = SF.UI, ui = U.ui, D = SF.data;
  const BX = 6, BW = 50;

  function pos(T, now) {
    const ph = (now - T.t0) / T.sweep, m = ph % 2;
    return m < 1 ? m : 2 - m;
  }

  U.resolveTiming = function () {
    const T = ui.timing;
    if (!T || T.done) return;
    const now = performance.now(), p = pos(T, now), dist = Math.abs(p - T.center);
    const q = dist <= T.perfect / 2 ? 'perfect' : dist <= T.good / 2 ? 'good' : 'weak';
    T.done = { q, p, at: now };
    U.render();
    setTimeout(() => {
      if (ui.timing !== T) return;
      ui.timing = null;
      U.doCombat(Object.assign({}, T.a, { q }));
    }, 170);
  };
  U.cancelTiming = function () { ui.timing = null; };

  U.drawTiming = function (now) {
    const T = ui.timing, w = D.weapons[ui.s.p.weapon];
    if (!T.done && now - T.t0 > T.sweep * 2.6) U.resolveTiming();   // too slow: it swings anyway
    const p = T.done ? T.done.p : pos(T, now);
    const what = T.a.type === 'skill' ? D.skills[T.a.id].name : 'Strike';
    U.mtext(2, 15, `{y}${what}!{/}  {d}stop the marker in the {/}{#ffd040}gold{/}{d} zone{/}`);
    U.button(48, 15, '{y}[Esc]{/} Cancel', 'tm:cancel', U.cancelTiming);
    const r = U.region('tm:hit', U.resolveTiming);
    U.area(BX - 1, 16, BW + 2, 3, r);
    U.put(BX - 1, 17, '[', U.DIM); U.put(BX + BW, 17, ']', U.DIM);
    for (let k = 0; k < BW; k++) {
      const f = (k + 0.5) / BW, d = Math.abs(f - T.center);
      const zone = d <= T.perfect / 2 ? 2 : d <= T.good / 2 ? 1 : 0;
      U.put(BX + k, 17, zone === 2 ? '#' : zone === 1 ? '=' : '-', zone === 2 ? '#ffd040' : zone === 1 ? '#5fb85f' : '#3a3a4a', null, r);
    }
    const mx = BX + Math.min(BW - 1, Math.floor(p * BW));
    const mcol = T.done ? (T.done.q === 'perfect' ? '#ffd040' : T.done.q === 'good' ? '#6bdc6b' : '#ff6b6b') : '#ffffff';
    U.put(mx, 16, 'v', mcol); U.put(mx, 18, '^', mcol); U.put(mx, 17, '|', mcol, '#2c2c40');
    if (T.done) U.center(31, 19, T.done.q === 'perfect' ? '* PERFECT! *' : T.done.q === 'good' ? 'Good hit' : 'Clumsy...', mcol);
    else {
      const feel = w.timing && w.timing.sweep < 750 ? 'fast blade, wide sweet spot' : w.timing && w.timing.sweep > 1000 ? 'slow swing, narrow sweet spot' : 'steady swing';
      U.mtext(2, 20, `{d}${w.name}: ${feel}.  [Space] / [Enter] / click{/}`);
    }
  };
})();
