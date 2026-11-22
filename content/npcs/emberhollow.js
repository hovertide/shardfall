'use strict';
/* People and talkable things. Place them on a map with a legend entry
   like  E: { npc: 'maren' }.  `dialog` -> content/story, `shop` -> content/shops. */
SF.define('npcs', {
  maren:  { name: 'Elder Maren', glyph: '&', color: '#ffd866', dialog: 'elder' },
  bram:   { name: 'Bram the merchant', glyph: '&', color: '#ffb020', shop: 'bram' },
  tobba:  { name: 'Tobba the innkeeper', glyph: '&', color: '#ff9a4a', dialog: 'inn' },
});
