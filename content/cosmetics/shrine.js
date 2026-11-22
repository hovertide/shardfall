'use strict';
/* Shrine of Echoes odds. Cosmetics themselves are in the other files here. */
SF.set('rarity', [
  { name: 'Common', color: '#b8b8c0', weight: 62 },
  { name: 'Rare', color: '#4aa8ff', weight: 27 },
  { name: 'Epic', color: '#c06cff', weight: 9 },
  { name: 'Legendary', color: '#ffb020', weight: 2 },
]);
// Guaranteed Epic+ every 10 echoes, Legendary by 40. Duplicates refund shards by rarity.
SF.set('pity', { epic: 10, legendary: 40, dupeRefund: [2, 4, 8, 20] });
