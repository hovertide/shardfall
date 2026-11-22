'use strict';
/* Enemies of the Sunken Ruins, and the Veil Warden. */
SF.define('enemies', {
  wraith: {
    name: 'Wraith', lvl: 6, hp: 96, atk: 15, def: 3, xp: 36, gold: [15, 25], color: '#9fb4ff',
    moves: [['grave_touch', 3], ['wail', 2]], weak: ['fire'], resist: ['phys'],
    lore: 'A drowned soul that remembers the ruins when they were dry. Steel barely touches it.',
  },
  knight: {
    name: 'Fallen Knight', lvl: 7, hp: 150, atk: 19, def: 8, xp: 55, gold: [25, 40], color: '#c06060',
    moves: [['knight_slash', 3], ['cleave', 1], ['iron_guard', 1]], weak: ['storm'],
    lore: 'Its armor is so thick that only spells and lightning really hurt. Lightning loves that much iron.',
  },
  shade: {
    name: 'Shade', lvl: 7, hp: 90, atk: 17, def: 2, xp: 40, gold: [15, 28], color: '#8a7ab0',
    moves: [['shadow_claw', 2], ['soul_siphon', 2], ['whisper', 1]], weak: ['spirit'], resist: ['phys'],
    lore: 'A hole in the world shaped like a person. Spirit magic unravels it.',
  },
  warden: {
    name: 'The Veil Warden', lvl: 9, hp: 700, atk: 26, def: 8, xp: 300, gold: [200, 200], color: '#ff5577',
    boss: true, solo: true, glyph: 'Ψ',
    moves: [['rend', 3], ['veil_rend', 1], ['void_whispers', 1], ['devour_light', 1]],
    phase2: { at: 0.5, text: '{r}The Warden screams. The crack in the sky widens and its eyes multiply!{/}',
      moves: [['rend', 2], ['veil_rend', 1], ['void_whispers', 1], ['devour_light', 1], ['gather_dark', 1]] },
    weak: ['spirit'], resist: ['frost'],
    intro: '{r}The black water churns. THE VEIL WARDEN RISES!{/}',
    onDefeat: { ready: 'q3', text: '{y}The Warden sinks into the black water. Overhead, the crack in the sky begins to close.{/}' },
    lore: 'The thing that holds the crack in the sky open. When it gathers the dark, brace yourself.',
  },
});
