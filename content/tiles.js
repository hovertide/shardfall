'use strict';
/* =====================================================================
   Terrain. Each key is the character used when drawing maps.
     g       glyph shown on screen (pure ASCII)
     c / bg  colors
     block   can't walk onto it          opaque  blocks line of sight
     danger  encounter rate multiplier   climb   stamina cost to enter
     ledge   one-way: hop down (south) over it, can't climb back
     msg     message shown when you bump into it
   Special things (people, chests, stairs, exits) are NOT tiles: each
   map places them with its own `legend`.
   ===================================================================== */
SF.define('tiles', {
  '#': { name: 'Stone wall', g: '#', c: '#5e5e72', block: true, opaque: true },
  '.': { name: 'Path', g: '.', c: '#6e6e7c' },
  ',': { name: 'Grass', g: ',', c: '#3f8f4a', danger: 0.6 },
  '"': { name: 'Tall grass', g: '"', c: '#55b060', danger: 1, hint: 'beasts hide here' },
  'T': { name: 'Pine', g: 'T', c: '#2e8e4e', block: true },
  'Y': { name: 'Old tree', g: 'Y', c: '#8a7a4a', block: true },
  '~': { name: 'Deep water', g: '~', c: '#3d72d6', bg: '#0c1730', block: true, msg: 'The water runs deep and cold.' },
  'w': { name: 'Shallows', g: '~', c: '#6a9ae0', danger: 0.5 },
  '=': { name: 'Bridge', g: '=', c: '#b08850' },
  '+': { name: 'Door', g: '+', c: '#c09060' },
  'o': { name: 'Fountain', g: 'o', c: '#7fb0d0', block: true },
  '|': { name: 'Fence', g: '|', c: '#8a6a40', block: true },
  '-': { name: 'Fence', g: '-', c: '#8a6a40', block: true },
  '^': { name: 'Mountain rock', g: '^', c: '#8f8474', block: true, opaque: true, msg: 'Sheer rock. Far too steep to climb here.' },
  ':': { name: 'Scree', g: ':', c: '#9a9080', danger: 0.7 },
  '/': { name: 'Steep slope', g: '/', c: '#c8a870', climb: 3, hint: 'climbing costs stamina' },
  '_': { name: 'Ledge', g: '_', c: '#d0b080', ledge: true, hint: 'hop down from above' },
  '%': { name: 'Rubble', g: '%', c: '#6a6058', block: true },
  '0': { name: 'Pillar', g: '0', c: '#8a8a9a', block: true, opaque: true },
  'x': { name: 'Shard crystal', g: 'x', c: '#5fe0e0', block: true, glow: true },
});
