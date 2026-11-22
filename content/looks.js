'use strict';
/* =====================================================================
   How map objects look (any Unicode except emoji). A map's legend entry
   can override `g` and `c` for one object. People use the glyph/color
   from content/npcs; bosses use the glyph from their enemy entry.
   ===================================================================== */
SF.set('looks', {
  shrine: { g: 'Ω', c: '#d08bff', name: '{m}Shrine of Echoes{/} {d}(spend shards){/}' },
  chest:  { g: '⊞', c: '#ffb020', name: '{y}Chest{/}' },
  stone:  { g: 'Π', c: '#7fffe0', name: '{c}Standing stone{/} {d}(it hums){/}', glow: true, spent: '#4a5a58' },
  vista:  { g: '☼', c: '#ffffff', name: '{w}Lookout{/}', glow: true, spent: '#8a8a96' },
  sign:   { g: '╤', c: '#c8a070', name: 'Signpost' },
  secret: { name: 'Cracked wall' },     // drawn as part of the wall line, dashed: ┄ ┆
  // exits: stairs get a double arrow, paths off the map edge an arrow pointing out
  go:     { up: '⇑', down: '⇓', n: '↑', e: '→', s: '↓', w: '←', c: '#5fe0e0' },
});
