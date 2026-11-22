'use strict';
/* =====================================================================
   SHARDFALL engine - combat.js
   Turn order each round: you -> your spirit hound -> each enemy -> end
   of round (burns, poison, regen).

   What makes it more than "press attack":
     - INTENTS: every enemy shows what it will do next turn.
     - HEAVY moves are telegraphed. Defend against one for a PERFECT GUARD:
       you take 20% damage and riposte. Charge moves wind up a turn first.
     - TIMED STRIKES: the UI's strike bar sends q = perfect | good | weak.
     - ELEMENTS: weaknesses and resistances, discovered and journaled.
     - GUARDING enemies take half damage; spells ignore half of defense.
   ===================================================================== */
(function () {
  const E = SF.E, D = E.D, R = E.R;

  /* ---------- Setup ---------- */
  E.startCombat = function (s, keys, opt) {
    const count = {}, used = {};
    keys.forEach((k) => (count[k] = (count[k] || 0) + 1));
    const enemies = keys.map((k) => {
      const e = D.enemies[k];
      const suffix = count[k] > 1 ? ' ' + 'ABCDEF'[(used[k] = (used[k] || 0) + 1) - 1] : '';
      return { key: k, name: e.name + suffix, lvl: e.lvl || 1, hp: e.hp, maxHp: e.hp, atk: e.atk, def: e.def,
        boss: !!e.boss, burn: 0, burnDmg: 0, frozen: 0, stolen: 0, guard: 0, dead: false,
        intent: null, next: null, phase: 1 };
    });
    s.combat = { enemies, hound: null, defending: false, round: 1, boss: !!opt.boss, tile: opt.tile || null,
      map: s.p.map, loot: { xp: 0, gold: 0, items: [], reduced: false }, notes: [] };
    s.scene = 'combat';
    for (const e of enemies) { rollIntent(s, e); E.journalSee(s, e.key); }
    const first = D.enemies[keys[0]];
    if (opt.boss) E.log(s, first.intro || `{r}${first.name.toUpperCase()} ATTACKS!{/}`);
    else E.log(s, `{r}Ambush!{/} ${E.listNames(enemies.map((e) => e.name))} ${enemies.length > 1 ? 'leap' : 'leaps'} out!`);
    E.fx({ t: 'start', boss: !!opt.boss, key: keys[0] });
  };

  const alive = (c) => c.enemies.map((e, i) => (e.hp > 0 ? i : -1)).filter((i) => i >= 0);
  function pickTarget(c, t) {
    if (c.enemies[t] && c.enemies[t].hp > 0) return t;
    const a = alive(c);
    return a.length ? a[0] : -1;
  }

  /* ---------- Intents ---------- */
  function moveList(e) {
    const def = D.enemies[e.key];
    return e.phase === 2 && def.phase2 ? def.phase2.moves : def.moves;
  }
  function rollIntent(s, e) {
    if (e.next) { e.intent = e.next; e.next = null; return; }
    e.intent = E.pickWeighted(s, moveList(e));
  }
  function phaseCheck(s, e, i) {
    const def = D.enemies[e.key];
    if (!def.phase2 || e.phase !== 1 || e.hp <= 0 || e.hp > e.maxHp * (def.phase2.at || 0.5)) return;
    e.phase = 2;
    if (def.phase2.text) E.log(s, def.phase2.text);
    E.fx({ t: 'phase', i });
  }

  // What the UI shows under each enemy: { kind, name, text }
  E.intentInfo = function (s, e) {
    const mv = D.moves[e.intent];
    if (!mv || e.hp <= 0) return null;
    if (e.frozen > 0) return { kind: 'frozen', name: 'Frozen', text: `${e.frozen} turn${e.frozen > 1 ? 's' : ''}` };
    const d = E.derived(s.p), est = (m) => Math.max(1, Math.round(e.atk * m * (1 - d.resist)));
    switch (mv.type) {
      case 'hit': case 'drain': case 'aoe': {
        const n = mv.hits || 1, dmg = est(mv.mult || 1);
        return { kind: mv.heavy ? 'heavy' : 'attack', name: mv.name, text: (n > 1 ? `${n}x` : '') + `~${dmg}` };
      }
      case 'dread': return { kind: 'dread', name: mv.name, text: '-sanity' };
      case 'steal': return { kind: 'other', name: mv.name, text: 'gold' };
      case 'sap': return { kind: 'other', name: mv.name, text: '-spirit' };
      case 'guard': return { kind: 'guard', name: mv.name, text: '' };
      case 'heal': return { kind: 'guard', name: mv.name, text: 'heal' };
      case 'charge': return { kind: 'charge', name: mv.name, text: 'winding up' };
    }
    return { kind: 'attack', name: mv.name, text: '' };
  };

  /* ---------- Elements & journal notes ---------- */
  function elemMult(e, el) {
    const def = D.enemies[e.key];
    if ((def.weak || []).includes(el)) return R.weakMult;
    if ((def.resist || []).includes(el)) return R.resistMult;
    return 1;
  }
  const emTag = (em) => (em > 1 ? ' {y}(weak!){/}' : em < 1 ? ' {d}(resisted){/}' : '');
  function learnEl(s, e, el, em) {
    if (em === 1) return;
    const j = E.journalEntry(s.p, e.key);
    if (j.el[el]) return;
    j.el[el] = em > 1 ? 'weak' : 'resist';
    const nm = D.enemies[e.key].name, en = D.elements[el].name.toLowerCase();
    s.combat.notes.push(em > 1
      ? `{y}Weakness found!{/} ${nm} is weak to ${en}. {d}(noted in your journal){/}`
      : `{d}${nm} resists ${en}. (noted in your journal){/}`);
  }
  function flushNotes(s) {
    const c = s.combat;
    if (!c) return;
    for (const n of c.notes) E.log(s, n);
    c.notes = [];
  }
  const weaponEl = (p) => (D.weapons[p.weapon] || {}).el || 'phys';

  /* ---------- A full round ---------- */
  function combatTurn(s, a) {
    const c = s.combat, p = s.p, tgt = pickTarget(c, a.target);
    const q = ['perfect', 'good', 'weak'].includes(a.q) ? a.q : 'good';
    let plan;
    switch (a.type) {
      case 'attack':
        plan = () => attack(s, tgt, q);
        break;
      case 'skill': {
        const sk = D.skills[a.id];
        if (!sk) return E.fail('Unknown skill.');
        if (!E.knows(p, sk)) return E.fail(sk.found ? `You haven't learned ${sk.name}.` : `${sk.name} unlocks at level ${sk.lvl}.`);
        if (p.st < sk.cost) return E.fail(`Not enough stamina for ${sk.name}.`);
        plan = () => { p.st -= sk.cost; useSkill(s, sk, tgt, q); };
        break;
      }
      case 'spell': {
        const sp = D.spells[a.id];
        if (!sp) return E.fail('Unknown spell.');
        if (!E.knows(p, sp)) return E.fail(sp.found ? `You haven't learned ${sp.name}.` : `${sp.name} unlocks at level ${sp.lvl}.`);
        if (p.sp < sp.cost) return E.fail(`Not enough spirit for ${sp.name}.`);
        plan = () => { p.sp -= sp.cost; castSpell(s, sp, tgt); };
        break;
      }
      case 'use': {
        const it = D.items[a.id];
        if (!it || !(p.inv[a.id] > 0)) return E.fail("You don't have that.");
        const why = E.itemBlocked(s, it);
        if (why) return E.fail(why);
        plan = () => { E.fx({ t: 'act', kind: 'item', id: a.id }); E.applyItem(s, a.id); };
        break;
      }
      case 'defend':
        plan = () => {
          c.defending = true;
          E.fx({ t: 'act', kind: 'defend' });
          const heavy = c.enemies.some((e) => e.hp > 0 && !e.frozen && D.moves[e.intent] && D.moves[e.intent].heavy);
          E.log(s, heavy ? 'You plant your feet and raise your guard, {c}ready to counter{/}.' : 'You raise your guard and catch your breath.');
        };
        break;
      case 'flee':
        if (c.boss) return E.fail('There is no escape from this fight!');
        plan = () => { E.fx({ t: 'act', kind: 'flee' }); tryFlee(s); };
        break;
      default:
        return E.fail(null);
    }

    // 1. you (a shaken mind may freeze; nothing is spent if so)
    c.defending = false;
    if (p.san < 30 && E.chance(s, E.derived(p).terror)) {
      E.fx({ t: 'act', kind: 'terror' });
      E.log(s, '{m}The whispers swell. You freeze in terror!{/}');
    } else plan();
    flushNotes(s);
    if (checkWin(s)) return true;
    // 2. your spirit hound
    houndTurn(s);
    if (checkWin(s)) return true;
    // 3. enemies
    for (let i = 0; i < c.enemies.length; i++) {
      enemyTurn(s, i);
      flushNotes(s);
      if (s.scene !== 'combat' || checkWin(s)) return true;
    }
    // 4. burns, poison, regen, timers
    endRound(s);
    return true;
  }

  function checkWin(s) {
    if (s.scene !== 'combat') return true;
    if (s.combat.enemies.every((e) => e.hp <= 0)) { victory(s); return true; }
    return false;
  }

  function hitEnemy(s, i, dmg, info) {
    const e = s.combat.enemies[i];
    e.hp = Math.max(0, e.hp - dmg);
    E.fx(Object.assign({ t: 'ehit', i, dmg, hp: e.hp }, info));
    phaseCheck(s, e, i);
  }

  /* ---------- Your attacks ---------- */
  // Physical hits. Extra hits carry over to the next foe if the target dies.
  function strike(s, i, n, mult, opt) {
    const c = s.combat, p = s.p, d = E.derived(p), w = D.weapons[p.weapon], T = R.timing, hits = [];
    const q = opt.q || 'good', qm = T[q] || 1, critBonus = q === 'perfect' ? T.perfectCrit : 0;
    const el = opt.el || weaponEl(p);
    for (let h = 0; h < n; h++) {
      if (i < 0 || c.enemies[i].hp <= 0) { if (opt.noCarry) break; i = pickTarget(c, -1); }
      if (i < 0) break;
      const e = c.enemies[i];
      let dmg = E.roll(s, d.dmgMin, d.dmgMax) * mult * E.dmgMult(p) * qm;
      const crit = E.chance(s, d.crit + critBonus);
      if (crit) dmg *= R.critMult;
      const em = elemMult(e, el);
      dmg = Math.max(1, Math.round(dmg * em - e.def * (e.guard ? 2 : 1)));
      hitEnemy(s, i, dmg, { kind: 'strike', crit, el, em, q, hit: h });
      learnEl(s, e, el, em);
      const hit = { i, dmg, crit, em, name: e.name };
      if (w.burn && e.hp > 0 && E.chance(s, w.burn)) {
        burn(e, 3, 3 + Math.floor(p.stats.str / 2));
        E.fx({ t: 'burn', i });
        hit.burned = true;
      }
      hits.push(hit);
    }
    return hits;
  }
  function fmtHits(hits) {
    const groups = [];
    for (const h of hits) {
      let g = groups[groups.length - 1];
      if (!g || g.i !== h.i) groups.push((g = { i: h.i, name: h.name, parts: [], burned: false }));
      g.parts.push((h.crit ? `{y}${h.dmg} (crit){/}` : `${h.dmg}`) + emTag(h.em));
      if (h.burned) g.burned = true;
    }
    return groups.map((g) => `${g.name} for ${g.parts.join(' + ')}${g.burned ? ' {o}(burning){/}' : ''}`).join(', then ');
  }
  const qTag = (q) => (q === 'perfect' ? '{y}Perfect strike!{/} ' : q === 'weak' ? '{d}A clumsy swing.{/} ' : '');

  function attack(s, i, q) {
    const p = s.p, w = D.weapons[p.weapon];
    E.fx({ t: 'act', kind: 'attack', target: i, q, anim: w.anim || 'slash' });
    let hits = strike(s, i, 1, 1, { q });
    let extra = '';
    if (q === 'perfect' && w.perfectHit && alive(s.combat).length) {
      hits = hits.concat(strike(s, i, 1, w.perfectHit, { q: 'good' }));
      extra = ` {c}The ${w.name} sings: a second cut!{/}`;
    }
    E.log(s, `${qTag(q)}You strike ${fmtHits(hits)}.${extra}`);
    reap(s);
  }

  function burn(e, turns, dmg) {
    e.burn = Math.max(e.burn, turns);
    e.burnDmg = Math.max(e.burnDmg, dmg);
  }

  function useSkill(s, sk, i, q) {
    const c = s.combat;
    const targets = sk.target === 'all' ? alive(c) : [i];
    E.fx({ t: 'act', kind: 'skill', id: sk.id, anim: sk.anim || 'slash', target: i, targets, q });
    let hits = [];
    if (sk.target === 'all') for (const t of targets) hits = hits.concat(strike(s, t, 1, sk.mult, { q, el: sk.el, noCarry: true }));
    else hits = strike(s, i, sk.hits || 1, sk.mult, { q, el: sk.el });
    let txt = `${qTag(q)}{o}${sk.name}!{/} You hit ${fmtHits(hits)}.`;
    const last = hits.length ? c.enemies[hits[hits.length - 1].i] : null;
    if (sk.burn && last && last.hp > 0) {
      burn(last, sk.burn, 3 + Math.floor(s.p.stats.str / 2));
      E.fx({ t: 'burn', i: hits[hits.length - 1].i });
      txt += ` {o}${last.name} is set ablaze!{/}`;
    }
    E.log(s, txt);
    reap(s);
  }

  function castSpell(s, sp, i) {
    const c = s.combat, p = s.p, d = E.derived(p);
    if (sp.target === 'summon') {
      E.fx({ t: 'act', kind: 'spell', id: sp.id, anim: sp.anim || 'summon', target: -1, targets: [] });
      E.log(s, sp.cast);
      const hp = 20 + d.power * 4;
      c.hound = { hp, maxHp: hp, turns: sp.turns, dmg: 5 + d.power * 2 };
      return;
    }
    let targets;
    if (sp.target === 'all') targets = alive(c).map((t) => [t, 1]);
    else if (sp.target === 'chain') {
      const first = pickTarget(c, i);
      targets = first < 0 ? [] : [[first, 1]].concat(alive(c).filter((t) => t !== first).map((t) => [t, sp.chain || 0.6]));
    } else targets = i >= 0 ? [[i, 1]] : [];
    E.fx({ t: 'act', kind: 'spell', id: sp.id, anim: sp.anim || 'bolt', target: i, targets: targets.map((x) => x[0]) });
    E.log(s, sp.cast);
    const parts = [], el = sp.el || 'spirit';
    for (const [t, frac] of targets) {
      const e = c.enemies[t];
      if (e.hp <= 0) continue;
      const em = elemMult(e, el);
      const raw = (sp.base + d.power * sp.scale) * frac * E.vary(s, 0.9, 1.1) * E.dmgMult(p) * em;
      const dmg = Math.max(1, Math.round(raw - Math.floor((e.def * (e.guard ? 2 : 1)) / 2)));   // spells ignore half of defense
      hitEnemy(s, t, dmg, { kind: 'spell', el, em, spell: sp.id });
      learnEl(s, e, el, em);
      let txt = `${e.name} takes ${dmg}${emTag(em)}`;
      if (e.hp > 0 && sp.freeze) {
        e.frozen = Math.max(e.frozen, e.boss ? 1 : sp.freeze);
        txt += ' {c}(frozen){/}';
        E.fx({ t: 'freeze', i: t });
      }
      if (e.hp > 0 && sp.burnChance && E.chance(s, sp.burnChance)) {
        burn(e, 3, 3 + Math.floor(d.power / 2));
        txt += ' {o}(burning){/}';
        E.fx({ t: 'burn', i: t });
      }
      parts.push(txt);
    }
    if (parts.length) E.log(s, `  ${parts.join(', ')}.`);
    reap(s);
  }

  function houndTurn(s) {
    const c = s.combat, h = c.hound;
    if (!h) return;
    const a = alive(c);
    if (!a.length) return;
    const i = E.pickOne(s, a), e = c.enemies[i], em = elemMult(e, 'spirit');
    const dmg = Math.max(1, Math.round(h.dmg * E.vary(s, 0.9, 1.1) * em - Math.floor((e.def * (e.guard ? 2 : 1)) / 2)));
    E.fx({ t: 'act', kind: 'hound', target: i });
    hitEnemy(s, i, dmg, { kind: 'hound', el: 'spirit', em });
    learnEl(s, e, 'spirit', em);
    E.log(s, `{m}Your hound{/} mauls ${e.name} for ${dmg}${emTag(em)}.`);
    flushNotes(s);
    reap(s);
  }

  // Handle newly dead enemies: log, bank loot and XP, count quest kills, journal.
  function reap(s) {
    const c = s.combat, p = s.p;
    for (let i = 0; i < c.enemies.length; i++) {
      const e = c.enemies[i];
      if (e.hp > 0 || e.dead) continue;
      e.dead = true;
      const def = D.enemies[e.key], j = E.journalEntry(p, e.key);
      const xp = xpFor(s, e.key);
      E.fx({ t: 'kill', i });
      E.log(s, `{g}${e.name} is slain!{/}`);
      if (xp.first) E.log(s, `{c}New journal entry: ${def.name}.{/} {d}(+${xp.bonus} XP for a first kill){/}`);
      if (xp.reduced) c.loot.reduced = true;
      j.kills++;
      c.loot.xp += xp.xp;
      c.loot.gold += E.roll(s, def.gold[0], def.gold[1]) + e.stolen;
      if (!def.boss && E.chance(s, R.dropChance)) c.loot.items.push(E.pickOne(s, R.drops));
      p.kills++;
      E.countKill(s, c.map);
    }
  }

  function xpFor(s, k) {
    const def = D.enemies[k], p = s.p, j = E.journalEntry(p, k);
    let xp = def.xp, reduced = false, bonus = 0;
    const gap = p.lvl - (def.lvl || 1) - R.outlevelGrace;
    if (gap > 0) {
      xp = Math.max(1, Math.round(def.xp * Math.max(R.outlevelMin, 1 - gap * R.outlevelStep)));
      reduced = true;
    }
    const first = j.kills === 0;
    if (first) { bonus = Math.round(def.xp * R.firstKillBonus); xp += bonus; }
    return { xp, first, bonus, reduced };
  }

  /* ---------- Enemy turns ---------- */
  function enemyTurn(s, i) {
    const c = s.combat, e = c.enemies[i], p = s.p;
    if (e.hp <= 0) return;
    e.guard = 0;   // a guard lasts until the enemy's next turn
    if (e.frozen > 0) {
      e.frozen--;
      E.log(s, `{c}${e.name} is frozen solid.{/}`);
      E.fx({ t: 'frozen', i });
      return;
    }
    const mv = D.moves[e.intent] || D.moves.strike;
    E.fx({ t: 'emove', i, move: mv.id, type: mv.type, heavy: !!mv.heavy, anim: mv.anim || null });
    switch (mv.type) {
      case 'hit':
      case 'drain': {
        let dealt = 0;
        for (let h = 0; h < (mv.hits || 1) && s.scene === 'combat' && e.hp > 0; h++) {
          dealt += c.hound && E.chance(s, 0.75) ? hitHound(s, e, mv) : hitPlayer(s, e, i, mv);
        }
        if (mv.type === 'drain' && dealt > 0 && s.scene === 'combat' && e.hp > 0) {
          const heal = Math.min(e.maxHp - e.hp, dealt);
          if (heal > 0) {
            e.hp += heal;
            E.fx({ t: 'eheal', i, amt: heal, hp: e.hp });
            E.log(s, `  ${e.name} drinks the stolen life, healing ${heal}.`);
          }
        }
        break;
      }
      case 'aoe':
        if (c.hound) hitHound(s, e, mv);
        if (s.scene === 'combat' && e.hp > 0) hitPlayer(s, e, i, mv);
        break;
      case 'dread': {
        const was = p.san, loss = Math.max(1, Math.round(mv.amt * (1 - E.derived(p).dreadResist)));
        p.san = Math.max(0, p.san - loss);
        E.log(s, `${e.name} uses {m}${mv.name}{/}. Your mind reels: {m}-${loss} sanity{/}.`);
        E.fx({ t: 'dread', i, amt: loss });
        if (was > 0 && p.san === 0) E.log(s, '{m}Something inside you snaps. You are BROKEN.{/}');
        break;
      }
      case 'steal': {
        const took = Math.min(p.gold, E.roll(s, mv.amt[0], mv.amt[1]));
        p.gold -= took;
        e.stolen += took;
        E.fx({ t: 'steal', i, amt: took });
        E.log(s, took
          ? `${e.name} uses {y}${mv.name}{/} and snatches ${took} gold! {d}(Kill it to get it back.){/}`
          : `${e.name} rummages for gold and finds none.`);
        break;
      }
      case 'sap': {
        const took = Math.min(p.sp, mv.amt);
        p.sp -= took;
        E.fx({ t: 'sap', i, amt: took });
        E.log(s, `${e.name} uses {b}${mv.name}{/}, draining ${took} spirit.`);
        break;
      }
      case 'guard':
        e.guard = 1;
        E.log(s, `${e.name} ${mv.tell || 'raises its guard'}. {d}(half damage until its next turn){/}`);
        break;
      case 'heal': {
        const amt = Math.min(e.maxHp - e.hp, Math.round(e.maxHp * (mv.pct || 0.15)));
        e.hp += amt;
        E.fx({ t: 'eheal', i, amt, hp: e.hp });
        E.log(s, `${e.name} uses {g}${mv.name}{/}${amt ? `, healing ${amt}` : ''}.`);
        break;
      }
      case 'charge':
        e.next = mv.then;
        E.log(s, `{y}${e.name} ${mv.tell || 'gathers itself'}!{/} {d}(Next: ${D.moves[mv.then].name}. Defend to counter it.){/}`);
        break;
    }
    if (s.scene === 'combat' && e.hp > 0) rollIntent(s, e);
  }

  function hitPlayer(s, e, i, mv) {
    const p = s.p, c = s.combat, d = E.derived(p), G = R.guard;
    const label = `{r}${mv.name}{/}`;
    if (E.chance(s, d.dodge * (mv.heavy ? 0.5 : 1))) {
      E.log(s, `You {c}dodge{/} ${e.name}'s ${label}!`);
      E.fx({ t: 'dodge', i });
      return 0;
    }
    let dmg = e.atk * (mv.mult || 1) * E.vary(s, 0.85, 1.15) * (1 - d.resist);
    let guard = null;
    if (c.defending) { guard = mv.heavy ? 'perfect' : 'guard'; dmg *= mv.heavy ? G.perfect : G.normal; }
    dmg = Math.max(1, Math.round(dmg));
    const wasUp = p.hp > 0;
    p.hp -= dmg;
    E.fx({ t: 'phit', i, dmg, hp: p.hp, guard });
    const tag = guard === 'perfect' ? ' {c}(perfect guard!){/}' : guard ? ' {d}(guarded){/}' : '';
    E.log(s, `${e.name}'s ${label} hits you for {r}${dmg}{/}${tag}.`);
    if (p.hp <= -d.brink) { lose(s, e.name); return dmg; }
    if (wasUp && p.hp <= 0) E.log(s, `{m}You refuse to fall!{/} Willpower holds you on the brink. {d}(You fall at -${d.brink} HP.){/}`);
    if (mv.poison) {
      const [turns, pd] = mv.poison;
      p.poison = { turns: Math.max(turns, p.poison ? p.poison.turns : 0), dmg: Math.max(pd, p.poison ? p.poison.dmg : 0) };
      E.fx({ t: 'poison' });
      E.log(s, `{g}You are poisoned!{/} {d}(-${p.poison.dmg} HP per turn. Antidotes cure it.){/}`);
    }
    if (guard === 'perfect') riposte(s, i);
    return dmg;
  }

  function riposte(s, i) {
    const c = s.combat, e = c.enemies[i], p = s.p, d = E.derived(p);
    if (!e || e.hp <= 0) return;
    const el = weaponEl(p), em = elemMult(e, el);
    const dmg = Math.max(1, Math.round(E.roll(s, d.dmgMin, d.dmgMax) * R.guard.riposte * E.dmgMult(p) * em - e.def));
    E.fx({ t: 'act', kind: 'riposte', target: i, anim: 'slash' });
    hitEnemy(s, i, dmg, { kind: 'riposte', el, em });
    learnEl(s, e, el, em);
    E.log(s, `{c}You read it perfectly and riposte!{/} ${e.name} takes ${dmg}${emTag(em)}.`);
    reap(s);
  }

  function hitHound(s, e, mv) {
    const c = s.combat, h = c.hound;
    const dmg = Math.max(1, Math.round(e.atk * (mv.mult || 1) * E.vary(s, 0.85, 1.15)));
    h.hp -= dmg;
    E.fx({ t: 'hhit', dmg });
    E.log(s, `${e.name}'s {r}${mv.name}{/} hits {m}your hound{/} for ${dmg}.`);
    if (h.hp <= 0) { c.hound = null; E.log(s, '{m}Your spirit hound dissolves back into the Veil.{/}'); }
    return dmg;
  }

  function endRound(s) {
    const c = s.combat, p = s.p, d = E.derived(p);
    c.enemies.forEach((e, i) => {
      if (e.hp > 0 && e.burn > 0) {
        e.burn--;
        hitEnemy(s, i, e.burnDmg, { kind: 'burn', el: 'fire', em: 1 });
        E.log(s, `{o}${e.name} burns{/} for ${e.burnDmg}.`);
      }
    });
    reap(s);
    if (checkWin(s)) return;
    if (p.poison) {
      const before = p.hp;
      p.hp = Math.max(Math.min(p.hp, 1), p.hp - p.poison.dmg);
      if (p.hp < before) { E.fx({ t: 'phit', dmg: before - p.hp, hp: p.hp, poison: true }); E.log(s, `{g}Poison{/} burns in your veins. {r}-${before - p.hp} HP{/}`); }
      if (--p.poison.turns <= 0) { p.poison = null; E.log(s, '{d}The poison fades.{/}'); }
    }
    if (p.hp > 0) p.hp = Math.min(d.maxHp, p.hp + d.regen);
    else {
      p.hp -= 1;
      p.san = Math.max(0, p.san - 3);
      E.log(s, `{r}You are bleeding out{/} (${p.hp} HP).`);
      if (p.hp <= -d.brink) { lose(s, 'your wounds'); return; }
    }
    p.st = Math.min(d.maxSt, p.st + d.stRegen + (c.defending ? 6 : 0));
    p.sp = Math.min(d.maxSp, p.sp + d.spRegen + (c.defending ? 3 : 0));
    if (c.hound && --c.hound.turns <= 0) {
      c.hound = null;
      E.log(s, '{m}Your spirit hound fades back into the Veil.{/}');
    }
    c.defending = false;
    c.round++;
  }

  /* ---------- Ending a fight ---------- */
  function tryFlee(s) {
    const p = s.p, c = s.combat;
    const odds = Math.min(0.9, 0.4 + p.stats.str * 0.02 + (c.hound ? 0.15 : 0));
    if (E.chance(s, odds)) E.endFlee(s, 'You break away and escape!');
    else E.log(s, '{r}You try to flee, but they cut you off!{/}');
  }
  E.endFlee = function (s, msg) {
    E.log(s, msg);
    s.combat = null;
    s.scene = 'explore';
    s.p.grace = 4;
    if (s.p.hp <= 0) s.p.hp = 1;
    E.fx({ t: 'flee' });
  };

  function victory(s) {
    const c = s.combat, p = s.p, L = c.loot;
    p.gold += L.gold;
    for (const id of L.items) p.inv[id] = (p.inv[id] || 0) + 1;
    const extra = L.items.length ? ', ' + L.items.map((id) => D.items[id].name).join(', ') : '';
    E.log(s, `{g}Victory!{/} +${L.xp} XP, {y}+${L.gold} gold{/}${extra}.` + (L.reduced ? ' {d}(Little left to learn from such weak foes.){/}' : ''));
    if (p.hp <= 0) { p.hp = 1; E.log(s, 'You stagger upright, barely alive.'); }
    if (c.tile) s.world.gone[c.tile] = 1;
    E.invalidateFov();
    if (c.boss) {
      const od = D.enemies[c.enemies[0].key].onDefeat || {};
      if (od.text) E.log(s, od.text);
      if (od.flag) p.flags[od.flag] = true;
      if (od.ready) E.setReady(s, od.ready);
    }
    s.combat = null;
    s.scene = 'explore';
    p.grace = 3;
    E.fx({ t: 'win', xp: L.xp, gold: L.gold });
    E.gainXp(s, L.xp);
  }

  function lose(s, by) {
    s.scene = 'gameover';
    s.dead = { by, map: s.p.map, round: s.combat ? s.combat.round : 0 };
    s.combat = null;
    E.log(s, `{r}You have fallen to ${by}.{/}`);
    E.fx({ t: 'lose' });
  }

  E.respawn = function (s) {
    const p = s.p, d = E.derived(p), start = D.maps[R.start.map], lost = Math.floor(p.gold * R.deathGoldLoss);
    p.gold -= lost;
    p.deaths++;
    p.map = R.start.map;
    [p.x, p.y] = start.start;
    p.hp = Math.ceil(d.maxHp / 2); p.st = d.maxSt; p.sp = d.maxSp; p.san = Math.max(p.san, 50);
    p.poison = null;
    s.combat = null; s.dead = null; s.scene = 'explore'; p.grace = 0;
    E.invalidateFov();
    E.reveal(s);
    E.log(s, `You wake by the fountain, gasping.${lost ? ` {y}${lost} gold{/} is missing from your purse.` : ''}`);
    return true;
  };

  E.combatTurn = combatTurn;
})();
