'use strict';
/* =====================================================================
   Enemies. Their pictures live in content/sprites/enemies.
     lvl       used for XP falloff (no farming far-weaker foes)
     moves     [moveId, weight] pairs; each round one is picked as the intent
     weak / resist   element lists (see content/elements.js)
     solo      never appears in a group
     lore      journal text
   ===================================================================== */
SF.define('enemies', {
  // ---------------- Whispering Woods (Lv 1-3) ----------------
  slime: {
    name: 'Slime', lvl: 1, hp: 36, atk: 6, def: 0, xp: 8, gold: [3, 7], color: '#5fdd80',
    moves: [['tackle', 4], ['engulf', 1]], weak: ['fire'],
    lore: 'Tree-sap that drank a falling shard and woke up hungry. It remembers being a forest, a little.',
  },
  wolf: {
    name: 'Tainted Wolf', lvl: 2, hp: 46, atk: 8, def: 1, xp: 12, gold: [4, 9], color: '#9aa0b0',
    moves: [['bite', 4], ['savage_bite', 1]], weak: ['fire'],
    lore: 'Its eyes glow with stolen shard-light. When it crouches low, it is about to lunge: raise your guard.',
  },
  goblin: {
    name: 'Goblin', lvl: 2, hp: 54, atk: 9, def: 2, xp: 15, gold: [8, 15], color: '#8fcf4f',
    moves: [['stab', 4], ['pilfer', 1], ['shield_up', 1]],
    lore: 'A scavenger with quick fingers. Anything it steals from you comes back when it dies.',
  },

  // ---------------- Hollow Cave (Lv 3-5) ----------------
  bat: {
    name: 'Cave Bat', lvl: 3, hp: 42, atk: 10, def: 1, xp: 14, gold: [3, 8], color: '#a07cd0',
    moves: [['bite', 3], ['leech', 2]], weak: ['storm'],
    lore: 'Hunts by the hum of the shards. Drinks blood to heal itself.',
  },
  skeleton: {
    name: 'Skeleton', lvl: 4, hp: 78, atk: 12, def: 4, xp: 22, gold: [10, 18], color: '#e8e8d8',
    moves: [['rattle_slash', 4], ['bone_rattle', 1], ['bone_wall', 1]], weak: ['spirit'], resist: ['frost'],
    lore: 'Old miners who never left the Hollow. The rattle of their bones gets inside your head.',
  },
  troll: {
    name: 'Cave Troll', lvl: 5, hp: 170, atk: 17, def: 5, xp: 50, gold: [25, 40], color: '#8a9a5b', solo: true,
    moves: [['bash', 3], ['raise_club', 1], ['regenerate', 1]], weak: ['fire'],
    lore: 'Slow, huge, and it heals. When it raises its club, defend and make it pay.',
  },

  // ---------------- Hollow Depths (Lv 4-6) ----------------
  crawler: {
    name: 'Shard Crawler', lvl: 5, hp: 70, atk: 12, def: 3, xp: 26, gold: [8, 16], color: '#5fe0e0',
    moves: [['bite', 2], ['crystal_bite', 2], ['web_spit', 1]], weak: ['storm'], resist: ['frost'],
    lore: 'A spider grown around a shard. Its crystal fangs carry a poison that lingers.',
  },
});
