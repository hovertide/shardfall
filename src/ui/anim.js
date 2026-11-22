'use strict';
/* =====================================================================
   SHARDFALL ui - anim.js
   The engine resolves a whole round instantly. This file replays it:
   the fx list from Engine.act becomes a timeline of steps (a slash, a
   fireball, an enemy lunge, a death...). While it plays, the screen shows
   "display" values (HP, log lines) that catch up step by step, so bars
   drop exactly when the hit lands. Any key or click skips to the end.

   Effects themselves are drawn by src/ui/fx/*.js:
     U.FX.strike[name]  your weapon attacks      U.FX.spell[name]  spells
     U.FX.enemy[name]   enemy moves
   Each is { dur, impact (0..1 = when damage lands), draw(t, ctx) }.
   ===================================================================== */
(function () {
  const U = SF.UI, D = SF.data;
  U.FX = { strike: {}, spell: {}, enemy: {} };

  const A = U.anim = {
    steps: [], i: 0, t0: 0, view: null,
    busy: () => !!A.view,
    reset() { A.steps = []; A.i = 0; A.view = null; },
  };
  const speed = () => (U.settings.fast ? 0.6 : 1);

  // Copy of what the screen showed before the action ran.
  A.snapshot = (s) => ({
    scene: s.scene,
    combat: s.combat ? JSON.parse(JSON.stringify(s.combat)) : null,
    php: s.p.hp,
    gold: s.p.gold,
  });

  // What the scenes should draw right now.
  A.php = (s) => (A.view ? A.view.php : s.p.hp);
  A.gold = (s) => (A.view && A.view.gold != null ? A.view.gold : s.p.gold);
  A.logN = (s) => (A.view ? A.view.logN : s.log.length);
  A.combat = (s) => (A.view && A.view.combat ? A.view.combat : s.combat);
  A.scene = (s) => (A.view && A.view.combat ? 'combat' : s.scene);
  A.ehp = (i, e) => (A.view && A.view.ehp[i] != null ? A.view.ehp[i] : e.hp);

  /* ---------- Build the timeline ---------- */
  A.play = function (fx, snap, logBefore) {
    const s = U.ui.s;
    if (A.view) A.skip();
    const startsCombat = fx.some((f) => f.t === 'start');
    const inCombat = snap.scene === 'combat' || startsCombat;
    const view = {
      combat: snap.combat || (startsCombat ? s.combat : null),
      php: snap.php, gold: inCombat ? snap.gold : null, ehp: [], logN: logBefore, dead: {}, gone: {}, lunge: {}, flash: {}, wlunge: 0, intro: null,
      trans: null, dim: 0,
    };
    if (view.combat) view.combat.enemies.forEach((e, i) => { view.ehp[i] = e.hp; if (e.hp <= 0) view.gone[i] = true; });
    const steps = [];
    const after = (k) => (k + 1 < fx.length ? fx[k + 1].n : s.log.length);
    const geoE = (i) => U.combatGeo(view.combat, i);
    const last = () => steps[steps.length - 1];
    const addImpact = (fn) => { const st = last(); if (st) st.hits.push(fn); else fn(); };

    // what happens when a hit on an enemy lands
    const hitE = (f) => () => {
      view.ehp[f.i] = f.hp;
      view.flash[f.i] = performance.now() + 140;
      const g = geoE(f.i);
      const col = f.crit ? U.C.y : f.em > 1 ? '#ffb347' : f.em < 1 ? '#8a8a96' : U.C.w;
      U.float(g.cx, g.top - 1, `-${f.dmg}${f.crit ? '!' : ''}`, col, 900);
      if (f.crit) U.ui.shake = performance.now() + 120;
    };
    const hitP = (f) => () => {
      view.php = f.hp;
      U.ui.pflash = performance.now() + 220;
      const tag = f.guard === 'perfect' ? ' GUARD!' : f.guard ? ' (guard)' : '';
      U.float(U.SIDE.hpX, U.SIDE.hpY, `-${f.dmg}${tag}`, f.guard === 'perfect' ? U.C.c : f.poison ? '#8fdc4f' : U.C.r, 900);
      if (!f.guard && !f.poison) U.ui.shake = performance.now() + 160;
    };

    let act = null;
    for (let k = 0; k < fx.length; k++) {
      const f = fx[k], logN = after(k);
      const setLog = () => { view.logN = Math.max(view.logN, logN); };
      if (!inCombat) { mapFx(f, steps, view, setLog); continue; }

      switch (f.t) {
        case 'start': {
          const boss = f.boss;
          steps.push(step(boss ? 1300 : 450, { logN, start() { view.intro = 0; }, pre(t) { view.intro = t; }, draw(t) { if (boss) bossBanner(f.key, t); },
            end() { view.intro = null; } }));
          break;
        }
        case 'act': {
          act = f;
          if (f.kind === 'spell') {
            const targets = (f.targets || []).filter((i) => i >= 0);
            const fxDef = U.FX.spell[f.anim] || U.FX.spell.bolt;
            const st = step(fxDef.dur, { logN, impact: fxDef.impact, draw(t) {
              fxDef.draw(t, { targets: targets.map(geoE), from: U.SIDE.anchor(), view });
            } });
            steps.push(st);
            // the spell's hits all land on its impact
            for (let j = k + 1; j < fx.length && ['ehit', 'freeze', 'burn'].includes(fx[j].t) && (fx[j].t !== 'ehit' || fx[j].kind === 'spell'); j++) {
              const g = fx[j];
              if (g.t === 'ehit') st.hits.push(hitE(g));
              else st.hits.push(statusFloat(g, geoE));
              st.logN = after(j);
              k = j;
            }
          } else if (f.kind === 'item' || f.kind === 'defend' || f.kind === 'terror' || f.kind === 'flee') {
            const fxDef = U.FX.strike[f.kind];
            steps.push(step(fxDef.dur, { logN, draw(t) { fxDef.draw(t, { from: U.SIDE.anchor(), view }); } }));
          } else if (f.kind === 'attack' || f.kind === 'skill') {
            U.ui.lastQ = f.q;
            U.ui.lastQt = performance.now() + 1400;
            if (f.anim === 'whirl') {
              const fxDef = U.FX.strike.whirl;
              const st = step(fxDef.dur, { logN, impact: fxDef.impact, draw(t) {
                fxDef.draw(t, { targets: (f.targets || []).map(geoE), view });
              } });
              steps.push(st);
              for (let j = k + 1; j < fx.length && (fx[j].t === 'ehit' && fx[j].kind === 'strike' || fx[j].t === 'burn'); j++) {
                st.hits.push(fx[j].t === 'ehit' ? hitE(fx[j]) : statusFloat(fx[j], geoE));
                st.logN = after(j);
                k = j;
              }
            }
          }
          break;
        }
        case 'ehit': {
          if (f.kind === 'strike' || f.kind === 'riposte' || f.kind === 'hound') {
            const name = f.kind === 'hound' ? 'hound' : f.kind === 'riposte' ? 'slash' : (act && act.anim) || 'slash';
            const fxDef = U.FX.strike[name] || U.FX.strike.slash;
            const hitN = f.hit || 0, mine = f.kind !== 'hound';
            steps.push(step(fxDef.dur, { logN, impact: fxDef.impact, hits: [hitE(f)],
              pre(t) { if (mine) view.wlunge = Math.sin(Math.min(1, t * 1.3) * Math.PI); },   // your weapon thrusts at them
              draw(t) {
              fxDef.draw(t, { target: geoE(f.i), hit: hitN, crit: f.crit, q: f.q, el: f.el, view });
            }, end() { view.wlunge = 0; } }));
          } else {   // burns ticking at the end of the round
            const fxDef = U.FX.strike.burn;
            steps.push(step(fxDef.dur, { logN, impact: 0.5, hits: [hitE(f)], draw(t) { fxDef.draw(t, { target: geoE(f.i), view }); } }));
          }
          break;
        }
        case 'burn': case 'freeze': addImpact(statusFloat(f, geoE)); break;
        case 'emove': {
          const mv = D.moves[f.move] || {};
          const fxDef = U.FX.enemy[f.anim] || U.FX.enemy.bump;
          const i = f.i;
          const st = step(fxDef.dur, { logN, impact: fxDef.impact, pre(t) { view.lunge[i] = fxDef.lunge ? fxDef.lunge(t) : 0; }, draw(t) {
            fxDef.draw(t, { src: geoE(i), zone: U.ZONE, heavy: f.heavy, from: U.SIDE.anchor(), view, name: mv.name });
            callout(geoE(i), mv.name, f.heavy, t);
          }, end() { view.lunge[i] = 0; } });
          steps.push(st);
          // consequences: first lands on this step's impact, extra hits get their own quick beats
          let landed = false;
          for (let j = k + 1; j < fx.length && ['phit', 'dodge', 'dread', 'steal', 'sap', 'eheal', 'hhit', 'poison'].includes(fx[j].t); j++) {
            const g = fx[j], fn = consequence(g, geoE, hitP, view);
            const isHit = g.t === 'phit' || g.t === 'dodge' || g.t === 'hhit';
            if (!isHit || !landed) {          // the first hit (and side effects) land on the main impact
              st.hits.push(fn);
              st.logN = after(j);
              if (isHit) landed = true;
            } else {                          // flurries etc: each extra hit gets a quick beat of its own
              const fd = U.FX.enemy[f.anim] || U.FX.enemy.bump;
              steps.push(step(Math.round(fd.dur * 0.55), { logN: after(j), impact: 0.4, hits: [fn], draw(t) {
                fd.draw(Math.min(1, 0.3 + t * 0.7), { src: geoE(i), zone: U.ZONE, from: U.SIDE.anchor(), view, name: mv.name });
              } }));
            }
            k = j;
          }
          break;
        }
        case 'phit': steps.push(step(260, { logN, impact: 0.3, hits: [hitP(f)], draw(t) { U.FX.enemy.poison.draw(t, { zone: U.ZONE, view }); } })); break;
        case 'frozen': {
          const i = f.i;
          steps.push(step(300, { logN, draw(t) { U.FX.strike.frozen.draw(t, { target: geoE(i), view }); } }));
          break;
        }
        case 'kill': {
          const i = f.i;
          steps.push(step(480, { logN, start() { view.dead[i] = 0.01; }, pre(t) { view.dead[i] = Math.max(0.01, t); }, end() { view.gone[i] = true; } }));
          break;
        }
        case 'phase':
          steps.push(step(700, { logN, start() { U.ui.shake = performance.now() + 500; }, draw(t) { U.FX.enemy.dread.draw(t, { zone: U.ZONE, view, color: '#ff4060' }); } }));
          break;
        case 'win':
          steps.push(step(800, { logN, draw(t) { banner('VICTORY', U.C.g, t); } }));
          break;
        case 'lose':
          steps.push(step(900, { logN, draw(t) { view.dim = t; } }));
          break;
        case 'flee':
          steps.push(step(350, { logN, draw(t) { view.dim = t * 0.8; } }));
          break;
        case 'level': {
          const lvl = f.lvl;
          steps.push(step(10, { logN, end() { U.ui.banner = { text: `LEVEL ${lvl}`, color: U.C.y, until: performance.now() + 1800 }; } }));
          break;
        }
        case 'heal': steps.push(step(320, { logN, draw(t) { U.FX.strike.item.draw(t, { from: U.SIDE.anchor(), view }); } })); break;
        default: if (steps.length) last().logN = Math.max(last().logN, logN);
      }
    }
    if (!steps.length) return;
    A.steps = steps; A.i = 0; A.view = view; A.t0 = performance.now();
    if (steps[0].start) steps[0].start();
    U.render();
  };

  function step(dur, o) {
    return Object.assign({ dur: Math.max(10, Math.round(dur * speed())), impact: 0.5, hits: [], logN: 0, fired: false }, o);
  }

  function statusFloat(f, geoE) {
    return () => {
      const g = geoE(f.i);
      U.float(g.cx, g.top - 2, f.t === 'burn' ? 'burning!' : 'frozen!', f.t === 'burn' ? '#ff8a3d' : '#7fd8ff', 900);
    };
  }

  function consequence(g, geoE, hitP, view) {
    switch (g.t) {
      case 'phit': return hitP(g);
      case 'dodge': return () => U.float(U.SIDE.hpX, U.SIDE.hpY, 'dodge!', U.C.c, 800);
      case 'dread': return () => U.float(U.SIDE.hpX, U.SIDE.hpY + 3, `-${g.amt} sanity`, U.C.m, 1000);
      case 'steal': return () => (view.gold != null && (view.gold -= g.amt), U.float(U.SIDE.hpX, U.SIDE.hpY + 4, g.amt ? `-${g.amt} gold` : 'nothing!', U.C.y, 1000));
      case 'sap': return () => U.float(U.SIDE.hpX, U.SIDE.hpY + 2, `-${g.amt} spirit`, U.C.b, 1000);
      case 'poison': return () => U.float(U.SIDE.hpX, U.SIDE.hpY + 1, 'poisoned!', '#8fdc4f', 1000);
      case 'hhit': return () => U.float(U.SIDE.hpX, U.SIDE.hpY + 13, `hound -${g.dmg}`, U.C.m, 800);
      case 'eheal': return () => {
        view.ehp[g.i] = g.hp;
        const e = geoE(g.i);
        U.float(e.cx, e.top - 1, `+${g.amt}`, U.C.g, 900);
      };
    }
    return () => {};
  }

  // Move name popping up over the enemy using it.
  function callout(g, name, heavy, t) {
    if (!name || t > 0.95) return;
    const txt = heavy ? `${name}!` : name;
    U.center(g.cx, U.L.VIEW.y, txt, heavy ? U.C.o : U.C.r, U.BANNER_BG);
  }
  function banner(text, color, t) {
    if (t <= 0.97) U.bannerAt(text, color);
  }
  function bossBanner(key, t) {
    const e = D.enemies[key];
    if (t < 0.15 || t > 0.95) return;
    banner(e.name.toUpperCase().split('').join(' '), e.color, t);
  }

  // Map-side effects never block input for long.
  function mapFx(f, steps, view, setLog) {
    setLog();
    const s = U.ui.s, p = s.p;
    switch (f.t) {
      case 'travel':
        steps.push(step(f.dir === 'edge' ? 260 : 420, { logN: s.log.length, start() { view.trans = { dir: f.dir, t: 0 }; }, pre(t) { view.trans = { dir: f.dir, t }; }, end() { view.trans = null; } }));
        break;
      case 'stone': U.ui.banner = { text: '+1 STAT POINT', color: '#7fffe0', until: performance.now() + 1600 }; break;
      case 'vista': U.ui.banner = { text: 'THE VIEW', color: U.C.w, until: performance.now() + 1200 }; break;
      case 'secret': U.float(-1, -1, 'a hidden passage!', U.C.y, 1200, { mx: p.x, my: p.y, map: p.map }); break;
      case 'chest': if (f.weapon || f.learn) U.ui.banner = { text: f.weapon ? 'NEW WEAPON' : 'NEW ABILITY', color: U.C.c, until: performance.now() + 1500 }; break;
      case 'level': U.ui.banner = { text: `LEVEL ${f.lvl}`, color: U.C.y, until: performance.now() + 1800 }; break;
      case 'pull': U.ui.pull = { results: f.results, t0: performance.now() }; break;
      case 'heal': U.float(U.SIDE.hpX, U.SIDE.hpY, 'restored', U.C.g, 800); break;
      case 'strain': U.float(U.SIDE.hpX, U.SIDE.hpY, 'exhausted', U.C.o, 800); break;
    }
  }

  /* ---------- Playback ---------- */
  function fire(st) {
    if (st.fired) return;
    st.fired = true;
    for (const h of st.hits) h();
  }
  A.tick = function (now) {
    if (!A.view) return;
    while (A.i < A.steps.length) {
      const st = A.steps[A.i], t = (now - A.t0) / st.dur;
      if (t >= st.impact) { fire(st); A.view.logN = Math.max(A.view.logN, st.logN); }
      if (t < 1) { if (st.pre) st.pre(Math.max(0, t)); return; }
      if (st.end) st.end();
      A.i++;
      A.t0 += st.dur;
      if (A.i < A.steps.length && A.steps[A.i].start) A.steps[A.i].start();
    }
    A.finish();
  };
  A.draw = function (now) {
    if (!A.view || A.i >= A.steps.length) return;
    const st = A.steps[A.i], t = Math.max(0, Math.min(1, (now - A.t0) / st.dur));
    if (st.draw) st.draw(t, now);
  };
  A.skip = function () {
    for (; A.i < A.steps.length; A.i++) {
      const st = A.steps[A.i];
      if (st.start && !st.fired) st.start();
      fire(st);
      if (st.end) st.end();
    }
    A.finish();
  };
  A.finish = function () {
    A.view = null; A.steps = []; A.i = 0;
    U.fixTarget();
    U.render();
  };

  // Floats can also be pinned to a map tile: U.float(-1, -1, txt, col, dur, { mx, my })
  const baseFloat = U.float;
  U.float = function (x, y, text, color, dur, at) {
    baseFloat(x, y, text, color, dur);
    if (at) Object.assign(U.ui.floats[U.ui.floats.length - 1], at);
  };
})();
