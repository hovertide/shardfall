'use strict';
/* =====================================================================
   Interface art: the title logo and the Shrine of Echoes.
   Pictures are plain ASCII inside String.raw`...` so backslashes don't
   need escaping: paste art straight in. Each sprite can have:
     frames  one or more pictures (cycled slowly as an idle animation)
     tint    per-character colors, e.g. { o: '#ff4040' } paints every 'o'
     bands   column ranges with their own color: [[fromCol, toCol, color]]
   The base color comes from whatever uses the sprite (e.g. enemy color).
   ===================================================================== */
SF.define('sprites', {
  logo: {   // 72 x 6  (figlet font "ANSI Shadow")
    frames: [
      String.raw`
███████╗██╗  ██╗ █████╗ ██████╗ ██████╗ ███████╗ █████╗ ██╗     ██╗
██╔════╝██║  ██║██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔══██╗██║     ██║
███████╗███████║███████║██████╔╝██║  ██║█████╗  ███████║██║     ██║
╚════██║██╔══██║██╔══██║██╔══██╗██║  ██║██╔══╝  ██╔══██║██║     ██║
███████║██║  ██║██║  ██║██║  ██║██████╔╝██║     ██║  ██║███████╗███████╗
╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝
`,
    ],
    rows: ['#5fe0e0', '#72d2f2', '#86c2ff', '#a4adff', '#c096ff', '#d08bff'],   // one color per line, top to bottom
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
