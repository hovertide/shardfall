'use strict';
/* Enemies of Ashpeak, from the foothills to the summit. */
SF.define('enemies', {
  ramhorn: {
    name: 'Ramhorn', lvl: 3, hp: 66, atk: 10, def: 3, xp: 18, gold: [5, 10], color: '#c8b090',
    moves: [['headbutt', 3], ['lower_horns', 1]],
    lore: 'A mountain ram the size of a cart. When it paws the ground, the next blow is a big one.',
  },
  viper: {
    name: 'Cliff Viper', lvl: 3, hp: 40, atk: 9, def: 1, xp: 15, gold: [3, 9], color: '#9fcf3f',
    moves: [['fang', 2], ['venom_bite', 2]], weak: ['frost'],
    lore: 'Suns itself on warm rocks. Cold slows it; poison is its whole plan.',
  },
  harpy: {
    name: 'Gale Harpy', lvl: 4, hp: 56, atk: 11, def: 2, xp: 22, gold: [8, 14], color: '#d8a0c8',
    moves: [['claw', 3], ['flurry', 2], ['shriek', 1]], weak: ['fire'], resist: ['storm'],
    lore: 'Rides the updrafts on the switchbacks. Its shriek rattles the mind.',
  },
  wisp: {
    name: 'Rime Wisp', lvl: 5, hp: 58, atk: 12, def: 0, xp: 26, gold: [6, 14], color: '#bfe8ff',
    moves: [['frost_touch', 3], ['soul_siphon', 2]], weak: ['fire'], resist: ['phys', 'frost'],
    lore: 'A drifting cold flame. Blades pass half through it. Fire does not.',
  },
  frostfang: {
    name: 'Frostfang', lvl: 6, hp: 86, atk: 15, def: 3, xp: 32, gold: [10, 18], color: '#e0f0ff',
    moves: [['frost_bite', 3], ['savage_bite', 1], ['howl', 1]], weak: ['fire'], resist: ['frost'],
    lore: 'A white wolf of the high ridge. Its howl carries the blizzard.',
  },
  stormcrow: {
    name: 'The Stormcrow', lvl: 7, hp: 320, atk: 19, def: 5, xp: 120, gold: [60, 80], color: '#7fb4ff',
    boss: true, solo: true, glyph: 'V',
    moves: [['talon', 3], ['gale', 2], ['soar', 1], ['thunderclap', 1]], weak: ['frost'], resist: ['storm'],
    intro: '{b}Thunder rolls. A shadow blots out the sun: THE STORMCROW DIVES!{/}',
    onDefeat: { flag: 'stormcrow', text: '{b}The Stormcrow crashes into the snow and breaks apart into wind and feathers. The way to the peak is open.{/}' },
    lore: 'A crow grown monstrous on the storm-shards that strike the summit. It guards the peak jealously.',
  },
});
