'use strict';
/* =====================================================================
   Cosmetics from the Shrine of Echoes. r = rarity (0 Common .. 3
   Legendary), def = owned from the start. Glyphs are plain ASCII.
   ===================================================================== */
SF.define('cosmetics', {
  // --- glyphs: your marker on the map ---
  g_at:     { type: 'glyph', name: 'Classic', val: '@', r: 0, def: true },
  g_quest:  { type: 'glyph', name: 'Quester', val: 'Q', r: 0 },
  g_hour:   { type: 'glyph', name: 'Hourglass', val: '8', r: 0 },
  g_mark:   { type: 'glyph', name: 'Marked', val: 'X', r: 1 },
  g_hollow: { type: 'glyph', name: 'Hollow', val: '0', r: 1 },
  g_ward:   { type: 'glyph', name: 'Warden', val: 'G', r: 1 },
  g_riddle: { type: 'glyph', name: 'Riddle', val: '?', r: 2 },
  g_crown:  { type: 'glyph', name: 'Monarch', val: 'M', r: 2 },
  g_veil:   { type: 'glyph', name: 'Veilborn', val: 'V', r: 3 },

  // --- colors ---
  c_white:  { type: 'color', name: 'Bone White', val: '#f0f0f0', r: 0, def: true },
  c_mint:   { type: 'color', name: 'Mint', val: '#7dffb2', r: 0 },
  c_sky:    { type: 'color', name: 'Sky', val: '#7cc4ff', r: 0 },
  c_rose:   { type: 'color', name: 'Rose', val: '#ff8fb1', r: 1 },
  c_ember:  { type: 'color', name: 'Ember', val: '#ff8a3d', r: 1 },
  c_violet: { type: 'color', name: 'Voidlight', val: '#c792ea', r: 2 },
  c_gold:   { type: 'color', name: 'Sunforged', val: '#ffd23f', r: 3 },

  // --- titles ---
  t_wanderer: { type: 'title', name: 'the Wanderer', r: 0, def: true },
  t_ashborn:  { type: 'title', name: 'Ashborn', r: 0 },
  t_moss:     { type: 'title', name: 'Mossheart', r: 0 },
  t_shard:    { type: 'title', name: 'Shardbound', r: 1 },
  t_hollow:   { type: 'title', name: 'of the Hollow', r: 1 },
  t_peak:     { type: 'title', name: 'Peakwalker', r: 1 },
  t_veil:     { type: 'title', name: 'Veilwalker', r: 2 },
  t_star:     { type: 'title', name: 'the Starfallen', r: 3 },

  // --- frames: the border style of every panel ---
  f_single: { type: 'frame', name: 'Plain', val: { style: 'single', color: '#4a4a60' }, r: 0, def: true },
  f_ascii:  { type: 'frame', name: 'Retro', val: { style: 'ascii', color: '#5f8f5f' }, r: 0 },
  f_round:  { type: 'frame', name: 'Smooth', val: { style: 'rounded', color: '#5a7a90' }, r: 0 },
  f_double: { type: 'frame', name: 'Regal', val: { style: 'double', color: '#4a7ad0' }, r: 1 },
  f_heavy:  { type: 'frame', name: 'Voidforged', val: { style: 'heavy', color: '#9a5ad0' }, r: 2 },
  f_gold:   { type: 'frame', name: 'Gilded', val: { style: 'double', color: '#d8a820' }, r: 3 },
});
