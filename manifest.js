'use strict';
/* =====================================================================
   SHARDFALL - manifest.js
   Every script file, in load order. ADD NEW FILES HERE.
   (Browsers can't list folders on file://, so the game needs this list.)

   Order matters only between groups:
     content -> engine -> ui
   Inside `content`, files can go in any order.
   ===================================================================== */
var SHARDFALL_MANIFEST = {
  // Pure data. Each file calls SF.define(kind, {...}) or SF.set(name, value).
  content: [
    'content/rules.js',
    'content/stats.js',
    'content/elements.js',
    'content/tiles.js',
    'content/regions.js',

    'content/maps/emberhollow/village.js',
    'content/maps/whispering-woods/woods.js',
    'content/maps/hollow-cave/cave.js',
    'content/maps/hollow-cave/depths.js',
    'content/maps/ashpeak/foothills.js',
    'content/maps/ashpeak/switchbacks.js',
    'content/maps/ashpeak/ridge.js',
    'content/maps/ashpeak/summit.js',
    'content/maps/sunken-ruins/ruins.js',

    'content/moves/beasts.js',
    'content/moves/folk_and_dead.js',
    'content/enemies/woods_and_cave.js',
    'content/enemies/ashpeak.js',
    'content/enemies/ruins.js',

    'content/weapons/blades.js',
    'content/skills/sword.js',
    'content/spells/fire_and_frost.js',
    'content/spells/spirit_and_storm.js',
    'content/items/consumables.js',
    'content/shops/bram.js',

    'content/npcs/emberhollow.js',
    'content/npcs/wilds.js',
    'content/story/chapter1/quests.js',
    'content/story/chapter1/elder.js',
    'content/story/chapter1/others.js',

    'content/cosmetics/shrine.js',
    'content/cosmetics/looks.js',

    'content/sprites/enemies/woods_and_cave.js',
    'content/sprites/enemies/ashpeak.js',
    'content/sprites/enemies/ruins.js',
    'content/sprites/weapons/blades.js',
    'content/sprites/ui/art.js',
  ],

  // Game rules. No DOM, no randomness outside the seeded RNG. api.js must be last.
  engine: [
    'src/engine/core.js',
    'src/engine/validate.js',
    'src/engine/stats.js',
    'src/engine/progression.js',
    'src/engine/world.js',
    'src/engine/combat.js',
    'src/engine/items.js',
    'src/engine/dialog.js',
    'src/engine/shrine.js',
    'src/engine/state.js',
    'src/engine/api.js',
  ],

  // Browser only: drawing, animation, input. main.js must be last.
  ui: [
    'src/ui/screen.js',
    'src/ui/sprite.js',
    'src/ui/state.js',
    'src/ui/anim.js',
    'src/ui/fx/strikes.js',
    'src/ui/fx/spells.js',
    'src/ui/fx/enemy.js',
    'src/ui/scenes/title.js',
    'src/ui/scenes/create.js',
    'src/ui/scenes/explore.js',
    'src/ui/scenes/side.js',
    'src/ui/scenes/log.js',
    'src/ui/scenes/combat.js',
    'src/ui/scenes/timing.js',
    'src/ui/scenes/dialog.js',
    'src/ui/scenes/shop.js',
    'src/ui/scenes/shrine.js',
    'src/ui/scenes/gameover.js',
    'src/ui/overlays/inventory.js',
    'src/ui/overlays/character.js',
    'src/ui/overlays/quests.js',
    'src/ui/overlays/journal.js',
    'src/ui/overlays/outfits.js',
    'src/ui/overlays/help.js',
    'src/ui/overlays/menu.js',
    'src/ui/input.js',
    'src/ui/main.js',
  ],
};

if (typeof module !== 'undefined') module.exports = { SHARDFALL_MANIFEST };
