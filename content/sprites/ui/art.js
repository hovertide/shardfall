'use strict';
/* =====================================================================
   Interface art: the title logo and the Shrine of Echoes.
   Pictures go inside String.raw`...` so backslashes don't
   need escaping: paste art straight in. Each sprite can have:
     frames  one or more pictures (cycled slowly as an idle animation)
     tint    per-character colors, e.g. { o: '#ff4040' } paints every 'o'
     bands   column ranges with their own color: [[fromCol, toCol, color]]
   The base color comes from whatever uses the sprite (e.g. enemy color).
   ===================================================================== */
SF.define('sprites', {
  logo: {   // 95 x 5  (figlet font "Sub-Zero")
    frames: [
      String.raw`
 ______     __  __     ______     ______     _____     ______   ______     __         __
/\  ___\   /\ \_\ \   /\  __ \   /\  == \   /\  __-.  /\  ___\ /\  __ \   /\ \       /\ \
\ \___  \  \ \  __ \  \ \  __ \  \ \  __<   \ \ \/\ \ \ \  __\ \ \  __ \  \ \ \____  \ \ \____
 \/\_____\  \ \_\ \_\  \ \_\ \_\  \ \_\ \_\  \ \____-  \ \_\    \ \_\ \_\  \ \_____\  \ \_____\
  \/_____/   \/_/\/_/   \/_/\/_/   \/_/ /_/   \/____/   \/_/     \/_/\/_/   \/_____/   \/_____/
`,
    ],
    rows: ['#5fe0e0', '#7ccff5', '#9cbcff', '#bca2ff', '#d08bff'],   // one color per line, top to bottom
    shade: { '\\': 0.3, '/': 0.3 },   // these characters are drawn darker: the letters' sides
  },

  shrine: {   // 14 x 7
    frames: [
      String.raw`
     _/\_
   _/ __ \_
  |  /  \  |
  |  \__/  |
  |   ||   |
 _|___||___|_
/____________\
`,
    ],
    tint: { '_': '#9a6ac0' },
  },
});
