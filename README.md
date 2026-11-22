# SHARDFALL

An ASCII text RPG that runs in the browser. Double-click `index.html` to play. No install, no server.

```
node tools/check.js    # checks all content + fuzz-tests the engine (run after editing anything)
node tools/sim.js      # balance simulator: win rates and HP cost per area and boss
node tools/bundle.js   # packs everything into dist/shardfall.html (one file, for sharing)
```

---

## Folder map

```
index.html            the page (loads manifest.js, then src/boot.js loads everything else)
manifest.js           EVERY script file, in load order. Add new files here.

content/              DATA ONLY. Each file calls SF.define(kind, {...}).
  rules.js            pacing: XP curve, stat points per level, anti-grind, economy, combat feel
  stats.js            the 5 stats            elements.js   fire / frost / storm / spirit / phys
  tiles.js            terrain glyphs         regions.js    groups maps into altitude levels
  maps/<region>/      one file per map (rows + legend)
  enemies/            stats, moves, weaknesses, lore (one file per area)
  moves/              enemy moves, shared by any enemy
  weapons/            weapons (incl. strike-bar feel)
  skills/  spells/    your abilities
  items/  shops/  npcs/
  story/chapter1/     PLACEHOLDER story: quests + dialogue (swap this folder out later)
  cosmetics/          Shrine of Echoes odds + glyphs, colors, titles, frames
  sprites/            ALL ASCII ART: enemies/, weapons/, ui/ (logo, shrine)

src/registry.js       creates the global SF namespace
src/engine/           GAME RULES. No DOM, no Math.random (seeded RNG), JSON state. Server-ready.
  core.js             RNG, log, action results     validate.js   content cross-reference checks
  stats.js            derived stats                progression.js XP, levels, quests, journal
  world.js            maps, movement, ledges, slopes, secrets, stairs, fog of war, pathing
  combat.js           intents, perfect guard, timed strikes, elements, boss phases
  items.js  dialog.js  shrine.js  state.js (new/save/load)  api.js (the Engine object)

src/ui/               BROWSER ONLY. Drawing, animation, input.
  screen.js           100x34 character grid, colors, widgets, Strict ASCII mode
  sprite.js           draws sprites (tints, idle frames, dissolve)
  anim.js             replays each combat round as a timeline of animations
  fx/                 strikes.js (your attacks)  spells.js  enemy.js (enemy moves)
  scenes/             title, create, explore (map), side (character panel), combat, timing (strike bar), ...
  overlays/           inventory, character, quests, journal, outfits, help, menu

tools/                check.js, sim.js, bundle.js, load.js (loads the engine in Node)
```

Why a manifest instead of `import`: browsers block ES modules on `file://`, and keeping
"just double-click index.html" was worth one list of filenames.

---

## Recipes

### Add an enemy
1. **Stats** in `content/enemies/<area>.js`:
   ```js
   SF.define('enemies', {
     mossback: {
       name: 'Mossback', lvl: 3, hp: 60, atk: 9, def: 4, xp: 20, gold: [5, 12], color: '#6fae5a',
       moves: [['bite', 3], ['shield_up', 1]],      // weighted; one is shown as the intent each turn
       weak: ['fire'], resist: ['frost'],
       lore: 'A turtle with a garden on its back.',
     },
   });
   ```
2. **Art** in `content/sprites/enemies/<area>.js` (same id). Paste ASCII between backticks, no escaping needed:
   ```js
   SF.define('sprites', {
     mossback: {
       frames: [String.raw`
      _.--""--._
    .' ,,  ,, ,'.
   /__(o)____(o)_\
   `],
       tint: { o: '#ffd040' },     // optional: color every 'o'
     },
   });
   ```
   Keep group enemies <= 19 wide and <= 8 tall (solo/bosses: up to ~50 x 9).
3. **Put it somewhere**: add `['mossback', 3]` to a map's `enc` list.
4. Run `node tools/check.js`.

### Add an enemy move
`content/moves/*.js`. Types: `hit`, `drain`, `aoe`, `dread`, `steal`, `sap`, `guard`, `heal`, `charge`.
Add `heavy: true` and a `tell` to make it telegraphed (Defend = perfect guard + riposte).
A `charge` move winds up for one turn, then does `then: 'otherMove'` next turn.
`anim` picks the animation from `src/ui/fx/enemy.js`.

### Add a map
1. Create `content/maps/<region>/<name>.js` with literal `rows` (any size; big maps scroll).
2. Terrain characters come from `content/tiles.js`. Everything else goes in the map's `legend`:
   ```js
   legend: {
     a: { go: 'woods:a' },                   // exit: lands next to the 'a' in the woods map
     U: { go: 'ridge:D', glyph: '<' },       // stairs up (use '>' for down)
     C: { chest: { gold: [20, 40], item: 'hp_potion', weapon: 'x', learn: 'thunder' } },
     I: { stone: true },                     // standing stone: +1 stat point
     s: { secret: true },                    // cracked wall you can walk through
     E: { npc: 'maren' },   P: { sign: 'text' },   '!': { vista: 'text', reveals: ['map', ...] },
     W: { boss: 'warden', needs: { q3: 'active' } },
   }
   ```
3. Exits must lead both ways (the other map needs a marker pointing back). `check.js` verifies this,
   and that every chest, stone and exit can actually be reached.
4. For vertical areas, give maps the same `region` and a `z` (altitude), and list them top-to-bottom
   in `content/regions.js`. The side panel then shows an altitude gauge.
5. Add the file to `manifest.js`.

### Add a weapon
`content/weapons/*.js` + a sprite with the same id in `content/sprites/weapons/` (points left, at the
enemies; `bands` color blade/guard/grip by column). `timing` sets the strike bar's feel. Put it in a
shop's `stock` or in a chest.

### Add a spell + its animation
1. `content/spells/*.js`: `{ name, cost, lvl, target: 'one'|'all'|'chain'|'summon', base, scale, el, anim: 'myspell', cast, desc }`
   (use `found: true` instead of a level to make it learnable only from a chest: `chest: { learn: 'id' }`).
2. `src/ui/fx/spells.js`: add `S.myspell = { dur, impact, draw(t, ctx) { ... } }`. `t` goes 0 -> 1;
   damage lands at `impact`. `ctx.targets` are the enemies' positions, `ctx.from` is your side.

---

## Pacing (content/rules.js)
- 3 points at character creation, then **1 per level** (was 3). Levels also add a little baseline HP/damage.
- Extra stat points come from **standing stones** hidden around the world (5 so far).
- XP falls off for enemies more than 2 levels below you; first kills of a species give double XP;
  new areas and lookouts give XP. Exploring is the fast way up, grinding is the slow way.

## Controls
WASD / arrows / numpad to move (y u b n diagonals) or click a tile. Walk into things to interact.
Combat: 1-6, Tab to change target, Space to stop the strike bar or skip an animation.
I items - C character - J journal - Q quests - O outfits - ? help - Esc menu (settings: timed strikes,
fast animations, Strict ASCII).
