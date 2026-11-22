'use strict';
/* =====================================================================
   Enemy sprites: Ashpeak.
   Pictures are plain ASCII inside String.raw`...` so backslashes don't
   need escaping: paste art straight in. Each sprite can have:
     frames  one or more pictures (cycled slowly as an idle animation)
     tint    per-character colors, e.g. { o: '#ff4040' } paints every 'o'
     bands   column ranges with their own color: [[fromCol, toCol, color]]
   The base color comes from whatever uses the sprite (e.g. enemy color).
   ===================================================================== */
SF.define('sprites', {
  ramhorn: {   // 20 x 8
    frames: [
      String.raw`
  .--.        .--.
 / .-.\  __  /.-. \
| ( @ |\/  \/| @ ) |
 \ '-'/ o  o \'-' /
  '--'|      |'--'
       \ /\ /
        (oo)
        '--'
`,
    ],
    tint: { '@': '#f0e0c0', o: '#ffcc66' },
  },

  viper: {   // 19 x 8
    frames: [
      String.raw`
           ____
          / o  \__
         |  .-----<
     __   \ \
    /  \   ) )
   ( (\ \_/ /
    \ '----'
     '-.____.~~
`,
      String.raw`
           ____
          / o  \__
         |  .----<
     __   \ \     <
    /  \   ) )
   ( (\ \_/ /
    \ '----'
     '-.____.~~
`,
    ],
    tint: { o: '#ffd040', '<': '#ff4060', '~': '#6f9f2f' },
  },

  harpy: {   // 17 x 8
    frames: [
      String.raw`
\\\\   .-.   ////
 \\\\ (o o) ////
  \\\\ \_/ ////
   \\\/'-'\///
    \/ \V/ \/
       / \
      /_ _\
      ^^ ^^
`,
      String.raw`

 ___   .-.   ___
 \\\\ (o o) ////
\\\\\\ \_/ //////
      /'-'\
      \ V /
      /_ _\
      ^^ ^^
`,
    ],
    tint: { o: '#ff4060', V: '#ffd040', '^': '#ffd040' },
  },

  wisp: {   // 11 x 8
    frames: [
      String.raw`
      *
     /\   .
    /  \
 . ( oo )
   (    )
    \  / *
     \/
     ''
`,
      String.raw`
    .
     /\
    /  \  *
   ( oo ) .
 * (    )
    \  /
     \/
     ''
`,
    ],
    tint: { '*': '#ffffff', '.': '#9fd8ff', o: '#1a3a5a', "'": '#9fd8ff' },
  },

  frostfang: {   // 19 x 8
    frames: [
      String.raw`
  /\  /\    /\  /\
 /  \/  \__/  \/  \
 \  ___      ___  /
 | (*_*)    (*_*) |
  \       ^      /
   \\   _/ \_   //
    \\  VVVVV  //
     '-._____.-'
`,
      String.raw`
  /\  /\    /\  /\
 /  \/  \__/  \/  \
 \  ___      ___  /
 | (*_*)    (*_*) |
  \       ^      /
   \\   /'''\   //
    \\ (VVVVV) //
     '-._____.-'
`,
    ],
    tint: { '*': '#7fd8ff', V: '#ffffff' },
  },

  stormcrow: {   // 41 x 9
    frames: [
      String.raw`
\\__                                __//
 \\ '--.._                    _..--' //
  \\      '--.._  .----.  _..--'     //
   '\\__        '/ o  o \'       __//'
        '--.._   \  \/  /   _..--'
              '--.\____/.--'
                  /||||\
                 / |||| \
                ^  ^  ^  ^
`,
      String.raw`


                  .----.
                 / o  o \
    __..--''''--.\  \/  /.--''''--..__
  .'          _.-'\____/'-._          '.
 / /\/\/\.--''    /||||\    ''--./\/\/\ \
 \/              / |||| \              \/
                ^  ^  ^  ^
`,
    ],
    tint: { o: '#ffe066', '^': '#ffe066', '|': '#c8a050' },
  },
});
