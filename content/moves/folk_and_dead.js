'use strict';
/* Enemy moves for goblins, trolls, the undead and the Veil Warden. */
SF.define('moves', {
  // --- goblins & trolls ---
  stab:          { name: 'Stab', type: 'hit', mult: 1, anim: 'slash' },
  pilfer:        { name: 'Pilfer', type: 'steal', amt: [4, 10], anim: 'steal' },
  shield_up:     { name: 'Shield Up', type: 'guard', tell: 'ducks behind a dented shield', anim: 'guard' },
  bash:          { name: 'Club', type: 'hit', mult: 1, anim: 'smash' },
  raise_club:    { name: 'Raise Club', type: 'charge', then: 'boulder_smash', tell: 'hoists its club high overhead', anim: 'charge' },
  boulder_smash: { name: 'Boulder Smash', type: 'hit', mult: 2.2, heavy: true, anim: 'smash' },
  regenerate:    { name: 'Regenerate', type: 'heal', pct: 0.12, anim: 'heal' },

  // --- undead ---
  rattle_slash:  { name: 'Rusty Slash', type: 'hit', mult: 1, anim: 'slash' },
  bone_rattle:   { name: 'Bone Rattle', type: 'dread', amt: 8, anim: 'dread' },
  bone_wall:     { name: 'Bone Wall', type: 'guard', tell: 'locks its ribs into a shield', anim: 'guard' },
  grave_touch:   { name: 'Grave Touch', type: 'hit', mult: 1, anim: 'drain' },
  wail:          { name: 'Wail', type: 'dread', amt: 12, anim: 'dread' },
  soul_siphon:   { name: 'Soul Siphon', type: 'sap', amt: 10, anim: 'sap' },
  whisper:       { name: 'Whisper', type: 'dread', amt: 10, anim: 'dread' },
  shadow_claw:   { name: 'Shadow Claw', type: 'hit', mult: 1, anim: 'claw' },
  frost_touch:   { name: 'Frost Touch', type: 'hit', mult: 1, anim: 'drain' },
  knight_slash:  { name: 'Black Blade', type: 'hit', mult: 1, anim: 'slash' },
  cleave:        { name: 'Cleave', type: 'aoe', mult: 1.5, heavy: true, tell: 'draws its greatsword back for a wide arc', anim: 'slash' },
  iron_guard:    { name: 'Iron Guard', type: 'guard', tell: 'braces behind its tower shield', anim: 'guard' },

  // --- the Veil Warden ---
  rend:          { name: 'Rend', type: 'hit', mult: 1, anim: 'claw' },
  veil_rend:     { name: 'Veil Rend', type: 'aoe', mult: 1.6, heavy: true, tell: 'tears at the air itself', anim: 'slash' },
  void_whispers: { name: 'Whispers of the Void', type: 'dread', amt: 16, anim: 'dread' },
  devour_light:  { name: 'Devour Light', type: 'drain', mult: 1.2, anim: 'drain' },
  gather_dark:   { name: 'Gather the Dark', type: 'charge', then: 'void_collapse', tell: 'draws every shadow in the hall into its hands', anim: 'charge' },
  void_collapse: { name: 'Void Collapse', type: 'aoe', mult: 2.4, heavy: true, anim: 'smash' },
});
