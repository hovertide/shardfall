'use strict';
/* =====================================================================
   Spells (cost spirit). Damage = (base + power * scale) where power is
   your Spirit stat plus a little per level.
     target  one | all | chain (hits one, then jumps to the rest) | summon
     anim    animation name in src/ui/fx/spells.js
   ===================================================================== */
SF.define('spells', {
  fireball: {
    name: 'Fireball', cost: 9, lvl: 1, target: 'one', base: 10, scale: 2, burnChance: 0.3, el: 'fire', anim: 'fireball',
    desc: 'Hurl fire. 30% chance to burn.', cast: 'You hurl a roaring {o}Fireball{/}!',
  },
  ice_blast: {
    name: 'Ice Blast', cost: 16, lvl: 5, target: 'all', base: 7, scale: 1.5, freeze: 2, el: 'frost', anim: 'frostwave',
    desc: 'Hit all foes, freeze 2 turns.', cast: '{c}ICE BLAST!{/} Frost erupts across the battlefield.',
  },
});
