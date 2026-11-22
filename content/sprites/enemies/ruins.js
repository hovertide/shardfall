'use strict';
/* =====================================================================
   Enemy sprites: Sunken Ruins and the Veil Warden.
   Pictures are plain ASCII inside String.raw`...` so backslashes don't
   need escaping: paste art straight in. Each sprite can have:
     frames  one or more pictures (cycled slowly as an idle animation)
     tint    per-character colors, e.g. { o: '#ff4040' } paints every 'o'
     bands   column ranges with their own color: [[fromCol, toCol, color]]
   The base color comes from whatever uses the sprite (e.g. enemy color).
   ===================================================================== */
SF.define('sprites', {
  wraith: {   // 17 x 8
    frames: [
      String.raw`
       .--.
     .'    '.
    /  .--.  \
   |  / xx \  |
   |  \ ~~ /  |
   /\  '--'  /\
  /  \/|  |\/  \
 '~~  ~~~~~~  ~~'
`,
      String.raw`
       .--.
     .'    '.
    /  .--.  \
   |  / xx \  |
   |  \ ~~ /  |
  /\   '--'   /\
 /  \/ |  | \/  \
  ~~' ~~~~~~ '~~
`,
    ],
    tint: { x: '#ff5060', '~': '#6070a0' },
  },

  knight: {   // 19 x 8
    frames: [
      String.raw`
       ,-^-.
      /_____\    /|
      |=[o]=|   / /
      \_____/  / /
   .--'====='-/ /
  /  /|  #  |\_/
 |__| |_____| |
     /_/   \_\
`,
      String.raw`
       ,-^-.
      /_____\
      |=[o]=|  ____
      \_____/ |___/
   .--'====='-//
  /  /|  #  |\/
 |__| |_____| |
     /_/   \_\
`,
    ],
    tint: { o: '#ff3030', '#': '#e0b050' },
  },

  shade: {   // 17 x 7
    frames: [
      String.raw`
    .:;%%%%;:.
  .;%%######%%;.
 :%###(o)(o)###%:
 ;%############%;
  ':;%%####%%;:'
    ':;%%%%;:'
      ':;;:'
`,
      String.raw`
     .:;%%%;:.
  .:;%%#####%%;.
 ;%##(o)(o)####%:
 :%############%;
  ';%%%####%%;:'
    ':;;%%%;:'
       ':;:'
`,
    ],
    tint: { o: '#ff4040', '#': '#3a3050', '%': '#5a4a78', ';': '#7a6a98', ':': '#9a8ab8', '.': '#9a8ab8', "'": '#9a8ab8' },
  },

  warden: {   // 43 x 9
    frames: [
      String.raw`
          _      .-\/\  /\/\  /\/-.      _
         ( \    /    \/    \/    \      / )
          \ \  /   @     @     @   \   / /
           \ \|  @    .------.   @  | / /
            \ |      / @    @ \     | /
             \|     |   ____   |    |/
              \      \ '----' /     /
               '-._   '------'   _.-'
                   '-.________.-'
`,
      String.raw`
          _      .-\/\  /\/\  /\/-.      _
         ( \    /    \/    \/    \      / )
          \ \  /   -     @     -   \   / /
           \ \|  @    .------.   @  | / /
            \ |      / -    - \     | /
             \|     |   ____   |    |/
              \      \ '----' /     /
               '-._   '------'   _.-'
                   '-.________.-'
`,
    ],
    tint: { '@': '#ffe066', '-': '#ff5577' },
  },
});
