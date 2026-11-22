'use strict';
/* =====================================================================
   node tools/sim.js        balance simulator
   Pits a sensible AI player of a given level and gear against each
   area's random encounters and the bosses, and reports win rates and
   how much HP a fight costs. Use it after changing numbers in content/.
   ===================================================================== */
const { SF, Engine } = require('./load.js')();
const D = SF.data, E = SF.E;

function makePlayer(lvl, weapon, build, extraPoints) {
  const s = Engine.newGame({ name: 'Sim', seed: lvl * 7 + 1, alloc: build.start });
  const p = s.p;
  p.lvl = lvl;
  p.points += (lvl - 1) * D.rules.pointsPerLevel + (extraPoints || 0);
  const order = build.grow;
  for (let k = 0; p.points > 0; k++) { p.stats[order[k % order.length]]++; p.points--; }
  p.weapon = weapon; p.weapons = [weapon];
  for (const id of Object.keys(D.spells)) if (D.spells[id].found) p.known[id] = true;
  for (const id of Object.keys(D.skills)) if (D.skills[id].found) p.known[id] = true;
  const d = Engine.derived(p);
  p.hp = d.maxHp; p.st = d.maxSt; p.sp = d.maxSp;
  return s;
}

// A decent (not perfect) player: reads intents, defends heavy hits, uses weaknesses.
function choose(s, timing) {
  const c = s.combat, p = s.p, d = Engine.derived(p), ab = Engine.abilities(s);
  const live = c.enemies.map((e, i) => [e, i]).filter(([e]) => e.hp > 0);
  const heavy = live.some(([e]) => !e.frozen && D.moves[e.intent] && D.moves[e.intent].heavy);
  if (p.hp < d.maxHp * 0.3 && p.inv.hp_potion) return { type: 'use', id: 'hp_potion' };
  if (p.poison && p.inv.antidote && p.hp < d.maxHp * 0.6) return { type: 'use', id: 'antidote' };
  if (heavy) return { type: 'defend' };
  const [tgtE, tgt] = live.reduce((a, b) => (b[0].hp < a[0].hp ? b : a));
  const def = D.enemies[tgtE.key];
  const q = timing();
  // best spell vs. this target's weaknesses
  const spells = ab.spells.filter((x) => x.can && x.target !== 'summon');
  const weakSpell = spells.find((x) => (def.weak || []).includes(x.el));
  if (weakSpell) return { type: 'spell', id: weakSpell.id, target: tgt };
  if ((def.resist || []).includes('phys') && spells.length) return { type: 'spell', id: spells[spells.length - 1].id, target: tgt };
  if (live.length > 1) {
    const aoe = ab.skills.find((x) => x.can && x.target === 'all') || ab.spells.find((x) => x.can && x.target === 'all');
    if (aoe) return { type: aoe.res === 'st' ? 'skill' : 'spell', id: aoe.id, target: tgt, q };
  }
  const sk = ab.skills.filter((x) => x.can && x.target !== 'all').pop();
  if (sk && p.st > sk.cost + 6) return { type: 'skill', id: sk.id, target: tgt, q };
  return { type: 'attack', target: tgt, q };
}

function fight(s, keys, opt, timing) {
  const p = s.p, d0 = Engine.derived(p);
  p.hp = d0.maxHp; p.st = d0.maxSt; p.sp = d0.maxSp; p.san = 100; p.poison = null;
  p.inv = { hp_potion: opt.potions || 0, antidote: 1 };
  p.xp = -1e9;   // no level-ups mid-test (they heal you and hide the damage)
  let used = 0;
  E.OUT = { ok: true, fx: [] }; E.CUR = s;
  E.startCombat(s, keys, { boss: !!opt.boss });
  E.OUT = null; E.CUR = null;
  let rounds = 0;
  let minHp = 1;
  while (s.scene === 'combat' && rounds < 80) {
    const a = choose(s, timing);
    if (a.type === 'use' && a.id === 'hp_potion') used++;
    Engine.act(s, a); rounds++;
    minHp = Math.min(minHp, p.hp / Engine.derived(p).maxHp);
  }
  const won = s.scene === 'explore';
  const hpLeft = won ? Math.max(0, p.hp) / Engine.derived(p).maxHp : 0;
  if (!won) { s.scene = 'explore'; s.combat = null; s.dead = null; }
  return { won, rounds, hpLeft, potions: used, minHp };
}

const builds = {
  balanced: { start: { vit: 1, str: 1, spi: 1 }, grow: ['vit', 'str', 'spi', 'sta', 'wil'] },
  warrior:  { start: { vit: 1, str: 2 }, grow: ['str', 'vit', 'str', 'sta'] },
};
const skill = { average: () => (Math.random() < 0.25 ? 'perfect' : Math.random() < 0.8 ? 'good' : 'weak') };

const areas = [
  // area, level, weapon, extra stat points from stones by then, potions
  ['woods', 1, 'wooden_sword', 0, 0], ['woods', 2, 'wooden_sword', 0, 0], ['woods', 3, 'stone_sword', 1, 0],
  ['foothills', 2, 'wooden_sword', 0, 0], ['foothills', 3, 'stone_sword', 1, 0],
  ['cave', 3, 'stone_sword', 1, 1], ['cave', 4, 'stone_sword', 1, 1], ['cave', 5, 'hand_axe', 1, 1],
  ['switchbacks', 4, 'stone_sword', 1, 1], ['cave_depths', 5, 'steel_sword', 2, 1],
  ['ridge', 5, 'ember_blade', 3, 1], ['ridge', 6, 'ember_blade', 3, 1],
  ['ruins', 6, 'ember_blade', 4, 2], ['ruins', 7, 'galecutter', 5, 2], ['ruins', 8, 'galecutter', 5, 2],
];
const N = 300;
console.log('Random encounters (balanced build, average timing). win% / avg HP left / avg rounds / potions used');
for (const [mk, lvl, w, extra, pots] of areas) {
  const m = D.maps[mk];
  let wins = 0, hp = 0, rounds = 0, potions = 0;
  for (let k = 0; k < N; k++) {
    const s = makePlayer(lvl, w, builds.balanced, extra);
    s.rng = (k * 2654435761) | 0;
    E.OUT = { ok: true, fx: [] }; E.CUR = s;
    const keys = [E.pickWeighted(s, m.enc)];
    if (!D.enemies[keys[0]].solo) while (keys.length < (m.maxGroup || 2) && E.chance(s, 0.4)) {
      const k2 = E.pickWeighted(s, m.enc); if (!D.enemies[k2].solo) keys.push(k2);
    }
    E.OUT = null; E.CUR = null;
    const r = fight(s, keys, { potions: pots }, skill.average);
    if (r.won) wins++; hp += r.hpLeft; rounds += r.rounds; potions += r.potions;
  }
  console.log(`  ${(mk + ' Lv' + lvl).padEnd(18)} ${w.padEnd(13)} ${String(Math.round(wins / N * 100)).padStart(3)}%   hp ${String(Math.round(hp / N * 100)).padStart(3)}%   ${(rounds / N).toFixed(1).padStart(4)} rds   ${(potions / N).toFixed(2)} pots`);
}
console.log('\nBosses (5 potions)');
for (const [boss, lvl, w, extra] of [['troll', 4, 'stone_sword', 1], ['troll', 5, 'hand_axe', 1], ['stormcrow', 6, 'ember_blade', 3], ['stormcrow', 7, 'ember_blade', 4],
  ['warden', 7, 'galecutter', 5], ['warden', 8, 'galecutter', 5], ['warden', 9, 'galecutter', 5]]) {
  for (const [bn, b] of Object.entries(builds)) {
    let wins = 0, hp = 0, rounds = 0;
    for (let k = 0; k < N; k++) {
      const s = makePlayer(lvl, w, b, extra);
      s.rng = (k * 2654435761) | 0;
      const r = fight(s, [boss], { boss: D.enemies[boss].boss, potions: 5 }, skill.average);
      if (r.won) wins++; hp += r.hpLeft; rounds += r.rounds;
    }
    console.log(`  ${(boss + ' Lv' + lvl).padEnd(16)} ${bn.padEnd(9)} ${w.padEnd(12)} ${String(Math.round(wins / N * 100)).padStart(3)}%  hp ${String(Math.round(hp / N * 100)).padStart(3)}%  ${(rounds / N).toFixed(1)} rds`);
  }
}

// XP pacing: how many average fights per level in each area
console.log('\nXP to next level:', [1, 2, 3, 4, 5, 6, 7, 8].map((l) => `L${l}:${Engine.xpNeed(l)}`).join('  '));
