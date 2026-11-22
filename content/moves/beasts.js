'use strict';
/* =====================================================================
   Enemy moves, shared by any enemy that lists them.
     type   hit | drain (hit + heal) | aoe (you + hound) | dread (sanity)
            steal (gold) | sap (spirit) | guard | heal | charge
     mult   damage x enemy attack       hits   strikes in a row
     heavy  telegraphed: DEFEND for a perfect guard + riposte
     charge winds up this turn, unleashes `then` next turn
     poison [turns, damage per turn]    tell   what you see it doing
     anim   animation in src/ui/fx/enemy.js
   ===================================================================== */
SF.define('moves', {
  strike:      { name: 'Strike', type: 'hit', mult: 1, anim: 'bump' },

  // --- slimes & small things ---
  tackle:      { name: 'Tackle', type: 'hit', mult: 1, anim: 'bump' },
  engulf:      { name: 'Engulf', type: 'hit', mult: 1.6, heavy: true, tell: 'swells up, quivering', anim: 'smash' },

  // --- wolves ---
  bite:        { name: 'Bite', type: 'hit', mult: 1, anim: 'bite' },
  savage_bite: { name: 'Savage Bite', type: 'hit', mult: 1.7, heavy: true, tell: 'crouches low, fangs bared', anim: 'bite' },

  // --- bats ---
  leech:       { name: 'Leech', type: 'drain', mult: 0.9, anim: 'drain' },

  // --- mountain beasts ---
  headbutt:    { name: 'Headbutt', type: 'hit', mult: 1, anim: 'bump' },
  lower_horns: { name: 'Lower Horns', type: 'charge', then: 'ram', tell: 'paws the ground and lowers its horns', anim: 'charge' },
  ram:         { name: 'Ram', type: 'hit', mult: 2.1, heavy: true, anim: 'smash' },
  fang:        { name: 'Fang', type: 'hit', mult: 1, anim: 'bite' },
  venom_bite:  { name: 'Venom Bite', type: 'hit', mult: 0.8, poison: [3, 3], anim: 'poison' },
  claw:        { name: 'Claw', type: 'hit', mult: 1, anim: 'claw' },
  flurry:      { name: 'Feather Flurry', type: 'hit', mult: 0.45, hits: 3, anim: 'claw' },
  shriek:      { name: 'Shriek', type: 'dread', amt: 6, anim: 'dread' },
  frost_bite:  { name: 'Frost Bite', type: 'hit', mult: 1.1, anim: 'bite' },
  howl:        { name: 'Blizzard Howl', type: 'dread', amt: 7, anim: 'dread' },
  crystal_bite:{ name: 'Crystal Bite', type: 'hit', mult: 0.9, poison: [3, 4], anim: 'poison' },
  web_spit:    { name: 'Shard Spit', type: 'sap', amt: 8, anim: 'sap' },

  // --- the Stormcrow ---
  talon:       { name: 'Talon Rake', type: 'hit', mult: 1, anim: 'claw' },
  gale:        { name: 'Gale', type: 'aoe', mult: 1.1, anim: 'gust' },
  soar:        { name: 'Soar', type: 'charge', then: 'dive_bomb', tell: 'beats its wings and vanishes into the clouds', anim: 'charge' },
  dive_bomb:   { name: 'Dive Bomb', type: 'hit', mult: 2.4, heavy: true, anim: 'smash' },
  thunderclap: { name: 'Thunderclap', type: 'dread', amt: 10, anim: 'bolt' },
});
