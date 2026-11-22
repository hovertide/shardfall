'use strict';
/* =====================================================================
   SHARDFALL engine - stats.js
   Character math: everything derived from the five stats, level and
   weapon. Since stat points are scarce now (1 per level), levels also
   give a little baseline growth so the character never feels stuck.
   ===================================================================== */
(function () {
  const E = SF.E, D = E.D, R = E.R;

  E.derived = function (p) {
    const S = p.stats, L = p.lvl, w = D.weapons[p.weapon] || D.weapons[R.start.weapon];
    const bonus = Math.floor(S.str * 1.2) + Math.floor((L - 1) / 2);
    return {
      maxHp: 44 + S.vit * 7 + (L - 1) * 9,
      maxSt: 20 + S.sta * 5 + (L - 1) * 2,
      maxSp: 10 + S.spi * 6 + (L - 1) * 2,
      maxSan: R.maxSanity,
      dmgMin: w.min + bonus,
      dmgMax: w.max + bonus,
      crit: Math.min(0.6, 0.05 + S.str * 0.01 + (w.crit || 0) / 100),
      dodge: Math.min(0.35, 0.03 + S.str * 0.008),
      resist: Math.min(0.3, S.vit * 0.012),             // fraction of damage ignored
      regen: Math.max(1, Math.floor(S.vit / 4)),        // HP per combat round
      stRegen: 2 + Math.floor(S.sta / 3),
      spRegen: 1 + Math.floor(S.spi / 4),
      power: S.spi + Math.floor((L - 1) / 2),           // spell scaling
      brink: S.wil * 3,                                 // you fall at -brink HP
      furyBonus: S.wil * 0.02,                          // +damage when under 35% HP
      dreadResist: Math.min(0.7, S.wil * 0.03),
      terror: Math.max(0.05, 0.3 - S.wil * 0.012),      // freeze chance while shaken
    };
  };

  E.fury = function (p) {
    const d = E.derived(p);
    if (p.hp <= 0) return 1 + d.furyBonus * 2;
    return p.hp < d.maxHp * 0.35 ? 1 + d.furyBonus : 1;
  };
  E.dmgMult = (p) => E.fury(p) * (p.san <= 0 ? 0.75 : 1);
  E.xpNeed = (lvl) => Math.floor(R.xpBase * Math.pow(lvl, R.xpExp));
  E.qStatus = (p, q) => (p.quests[q] ? p.quests[q].s : 'none');

  // Does the player know this skill/spell? Level-gated ones unlock by level,
  // `found: true` ones must be learned from a tome or manual in the world.
  E.knows = (p, ab) => (ab.found ? !!(p.known && p.known[ab.id]) : p.lvl >= ab.lvl);

  E.conditions = function (s) {
    const p = s.p, d = E.derived(p), f = E.fury(p), c = s.combat, out = [];
    if (p.hp <= 0) out.push({ name: 'BRINK', color: '#ff4060', desc: `Below 0 HP. You fall at -${d.brink}.` });
    if (f > 1) out.push({ name: 'FURY', color: '#ff8a3d', desc: `+${Math.round((f - 1) * 100)}% damage` });
    if (p.san <= 0) out.push({ name: 'BROKEN', color: '#c792ea', desc: '-25% damage, may freeze in terror' });
    else if (p.san < 30) out.push({ name: 'SHAKEN', color: '#c792ea', desc: `${Math.round(d.terror * 100)}% chance to freeze` });
    if (p.poison) out.push({ name: 'POISON', color: '#8fdc4f', desc: `-${p.poison.dmg} HP for ${p.poison.turns} more turns` });
    if (c && c.hound) out.push({ name: 'HOUND', color: '#d08bff', desc: `${c.hound.hp} HP, ${c.hound.turns} turns left` });
    return out;
  };

  E.alloc = function (s, a) {
    const p = s.p, st = D.stats.find((x) => x.k === a.stat);
    if (!st) return E.fail('Unknown stat.');
    if (p.points <= 0) return E.fail('No stat points to spend.');
    const before = E.derived(p);
    p.stats[st.k]++;
    p.points--;
    const after = E.derived(p);
    p.hp += after.maxHp - before.maxHp;
    p.st += after.maxSt - before.maxSt;
    p.sp += after.maxSp - before.maxSp;
    E.log(s, `${st.name} increased to ${p.stats[st.k]}.`);
    return true;
  };
})();
