'use strict';
/* =====================================================================
   Enemy sprites: Whispering Woods, Hollow Cave and the Depths.
   Pictures are plain ASCII inside String.raw`...` so backslashes don't
   need escaping: paste art straight in. Each sprite can have:
     frames  one or more pictures (cycled slowly as an idle animation)
     tint    per-character colors, e.g. { o: '#ff4040' } paints every 'o'
     bands   column ranges with their own color: [[fromCol, toCol, color]]
   The base color comes from whatever uses the sprite (e.g. enemy color).
   ===================================================================== */
SF.define('sprites', {
  slime: {   // 18 x 6
    frames: [
      String.raw`
      .-~~-.
    .'      '.
   /  (o)(o)  \
  |    .--.    |
   \   '--'   /
 ~~~'-.____.-'~~~
`,
      String.raw`

     .-~~~~-.
   .' (o)(o) '.
  |    .--.    |
  \    '--'    /
~~~'--.____.--'~~~
`,
    ],
    tint: { o: '#ffffff', '~': '#2f9e50' },
  },

  wolf: {   // 18 x 8
    frames: [
      String.raw`
   /\         /\
  /  \_______/  \
 |   _       _   |
 |  (O)     (O)  |
  \      ^      /
   \   _/ \_   /
    \  VVVVV  /
     '._____.'
`,
      String.raw`
   /\         /\
  /  \_______/  \
 |   _       _   |
 |  (O)     (O)  |
  \      ^      /
   \   /'''\   /
    \ (VVVVV) /
     '._____.'
`,
    ],
    tint: { O: '#ff5040', V: '#ffffff' },
  },

  goblin: {   // 19 x 8
    frames: [
      String.raw`
 _               _
 \'-.   ____   .-'/
  '. './ _  _\.' .'
    '-|(o)(o)|-'
      |  ''  |   /|
       \ ^^ /   / |
    .--'----'--/ /
   /  /|____|\  /
`,
      String.raw`
 _               _
 \'-.   ____   .-'/
  '. './ _  _\.' .'
    '-|(o)(o)|-' /|
      |  ''  |  / |
       \ ^^ /  / /
    .--'----'--./
   /  /|____|\
`,
    ],
    tint: { o: '#ffd040' },
  },

  bat: {   // 18 x 5
    frames: [
      String.raw`
/\              /\
\ '.   .--.   .' /
 \  '-( oo )-'  /
  \/\/ '--' \/\/
        \/
`,
      String.raw`

       .--.
 ___.-( oo )-.___
/ /\/\ '--' /\/\ \
\/    \ \/ /    \/
`,
    ],
    tint: { o: '#ff4060' },
  },

  skeleton: {   // 16 x 8
    frames: [
      String.raw`
      .----.
     / _  _ \
     |(_)(_)|
      \ /\ /
       |##|
   .--=+==+=--.
  /  |=|==|=|  \
     |_|  |_|
`,
      String.raw`
      .----.
     / _  _ \
     |(_)(_)|
      \ /\ /
       |##|
  \.--=+==+=--./
     |=|==|=|
     |_|  |_|
`,
    ],
    tint: { '#': '#a8a898' },
  },

  troll: {   // 31 x 9
    frames: [
      String.raw`
         ,.-'''''-.,       ___
        /  _     _  \     /   \
       |  (O)   (O)  |    \   /
       |     (_)     |     | |
       |  \/\/\/\/\  |     | |
     .-'\  \______/  /'-.  | |
    /    '.________.'    \ | |
   |  /|   |=======|   |\ \|_|
   (__)    |___|___|    (___)
`,
    ],
    tint: { O: '#ffcc00' },
  },

  crawler: {   // 19 x 6
    frames: [
      String.raw`
       /\  /\
  \ \ /x \/ x\ / /
 \ \ \\  /\  // / /
  \_\ ( o..o ) /_/
  /_/  '-vv-'  \_\
 / /  /      \  \ \
`,
      String.raw`
       /\  /\
  \ \ /x \/ x\ / /
   \ \\  /\  // /
 \__\ ( o..o ) /__/
 /  /  '-vv-'  \  \
  /  /        \  \
`,
    ],
    tint: { x: '#b8ffff', o: '#ff4060', v: '#b8ffff' },
  },
});
