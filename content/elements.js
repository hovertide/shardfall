'use strict';
/* Damage types. Enemies can be `weak` or `resist` to any of these
   (see content/enemies). Discovering a weakness writes it into the journal. */
SF.define('elements', {
  phys:   { name: 'Physical', color: '#d8d8e0' },
  fire:   { name: 'Fire',     color: '#ff8a3d' },
  frost:  { name: 'Frost',    color: '#7fd8ff' },
  storm:  { name: 'Storm',    color: '#ffe066' },
  spirit: { name: 'Spirit',   color: '#d08bff' },
});
