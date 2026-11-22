'use strict';
/* =====================================================================
   Terrain. Each key is the character used when drawing maps (keep those
   plain ASCII so maps stay easy to type); `g` is what's shown on screen
   and can be any Unicode symbol EXCEPT emoji. Style: thin characters
   and symbols, not solid blocks (the U+2580-259F block shapes and filled
   squares are rejected by check.js).
     c / bg  colors              vary    random brightness per tile (texture)
     join    drawn as connected lines along its edge instead of `g`
             (map option `walls`: round, sharp, double, heavy)
     sparse  deep inside a mass of this tile (no open ground nearby), only
             this share of cells show `g`, in color `c2`; the rest are blank
     block   can't walk onto it  opaque  blocks line of sight
     danger  encounter rate multiplier   climb   stamina cost to enter
     ledge   one-way: hop down (south) over it, can't climb back
     msg     message shown when you bump into it
   Special things (people, chests, stairs, exits) are NOT tiles: each
   map places them with its own `legend`; their looks are in looks.js.
   ===================================================================== */
SF.define('tiles', {
  '#': { name: 'Stone wall', g: '#', join: true, c: '#7d7a92', vary: 0.05, block: true, opaque: true },
  '.': { name: 'Path', g: '·', c: '#74747f' },
  ',': { name: 'Grass', g: ',', c: '#3f8f4a', vary: 0.2, danger: 0.6 },
  '"': { name: 'Tall grass', g: 'ʬ', c: '#55b060', vary: 0.2, danger: 1, hint: 'beasts hide here' },
  'T': { name: 'Pine', g: '♣', c: '#2e8e4e', vary: 0.15, block: true },
  'Y': { name: 'Old tree', g: 'ϒ', c: '#8a7a4a', block: true },
  '~': { name: 'Deep water', g: '≈', c: '#4a82e6', block: true, shimmer: true, msg: 'The water runs deep and cold.' },
  'w': { name: 'Shallows', g: '∽', c: '#6a9ae0', shimmer: true, danger: 0.5 },
  '=': { name: 'Bridge', g: '═', c: '#b08850' },
  '+': { name: 'Door', g: '∩', c: '#c09060' },
  'o': { name: 'Fountain', g: '○', c: '#7fb0d0', block: true },
  '|': { name: 'Fence', g: '│', c: '#8a6a40', block: true },
  '-': { name: 'Fence', g: '─', c: '#8a6a40', block: true },
  '^': { name: 'Mountain rock', g: '∧', c: '#9a8f80', c2: '#5a544c', sparse: 0.3, vary: 0.18, block: true, opaque: true, msg: 'Sheer rock. Far too steep to climb here.' },
  ':': { name: 'Scree', g: '∴', c: '#9a9080', vary: 0.12, danger: 0.7 },
  '/': { name: 'Steep slope', g: '╱', c: '#c8a870', climb: 3, hint: 'climbing costs stamina' },
  '_': { name: 'Ledge', g: '_', c: '#d0b080', ledge: true, hint: 'hop down from above' },
  '%': { name: 'Rubble', g: '∷', c: '#6a6058', block: true },
  '0': { name: 'Pillar', g: '◎', c: '#8a8a9a', block: true, opaque: true },
  'x': { name: 'Shard crystal', g: '◆', c: '#5fe0e0', block: true, glow: true },
});
