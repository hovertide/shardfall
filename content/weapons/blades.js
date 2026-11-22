'use strict';
/* =====================================================================
   Weapons. Shop ones are listed in content/shops; the best ones are
   found in chests out in the world.
     min/max  base damage            crit   +% crit chance
     el       damage element (default phys)
     burn     chance per hit to set the target ablaze
     perfectHit  a perfect strike adds a second cut at this multiplier
     timing   the strike bar's feel:
              sweep = ms for the marker to cross the bar (lower = faster)
              good / perfect = width of the zones (0..1 of the bar)
     sprite   art in content/sprites/weapons (defaults to the id)
   ===================================================================== */
SF.define('weapons', {
  wooden_sword: {
    name: 'Wooden Sword', min: 4, max: 7, crit: 0, price: 0,
    timing: { sweep: 900, good: 0.40, perfect: 0.12 },
    desc: 'Dmg 4-7. Splinters included.',
  },
  stone_sword: {
    name: 'Stone Sword', min: 7, max: 11, crit: 2, price: 60,
    timing: { sweep: 950, good: 0.36, perfect: 0.10 },
    desc: 'Dmg 7-11, +2% crit. Crude, heavy.',
  },
  hand_axe: {
    name: 'Hand Axe', min: 6, max: 15, crit: 8, price: 110,
    timing: { sweep: 1150, good: 0.26, perfect: 0.07 },
    desc: 'Dmg 6-15, +8% crit. Slow swing, narrow sweet spot, brutal when it lands.',
  },
  steel_sword: {
    name: 'Steel Sword', min: 12, max: 18, crit: 4, price: 180,
    timing: { sweep: 850, good: 0.38, perfect: 0.11 },
    desc: 'Dmg 12-18, +4% crit. Sharp, true.',
  },
  ember_blade: {
    name: 'Ember Blade', min: 11, max: 16, crit: 3, price: 0, el: 'fire', burn: 0.2,
    timing: { sweep: 850, good: 0.38, perfect: 0.11 },
    desc: 'Dmg 11-16, fire. 20% chance to burn. Found in the Hollow Depths.',
  },
  galecutter: {
    name: 'Galecutter', min: 12, max: 17, crit: 10, price: 0, perfectHit: 0.6,
    timing: { sweep: 650, good: 0.42, perfect: 0.16 },
    desc: 'Dmg 12-17, +10% crit. Fast. A perfect strike cuts twice. Found on Ashpeak.',
  },
});
