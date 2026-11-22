'use strict';
/* =====================================================================
   SHARDFALL engine - core.js
   Shared plumbing for every engine file: seeded RNG, the message log,
   and the per-action result object.

   Engine rules (all files in src/engine/):
     - no DOM, no timers, no Math.random()
     - all game state lives in one plain-JSON object `s`
     - same state + same action = same result (seeded RNG in s.rng)
   ===================================================================== */
(function () {
  const E = SF.E;
  E.D = SF.data;
  E.R = SF.data.rules;

  /* ---------- Seeded RNG (mulberry32). State lives in s.rng ---------- */
  E.rnd = function (s) {
    let t = (s.rng = (s.rng + 0x6D2B79F5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  E.roll = (s, a, b) => a + Math.floor(E.rnd(s) * (b - a + 1));
  E.chance = (s, p) => E.rnd(s) < p;
  E.vary = (s, lo, hi) => lo + E.rnd(s) * (hi - lo);
  E.pickOne = (s, arr) => arr[Math.floor(E.rnd(s) * arr.length)];
  E.pickWeighted = function (s, pairs) {
    let total = 0;
    for (const [, w] of pairs) total += w;
    let r = E.rnd(s) * total;
    for (const [k, w] of pairs) if ((r -= w) < 0) return k;
    return pairs[pairs.length - 1][0];
  };

  /* ---------- Log & action result ----------
     Log lines use color markup: {r} {g} {b} {c} {m} {y} {o} {w} {d}(dim),
     {#rrggbb} for any color, {/} closes. */
  E.OUT = null;   // result of the action being processed: { ok, msg, fx: [] }
  E.CUR = null;   // state of the action being processed

  E.log = function (s, text) {
    s.log.push(text);
    if (s.log.length > 150) s.log.splice(0, s.log.length - 150);
  };
  E.logOnce = function (s, text) { if (s.log[s.log.length - 1] !== text) E.log(s, text); };

  E.fail = function (msg) {
    if (E.OUT) { E.OUT.ok = false; E.OUT.msg = msg; }
    if (E.CUR && msg) E.logOnce(E.CUR, `{d}${msg}{/}`);
    return false;
  };

  // Animation hints for the UI. `n` = how many log lines existed when this
  // happened, so the UI can reveal the log in step with its animations.
  E.fx = function (e) {
    if (!E.OUT) return;
    e.n = E.CUR ? E.CUR.log.length : 0;
    E.OUT.fx.push(e);
  };

  E.listNames = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
  E.DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]];
})();
