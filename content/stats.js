'use strict';
/* The five character stats. The math behind them is in src/engine/stats.js. */
SF.set('stats', [
  { k: 'vit', name: 'Vitality', short: 'VIT', color: '#ff6b6b', desc: 'Max HP, damage resistance, regeneration, potion strength.' },
  { k: 'str', name: 'Strength', short: 'STR', color: '#ffb347', desc: 'Weapon damage, critical hits, dodge, escaping.' },
  { k: 'sta', name: 'Stamina', short: 'STA', color: '#7ddc6f', desc: 'Stamina for sword skills, and for climbing steep slopes.' },
  { k: 'spi', name: 'Spirit', short: 'SPI', color: '#6fb7ff', desc: 'Spirit pool, spell damage, hound strength.' },
  { k: 'wil', name: 'Willpower', short: 'WIL', color: '#c792ea', desc: 'Fight below 0 HP, fury when hurt, resist sanity loss.' },
]);
