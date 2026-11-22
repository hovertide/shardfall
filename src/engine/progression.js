'use strict';
/* =====================================================================
   SHARDFALL engine - progression.js
   XP, levels, quests and the bestiary journal.

   Pacing (numbers in content/rules.js):
     - 1 stat point per level; extra points come from standing stones
       hidden around the world, so exploring is how you get strong.
     - XP falls off for enemies far below your level (no farming slimes).
     - Big XP for new things: first kill of a species, new areas, lookouts.
   ===================================================================== */
(function () {
  const E = SF.E, D = E.D, R = E.R;

  E.gainXp = function (s, n, why) {
    if (!n) return;
    s.p.xp += n;
    if (why) E.log(s, `{d}+${n} XP ${why}.{/}`);
    levelCheck(s);
  };

  function levelCheck(s) {
    const p = s.p;
    while (p.xp >= E.xpNeed(p.lvl)) {
      p.xp -= E.xpNeed(p.lvl);
      p.lvl++;
      p.points += R.pointsPerLevel;
      p.shards += R.shardsPerLevel;
      const d = E.derived(p);
      p.hp = d.maxHp; p.st = d.maxSt; p.sp = d.maxSp;
      const pts = R.pointsPerLevel === 1 ? '+1 stat point' : `+${R.pointsPerLevel} stat points`;
      E.log(s, `{y}LEVEL UP! You are now level ${p.lvl}.{/} ${pts}, {m}+${R.shardsPerLevel} spirit shards{/}.`);
      for (const tbl of [D.skills, D.spells]) {
        for (const x of Object.values(tbl)) if (!x.found && x.lvl === p.lvl) E.log(s, `{c}New ability: ${x.name}{/} - ${x.desc}`);
      }
      E.fx({ t: 'level', lvl: p.lvl });
    }
  }
  E.levelCheck = levelCheck;

  /* ---------- Quests ---------- */
  E.setReady = function (s, qk) {
    const st = s.p.quests[qk], q = D.quests[qk];
    if (!st || st.s !== 'active') return;
    st.s = 'ready';
    E.log(s, `{y}Quest ready:{/} ${q.name}. Return to ${q.giver}.`);
  };

  E.countKill = function (s, map) {
    for (const [qk, q] of Object.entries(D.quests)) {
      const st = s.p.quests[qk];
      if (!q.kill || !st || st.s !== 'active' || q.kill.map !== map) continue;
      st.n++;
      if (st.n >= q.kill.n) E.setReady(s, qk);
      else E.log(s, `{d}${q.name}: ${st.n}/${q.kill.n}{/}`);
    }
  };

  E.questProgress = function (p, qk) {
    const q = D.quests[qk], st = p.quests[qk];
    if (!q || !st || !q.kill) return '';
    return `${Math.min(st.n, q.kill.n)}/${q.kill.n}`;
  };

  E.questLog = function (s) {
    return Object.entries(D.quests)
      .filter(([k]) => s.p.quests[k])
      .map(([k, q]) => ({ id: k, name: q.name, giver: q.giver, desc: q.desc, short: q.short,
        status: s.p.quests[k].s, progress: E.questProgress(s.p, k) }));
  };

  /* ---------- Journal (bestiary) ---------- */
  E.journalEntry = function (p, key) {
    p.journal = p.journal || {};
    return p.journal[key] || (p.journal[key] = { seen: 0, kills: 0, el: {} });
  };
  E.journalSee = (s, key) => { E.journalEntry(s.p, key).seen++; };

  // Where each enemy can be found (from the maps' encounter tables and bosses).
  const HABITAT = {};
  for (const [mk, m] of Object.entries(D.maps)) {
    for (const [ek] of m.enc || []) (HABITAT[ek] = HABITAT[ek] || []).push(mk);
    for (const o of Object.values(m.legend || {})) if (o.boss) (HABITAT[o.boss] = HABITAT[o.boss] || []).push(mk);
  }

  // What the journal shows. Details unlock as you fight a species more:
  //   seen   -> name, picture, description, where you met it
  //   1 kill -> level, HP, attack, defense, XP
  //   3 kills-> its moves and the gold it carries
  //   weaknesses/resistances appear as you discover them in battle
  E.journal = function (s) {
    const p = s.p, J = p.journal || {};
    return Object.entries(D.enemies).map(([k, e]) => {
      const j = J[k];
      if (!j || !j.seen) return { id: k, known: false };
      const moves = [...new Set([].concat(e.moves, e.phase2 ? e.phase2.moves : []).map(([m]) => D.moves[m].name))];
      return {
        id: k, known: true, name: e.name, sprite: e.sprite || k, color: e.color, lore: e.lore || '', boss: !!e.boss,
        seen: j.seen, kills: j.kills,
        habitat: [...new Set((HABITAT[k] || []).filter((mk) => p.visited[mk]).map((mk) => D.maps[mk].name))],
        stats: j.kills >= 1 ? { lvl: e.lvl || 1, hp: e.hp, atk: e.atk, def: e.def, xp: e.xp } : null,
        moves: j.kills >= 3 ? moves : null,
        gold: j.kills >= 3 ? e.gold : null,
        weak: Object.keys(j.el).filter((el) => j.el[el] === 'weak'),
        resist: Object.keys(j.el).filter((el) => j.el[el] === 'resist'),
      };
    });
  };

  /* ---------- Abilities list for the UI ---------- */
  E.abilities = function (s) {
    const p = s.p;
    const list = (tbl, res) => Object.entries(tbl)
      .filter(([, x]) => !x.found || E.knows(p, x))       // found abilities stay secret until learned
      .map(([id, x]) => ({
        id, name: x.name, cost: x.cost, lvl: x.lvl, desc: x.desc, res, target: x.target || 'one', el: x.el || null,
        locked: !E.knows(p, x), can: E.knows(p, x) && p[res] >= x.cost,
      }));
    return { skills: list(D.skills, 'st'), spells: list(D.spells, 'sp') };
  };
})();
