'use strict';
/* =====================================================================
   Inventory icons (3 x 2). Items and weapons use the sprite named
   icon_<id> unless they set `icon: 'someSprite'`. Any Unicode but emoji.
     color  the icon's base color      tint  per-character colors
   ===================================================================== */
SF.define('sprites', {
  // ---- potions and consumables ----
  icon_hp_potion:  { frames: [String.raw`
╭┴╮
╰♥╯
`], color: '#b8c4d8', tint: { '♥': '#ff4f5f' } },
  icon_st_tonic:   { frames: [String.raw`
╭┴╮
╰≈╯
`], color: '#b8c4d8', tint: { '≈': '#7ddc6f' } },
  icon_sp_draught: { frames: [String.raw`
╭┴╮
╰◆╯
`], color: '#b8c4d8', tint: { '◆': '#5ca8ff' } },
  icon_calm_tea:   { frames: [String.raw`
 ≀≀
╘═╛
`], color: '#c8a070', tint: { '≀': '#9a9aaa' } },
  icon_antidote:   { frames: [String.raw`
╭┴╮
╰+╯
`], color: '#b8c4d8', tint: { '+': '#a8e050' } },
  icon_smoke_bomb: { frames: [String.raw`
 ∿
(●)
`], color: '#8a8a9a', tint: { '∿': '#c8c8d0', '●': '#5a5a6a' } },

  // ---- weapons ----
  icon_wooden_sword: { frames: [String.raw`
  ╱
 ╳
`], color: '#c8a068', tint: { '╳': '#8a6a40' } },
  icon_stone_sword:  { frames: [String.raw`
  ╱
 ╳
`], color: '#a8a8a0', tint: { '╳': '#7a6a58' } },
  icon_steel_sword:  { frames: [String.raw`
  ╱
 ╳
`], color: '#e0e6f0', tint: { '╳': '#e0b050' } },
  icon_ember_blade:  { frames: [String.raw`
˙ ╱
 ╳˙
`], color: '#ff8a3d', tint: { '╳': '#c04020', '˙': '#ffd040' } },
  icon_galecutter:   { frames: [String.raw`
~ ╱
 ╳
`], color: '#bfe8ff', tint: { '╳': '#7fd8ff', '~': '#7fd8ff' } },
  icon_hand_axe:     { frames: [String.raw`
▐▀╱
 ╱
`], color: '#8a6a40', tint: { '▐': '#c8ccd8', '▀': '#c8ccd8' } },
});
