'use strict';
/* =====================================================================
   Weapon sprites, shown in the side panel during combat. They point left, at the enemies.
   Pictures are plain ASCII inside String.raw`...` so backslashes don't
   need escaping: paste art straight in. Each sprite can have:
     frames  one or more pictures (cycled slowly as an idle animation)
     tint    per-character colors, e.g. { o: '#ff4040' } paints every 'o'
     bands   column ranges with their own color: [[fromCol, toCol, color]]
   The base color comes from whatever uses the sprite (e.g. enemy color).
   ===================================================================== */
SF.define('sprites', {
  wooden_sword: {   // 31 x 4
    frames: [
      String.raw`
                      _
  ____________________| |____
 <____________________| |____)o
                      |_|
`,
    ],
    bands: [[0, 22, '#c8a068'], [22, 25, '#8a6a40'], [25, 30, '#6a5030'], [30, 32, '#c8a068']],   // blade, guard, grip, pommel
  },

  stone_sword: {   // 31 x 4
    frames: [
      String.raw`
                       _
  /\_/\/\_/\__/\/\_/\_| |____
 <____________________| |____)o
  '\/  \/' \/  '\/ \/ |_|
`,
    ],
    bands: [[0, 22, '#a8a8a0'], [22, 25, '#8a7a68'], [25, 30, '#6a5a48'], [30, 32, '#a8a8a0']],   // blade, guard, grip, pommel
  },

  hand_axe: {   // 34 x 4
    frames: [
      String.raw`
  ,--.
 /   |__________________________
(    |__________________________)o
 \___|
`,
    ],
    bands: [[0, 6, '#c8ccd8'], [6, 33, '#8a6a40'], [33, 35, '#c8ccd8']],   // blade, guard, grip, pommel
  },

  steel_sword: {   // 33 x 5
    frames: [
      String.raw`
                       __
  _____________________||______
 <_____________________||______)@
  '-------------------'||
                       ''
`,
    ],
    bands: [[0, 22, '#e0e6f0'], [22, 25, '#e0b050'], [25, 31, '#5a4a6a'], [31, 33, '#ff5050']],   // blade, guard, grip, pommel
  },

  ember_blade: {   // 34 x 3
    frames: [
      String.raw`
    _,~-._,~-._,~-._,~-.  _
  <'~-~'~-~'~-~'~-~'~-~'>| |====)@
    '~-.'~-.'~-.'~-.'~-.' |_|
`,
    ],
    bands: [[0, 24, '#ff8a3d'], [24, 27, '#c04020'], [27, 32, '#5a3020'], [32, 34, '#ffd040']],   // blade, guard, grip, pommel
  },

  galecutter: {   // 32 x 4
    frames: [
      String.raw`
                          __
   ___....-----''''''''---||==oo
 <'----....______.....---'||==oo
                          ''
`,
    ],
    bands: [[0, 26, '#bfe8ff'], [26, 28, '#e0e0ff'], [28, 30, '#6a7aa0'], [30, 32, '#7fd8ff']],   // blade, guard, grip, pommel
  },
});
