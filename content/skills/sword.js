'use strict';
/* =====================================================================
   Sword skills (cost stamina). They use the strike bar too.
     lvl     level they unlock at        found  learned from a manual instead
     hits    strikes in a row            mult   damage per strike
     target  'one' (default) or 'all'    burn   turns of burning on the last target
     anim    animation (src/ui/fx)       el     element override
   ===================================================================== */
SF.define('skills', {
  double_slash:  { name: 'Double Slash', cost: 8, lvl: 1, hits: 2, mult: 0.75, anim: 'slash2', desc: 'Slash twice.' },
  triple_slash:  { name: 'Triple Slash', cost: 14, lvl: 4, hits: 3, mult: 0.7, anim: 'slash3', desc: 'Slash three times.' },
  flaming_slash: { name: 'Flaming Slash', cost: 12, lvl: 6, hits: 1, mult: 1.1, burn: 3, el: 'fire', anim: 'flameslash', desc: 'A fire strike that burns for 3 turns.' },
  whirlwind:     { name: 'Whirlwind', cost: 16, lvl: 1, found: true, target: 'all', mult: 0.8, anim: 'whirl', desc: 'Spin and strike every foe.' },
});
