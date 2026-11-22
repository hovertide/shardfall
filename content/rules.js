'use strict';
/* =====================================================================
   Rules: the numbers that set the pace of the whole game.
   Tweak these first when balancing.
   ===================================================================== */
SF.set('rules', {
  // --- Character growth -------------------------------------------------
  baseStat: 4,             // every stat starts here
  startPoints: 3,          // points to spend at character creation
  pointsPerLevel: 1,       // points per level-up (was 3: too fast)
  shardsPerLevel: 3,       // spirit shards per level-up (cosmetics currency)

  // XP needed to go from level L to L+1 = xpBase * L ^ xpExp
  xpBase: 28,
  xpExp: 1.55,

  // --- Anti-grind / pro-exploration ------------------------------------
  // Enemies more than `outlevelGrace` levels below you give less XP:
  // -25% per extra level, never below 10%.
  outlevelGrace: 2,
  outlevelStep: 0.25,
  outlevelMin: 0.1,
  firstKillBonus: 1.0,     // first kill of a new species: +100% XP
  discoverXp: 12,          // XP for entering a new area (multiplied by the area's tier)
  vistaXp: 20,             // XP for reaching a lookout point

  // --- Economy -----------------------------------------------------------
  startGold: 30,
  startShards: 10,
  pullCost: 10,            // shards per shrine echo
  dropChance: 0.08,        // chance an enemy drops an item
  drops: ['hp_potion', 'hp_potion', 'st_tonic', 'sp_draught'],
  deathGoldLoss: 0.25,

  // --- Starting kit --------------------------------------------------------
  start: { map: 'village', weapon: 'wooden_sword', inv: { hp_potion: 3, sp_draught: 1 } },
  maxSanity: 100,

  // --- Combat feel -----------------------------------------------------------
  // Timed strikes: how hard you hit depending on where you stop the strike bar.
  timing: { perfect: 1.35, good: 1.0, weak: 0.7, perfectCrit: 0.25 },
  // Defending: normal damage taken, damage taken vs a telegraphed heavy move,
  // and the counter-attack you get for reading it right.
  guard: { normal: 0.5, perfect: 0.2, riposte: 0.6 },
  critMult: 1.75,
  weakMult: 1.5,           // damage vs an element the enemy is weak to
  resistMult: 0.5,         // damage vs an element the enemy resists
});
