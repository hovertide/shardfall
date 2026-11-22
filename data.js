'use strict';
/* =====================================================================
   SHARDFALL — data.js
   Pure content tables. No logic, no DOM, JSON-safe values only.
   A future server can load this exact file.
   ===================================================================== */

const MW = 60, MH = 20;                       // map size in tiles (fills the map panel)
const rep = (s, n) => s.repeat(n);            // helper for drawing maps precisely
const G = rep(',', 10);                       // 10 tiles of grass
const YARD = '.' + rep('~', 4) + rep('.', 5) + rep('~', 4) + rep('.', 5) + rep('~', 3) + rep('.', 3);

const DATA = {
  rules: {
    baseStat: 4, startPoints: 6, pointsPerLevel: 3, shardsPerLevel: 5,
    pullCost: 10, startGold: 30, startShards: 10, maxSanity: 100,
  },

  /* ---------- Tiles: g = glyph shown, c = color, walk = passable,
                bump = interact by walking into it, once = disappears after use */
  tiles: {
    '#': { g: '#', c: '#5e5e72' },
    '.': { g: '.', c: '#6e6e7c', walk: true },
    ',': { g: '"', c: '#3f8f4a', walk: true },
    'T': { g: '♣', c: '#2e9e4e' },
    '~': { g: '≈', c: '#3d72d6' },
    '=': { g: '=', c: '#b08850', walk: true },
    '+': { g: '+', c: '#c09060', walk: true },
    'o': { g: '○', c: '#7fb0d0' },
    '$': { g: '$', c: '#ffd866', bump: 'shop' },
    'I': { g: '⌂', c: '#ff9a4a', bump: 'talk', dlg: 'inn' },
    'S': { g: 'Ω', c: '#d08bff', bump: 'shrine' },
    'E': { g: '☺', c: '#ffd866', bump: 'talk', dlg: 'elder' },
    'H': { g: '☺', c: '#5fe0e0', bump: 'talk', dlg: 'hermit' },
    'C': { g: '■', c: '#ffb020', bump: 'chest', once: true },
    'A': { g: '♦', c: '#5fe0e0', bump: 'talk', dlg: 'altar' },
    'B': { g: 'Ψ', c: '#ff4060', bump: 'boss', once: true },
    'a': { g: '>', c: '#5fe0e0', walk: true, exit: true },
    'b': { g: '>', c: '#5fe0e0', walk: true, exit: true },
    'c': { g: '>', c: '#5fe0e0', walk: true, exit: true },
  },

  /* Exit letters link two maps; you arrive next to the same letter on the other map. */
  links: { a: ['village', 'woods'], b: ['woods', 'cave'], c: ['woods', 'ruins'] },

  maps: {
    village: {
      name: 'Emberhollow Village', danger: 'safe haven', safe: true, start: [31, 9],
      rows: [
        rep('#', 60),
        '#,,T' + rep(',', 19) + 'T' + rep(',', 22) + 'T' + rep(',', 12) + '#',
        '#' + rep(',', 34) + 'T' + rep(',', 23) + '#',
        '#,,,,' + rep('#', 7) + rep(',', 32) + rep('#', 7) + rep(',', 8) + '#',
        '#,,,,#' + rep('.', 5) + '#' + rep(',', 32) + '#' + rep('.', 5) + '#' + rep(',', 8) + '#',
        '#,,,,#..$..#' + rep(',', 32) + '#..I..#' + rep(',', 8) + '#',
        '#,,,,#' + rep('.', 5) + '#' + rep(',', 32) + '#' + rep('.', 5) + '#' + rep(',', 8) + '#',
        '#,,,,###+###' + rep(',', 32) + '###+###' + rep(',', 8) + '#',
        '#' + rep(',', 7) + '.' + rep(',', 38) + '.' + rep(',', 11) + '#',
        '#' + rep(',', 7) + rep('.', 20) + 'o' + rep('.', 30) + 'a',
        '#,,T' + rep(',', 22) + 'E,,.' + rep(',', 29) + 'a',
        '#' + rep(',', 28) + '.' + rep(',', 7) + 'T' + rep(',', 21) + '#',
        '#' + rep(',', 12) + 'T' + rep(',', 15) + '.' + rep(',', 23) + 'T' + rep(',', 5) + '#',
        '#' + rep(',', 23) + '#####+#####' + rep(',', 24) + '#',
        '#' + rep(',', 23) + '#' + rep('.', 9) + '#' + rep(',', 24) + '#',
        '#' + rep(',', 23) + '#....S....#' + rep(',', 24) + '#',
        '#' + rep(',', 23) + '#' + rep('.', 9) + '#' + rep(',', 24) + '#',
        '#' + rep(',', 23) + rep('#', 11) + rep(',', 24) + '#',
        '#,,,,T' + rep(',', 36) + 'T' + rep(',', 16) + '#',
        rep('#', 60),
      ],
    },

    woods: {
      name: 'Whispering Woods', danger: 'Lv 1-3',
      enc: [['slime', 5], ['wolf', 4], ['goblin', 3]], rate: 0.09, pathRate: 0.03,
      chest: { gold: [20, 40], item: 'hp_potion' },
      rows: [
        rep('#', 30) + 'bb' + rep('#', 28),
        '#TT,,,TT,,' + ',TTT,,,TT,' + ',,,TTT,,,,' + '.,,,TT,,TT' + ',,,,TTT,,,' + ',TT,,,,TT#',
        '#T,,,,,,T,' + ',,T,,C,,,,' + 'T,,,,,,T,,' + '.,,T,,,,,,' + ',T,,,,,,T,' + ',,,,T,,,,#',
        '#,,TT,,,,,' + ',,,,,,,TT,' + ',,TT,,,,,,' + '.,,,,,TT,,' + G + 'TT,,,,,,T#',
        '#,,,,TT,,,' + 'TT,,,,,,,,' + ',,,,,,T,,,' + '.,,,,,,,,,' + ',TTT,,,,,,' + ',,,,,,,,,#',
        '#T,,,,,,,,' + ',,,,TTT,,,' + ',T,,,,,,,,' + '.T,,,,,,,,' + ',,,,,,,H,,' + ',,TT,,,,,#',
        '#TT,,,,T,,' + ',,,,,,,,,T' + 'T,,,,,,,,,' + '.,,,,TT,,,' + G + ',,,,,,TT,#',
        '#,,,,,,,,T' + 'T,,,,,,,,,' + ',,,,TT,,,,' + '.,,,,,,,,,' + ',,,T,,,,,,' + ',,,,,,,,,#',
        '#,,T,,,,,,' + ',,,,,,,T,,' + G + '.,,,,,,,,,' + ',,,,,,,,,T' + 'T,,,,,,,,#',
        'a' + rep('.', 45) + rep(',', 13) + '#',
        'a' + rep(',', 12) + 'T' + rep(',', 19) + 'T' + rep(',', 11) + '.' + rep(',', 11) + 'C,#',
        '#,,,,TT' + rep(',', 14) + 'T' + rep(',', 23) + '.' + rep(',', 13) + '#',
        '#' + rep(',', 44) + '.' + rep(',', 13) + '#',
        '#' + rep('~', 44) + '==' + rep('~', 12) + '#',
        '#' + rep('~', 44) + '==' + rep('~', 12) + '#',
        '#' + rep(',', 11) + 'T' + rep(',', 25) + 'T' + rep(',', 6) + '.' + rep(',', 13) + '#',
        '#,,T' + rep(',', 22) + 'TT' + rep(',', 17) + '.,,T' + rep(',', 10) + '#',
        '#' + rep(',', 44) + '.' + rep(',', 13) + '#',
        '#' + rep(',', 44) + '.' + rep(',', 13) + '#',
        rep('#', 45) + 'c' + rep('#', 14),
      ],
    },

    cave: {
      name: 'Hollow Cave', danger: 'Lv 3-5',
      enc: [['bat', 5], ['skeleton', 4], ['troll', 1]], rate: 0.06,
      chest: { gold: [40, 70], item: 'sp_draught' },
      rows: [
        rep('#', 60),
        rep('#', 49) + rep('.', 9) + '##',
        '##' + rep('.', 6) + rep('#', 41) + rep('.', 4) + 'A' + rep('.', 4) + '##',
        '##..C...' + rep('#', 41) + rep('.', 9) + '##',
        '##' + rep('.', 6) + rep('#', 39) + rep('.', 11) + '##',
        '###....' + rep('#', 40) + '..' + rep('#', 11),
        '####..' + rep('#', 41) + '..' + rep('#', 11),
        '####..' + rep('#', 41) + '..' + rep('#', 11),
        '####..' + rep('#', 41) + '..' + rep('#', 11),
        '####..' + rep('#', 41) + '..' + rep('#', 11),
        '####..' + rep('#', 15) + rep('.', 28) + rep('#', 11),
        '####' + rep('.', 37) + rep('#', 19),
        rep('#', 18) + rep('.', 24) + rep('#', 18),
        rep('#', 18) + rep('.', 6) + '##' + rep('.', 7) + '##' + rep('.', 13) + rep('#', 12),
        rep('#', 18) + rep('.', 24) + '####.C' + rep('#', 12),
        rep('#', 30) + '..' + rep('#', 28),
        rep('#', 30) + '..' + rep('#', 28),
        rep('#', 30) + '..' + rep('#', 28),
        rep('#', 30) + '..' + rep('#', 28),
        rep('#', 30) + 'bb' + rep('#', 28),
      ],
    },

    ruins: {
      name: 'Sunken Ruins', danger: 'Lv 6+',
      enc: [['wraith', 4], ['knight', 3], ['shade', 3]], rate: 0.07, maxGroup: 3,
      chest: { gold: [60, 100], item: 'calm_tea' },
      rows: [
        rep('#', 45) + 'c' + rep('#', 14),
        rep('#', 45) + '..' + rep('#', 13),
        rep('#', 45) + '..' + rep('#', 13),
        rep('#', 21) + rep('.', 34) + rep('#', 5),
        rep('#', 21) + rep('..#', 11) + '.' + rep('#', 5),
        rep('#', 21) + rep('.', 31) + 'C..' + rep('#', 5),
        rep('#', 21) + rep('..#', 11) + '.' + rep('#', 5),
        rep('#', 21) + rep('.', 34) + rep('#', 5),
        rep('#', 21) + '..' + rep('#', 19) + '..' + rep('#', 16),
        rep('#', 21) + '..' + rep('#', 19) + '..' + rep('#', 16),
        rep('#', 21) + '..' + rep('#', 19) + '..' + rep('#', 16),
        rep('#', 21) + '..' + rep('#', 8) + rep('.', 25) + rep('#', 4),
        '#' + rep('.', 14) + rep('#', 6) + '..' + rep('#', 8) + YARD + rep('#', 4),
        '#..~~' + rep('.', 10) + rep('#', 6) + '..' + rep('#', 8) + YARD + rep('#', 4),
        '#' + rep('.', 6) + 'B' + rep('.', 15) + rep('#', 8) + rep('.', 21) + 'C...' + rep('#', 4),
        '#..~~' + rep('.', 10) + rep('#', 45),
        '#' + rep('.', 14) + rep('#', 45),
        rep('#', 60),
        rep('#', 60),
        rep('#', 60),
      ],
    },
  },

  /* ---------- Equipment & abilities ---------- */
  weapons: {
    wooden_sword: { name: 'Wooden Sword', min: 4, max: 7, crit: 0, price: 0, desc: 'Dmg 4-7. Splinters included.' },
    stone_sword: { name: 'Stone Sword', min: 7, max: 11, crit: 2, price: 60, desc: 'Dmg 7-11, +2% crit. Crude, heavy.' },
    steel_sword: { name: 'Steel Sword', min: 12, max: 18, crit: 4, price: 180, desc: 'Dmg 12-18, +4% crit. Sharp, true.' },
  },

  skills: {   // strength skills, cost stamina
    double_slash: { name: 'Double Slash', cost: 8, lvl: 1, hits: 2, mult: 0.75, desc: 'Slash twice.' },
    triple_slash: { name: 'Triple Slash', cost: 14, lvl: 4, hits: 3, mult: 0.7, desc: 'Slash three times.' },
    flaming_slash: { name: 'Flaming Slash', cost: 12, lvl: 6, hits: 1, mult: 1.1, burn: 3, desc: 'Strike and burn for 3 turns.' },
  },

  spells: {   // cost spirit
    fireball: { name: 'Fireball', cost: 8, lvl: 1, target: 'one', base: 12, scale: 3, burnChance: 0.3,
      desc: 'Hurl fire. 30% chance to burn.', cast: 'You hurl a roaring {o}Fireball{/}!' },
    spirit_hound: { name: 'Spirit Hound', cost: 14, lvl: 3, target: 'summon', turns: 5,
      desc: 'Summon a hound that draws aggro.', cast: '{m}A spirit hound tears free of the Veil, howling!{/}' },
    ice_blast: { name: 'Ice Blast', cost: 16, lvl: 5, target: 'all', base: 8, scale: 2, freeze: 2,
      desc: 'Hit all foes, freeze 2 turns.', cast: '{c}ICE BLAST!{/} Frost erupts across the battlefield.' },
    energy_beam: { name: 'Energy Beam', cost: 28, lvl: 7, target: 'one', base: 30, scale: 5,
      desc: 'A portal fires pure energy.', cast: 'A portal rips open behind you. {c}ENERGY BEAM!{/}' },
  },

  items: {
    hp_potion: { name: 'Health Potion', price: 15, stat: 'hp', amt: 40, desc: 'Restore 40 HP (+2 per VIT).' },
    st_tonic: { name: 'Stamina Tonic', price: 12, stat: 'st', amt: 30, desc: 'Restore 30 stamina.' },
    sp_draught: { name: 'Spirit Draught', price: 15, stat: 'sp', amt: 30, desc: 'Restore 30 spirit.' },
    calm_tea: { name: 'Calming Tea', price: 20, stat: 'san', amt: 40, desc: 'Restore 40 sanity.' },
    smoke_bomb: { name: 'Smoke Bomb', price: 25, stat: 'flee', combatOnly: true, desc: 'Escape any non-boss fight.' },
  },

  shop: ['hp_potion', 'st_tonic', 'sp_draught', 'calm_tea', 'smoke_bomb', 'stone_sword', 'steel_sword'],

  /* ---------- Enemies. moves are rolled in order; otherwise a basic attack.
     move types: hit, aoe (player + hound), drain (heals self), dread (sanity),
                 steal (gold), sap (spirit) */
  enemies: {
    slime: { name: 'Slime', hp: 22, atk: 5, def: 0, xp: 8, gold: [3, 7], color: '#5fdd80',
      art: ['  .--.  ', ' ( oo ) ', '(______)'], moves: [] },
    wolf: { name: 'Tainted Wolf', hp: 28, atk: 7, def: 1, xp: 12, gold: [4, 9], color: '#9aa0b0',
      art: ['  /\\__/\\  ', ' ( >  < ) ', '  \\ ww /  ', '   """"   '],
      moves: [{ name: 'Savage Bite', chance: 0.2, type: 'hit', mult: 1.5 }] },
    goblin: { name: 'Goblin', hp: 34, atk: 8, def: 2, xp: 15, gold: [8, 15], color: '#8fcf4f',
      art: ['  ,   ,  ', ' (o\\_/o) ', '  /|=|\\  ', '  _/ \\_  '],
      moves: [{ name: 'Pilfer', chance: 0.2, type: 'steal', amt: [4, 10] }] },
    bat: { name: 'Cave Bat', hp: 26, atk: 9, def: 1, xp: 14, gold: [3, 8], color: '#a07cd0',
      art: [' /\\    /\\ ', '/  \\oo/  \\', '    vv    '],
      moves: [{ name: 'Leech', chance: 0.3, type: 'drain', mult: 1 }] },
    skeleton: { name: 'Skeleton', hp: 48, atk: 11, def: 4, xp: 22, gold: [10, 18], color: '#e8e8d8',
      art: ['  .-.  ', ' (o.o) ', '  |=|  ', ' /| |\\ '],
      moves: [{ name: 'Bone Rattle', chance: 0.2, type: 'dread', amt: 8 }] },
    troll: { name: 'Cave Troll', hp: 95, atk: 15, def: 5, xp: 50, gold: [25, 40], color: '#8a9a5b', solo: true,
      art: ['  ,____,  ', ' ( O  O ) ', ' /|vvvv|\\ ', '  |____|  '],
      moves: [{ name: 'Boulder Smash', chance: 0.25, type: 'hit', mult: 1.8 }] },
    wraith: { name: 'Wraith', hp: 60, atk: 13, def: 3, xp: 36, gold: [15, 25], color: '#9fb4ff',
      art: ['  .-~~-.  ', ' ( x  x ) ', '  )    (  ', ' ~~~~~~~~ '],
      moves: [{ name: 'Wail', chance: 0.35, type: 'dread', amt: 12 }] },
    knight: { name: 'Fallen Knight', hp: 90, atk: 17, def: 8, xp: 55, gold: [25, 40], color: '#c06060',
      art: ['  _[]_  ', ' |-==-| ', ' /|##|\\ ', '  /  \\  '],
      moves: [{ name: 'Cleave', chance: 0.25, type: 'aoe', mult: 1.4 }] },
    shade: { name: 'Shade', hp: 55, atk: 15, def: 2, xp: 40, gold: [15, 28], color: '#8a7ab0',
      art: ['  ░▒▓▓▒░  ', '  ▒ oo ▒  ', '  ░▒▓▓▒░  '],
      moves: [{ name: 'Soul Siphon', chance: 0.3, type: 'sap', amt: 10 }, { name: 'Whisper', chance: 0.25, type: 'dread', amt: 10 }] },
    warden: { name: 'The Veil Warden', hp: 420, atk: 22, def: 8, xp: 300, gold: [200, 200], color: '#ff5577', boss: true,
      art: ['   \\ | /   ', "  .-'^'-.  ", ' ( @   @ ) ', '  \\ \\_/ /  ', ' /|=====|\\ '],
      moves: [
        { name: 'Veil Rend', chance: 0.25, type: 'aoe', mult: 1.6 },
        { name: 'Whispers of the Void', chance: 0.2, type: 'dread', amt: 16 },
        { name: 'Devour Light', chance: 0.15, type: 'drain', mult: 1.2 },
      ] },
  },

  /* ---------- Story ---------- */
  quests: {
    q1: { name: 'Rot in the Woods', giver: 'Elder Maren', short: 'cull beasts in the woods',
      desc: 'Cull 4 tainted creatures in the Whispering Woods, east of the village.',
      kill: { map: 'woods', n: 4 }, reward: { gold: 40, shards: 5, xp: 25 } },
    q2: { name: 'Light in the Hollow', giver: 'Elder Maren', short: 'find the light in Hollow Cave',
      desc: 'Find the source of the shard-light deep in the Hollow Cave, north through the woods.',
      reward: { gold: 80, shards: 10, xp: 60 } },
    q3: { name: 'The Veil Warden', giver: 'Elder Maren', short: 'slay the Veil Warden',
      desc: 'Slay the Veil Warden in the Sunken Ruins, south of the woods across the river.',
      reward: { gold: 250, shards: 25, xp: 0 } },
  },

  /* Dialogue: entry picks the first node whose quest conditions match.
     Choice actions: accept:q, ready:q, turnin:q, flag:x, rest:cost, calm:n, heal:pct */
  dialogues: {
    elder: {
      name: 'Elder Maren',
      entry: [
        { if: { q3: 'done' }, node: 'after' }, { if: { q3: 'ready' }, node: 'q3ready' },
        { if: { q3: 'active' }, node: 'q3active' }, { if: { q2: 'ready' }, node: 'q2ready' },
        { if: { q2: 'active' }, node: 'q2active' }, { if: { q1: 'ready' }, node: 'q1ready' },
        { if: { q1: 'active' }, node: 'q1active' }, { node: 'intro' },
      ],
      nodes: {
        intro: { text: "An old woman leans on a staff of pale ash-wood, watching the sky.\n\"So the Veil spat you out too. Three nights ago the sky cracked like ice and shards rained down like falling stars. The beasts of the Whispering Woods drank the light... and went wrong.\"",
          choices: [{ t: "I'll help. What do you need?", do: ['accept:q1'], go: 'accept' }, { t: 'Who are you?', go: 'who' }, { t: 'Not now.' }] },
        who: { text: "\"Maren. I've kept Emberhollow's ember-well lit for sixty winters.\" She taps her temple. \"The shards hum. You hear them, don't you? That's why you woke here.\"",
          choices: [{ t: 'Tell me about the trouble.', go: 'intro' }, { t: 'Farewell.' }] },
        accept: { text: "\"Cull four of the tainted beasts in the {c}Whispering Woods{/}, east of the village. Take whatever coin they carry. Bram sells potions at the shop ({y}${/}).\"\n\"And the {m}Shrine of Echoes{/} ({m}Ω{/}) to the south answers to spirit shards, if you're curious.\"",
          choices: [{ t: "I'm on it." }] },
        q1active: { text: "\"The woods still writhe. Cull the tainted beasts. %q1% so far.\"", choices: [{ t: 'On my way.' }] },
        q1ready: { text: "Maren studies the blood on your blade and nods slowly.\n\"Good. You fight like someone who's done this before, even if you don't remember it.\"",
          choices: [{ t: 'Claim reward', do: ['turnin:q1', 'accept:q2'], go: 'q2intro' }] },
        q2intro: { text: "\"But the beasts were only a symptom. A light burns deep in the {c}Hollow Cave{/}, north through the woods. The shards are gathering there. Find out why.\"",
          choices: [{ t: "I'll go." }] },
        q2active: { text: "\"The Hollow Cave lies north through the woods. Follow the light, and mind the troll.\"", choices: [{ t: 'Understood.' }] },
        q2ready: { text: "\"You touched it? Then you saw it too. The Warden.\" Her hands tremble on the staff. \"A thing that guards the crack in the sky and keeps it open.\"",
          choices: [{ t: 'Claim reward', do: ['turnin:q2', 'accept:q3'], go: 'q3intro' }] },
        q3intro: { text: "\"It dwells in the {r}Sunken Ruins{/}, south across the river from the woods. End it, wanderer, or we all become like those beasts. Rest at the inn first. Buy steel.\"",
          choices: [{ t: 'It ends.' }] },
        q3active: { text: "\"The Warden waits in the Sunken Ruins. Its whispers break minds. Keep your will strong and carry calming tea.\"", choices: [{ t: "I'll be ready." }] },
        q3ready: { text: "The sky above Emberhollow is quiet for the first time in days. Maren weeps openly.\n\"It's done. The Veil is mending. You have Emberhollow's thanks, and mine.\"",
          choices: [{ t: 'Claim reward', do: ['turnin:q3', 'flag:chapter1'], go: 'epilogue' }] },
        epilogue: { text: "{y}~ CHAPTER I COMPLETE ~{/}\n\"But shards still fall, far beyond these hills. The Veil cracked in more than one place.\" She presses a warm ember-stone into your palm. \"When you're ready, the road east waits.\"\n{d}(Thanks for playing! Keep exploring, level up and collect cosmetics.){/}",
          choices: [{ t: 'Continue.' }] },
        after: { text: "\"The sky is quiet, but I still hear the shards humming. Rest well, wanderer.\"", choices: [{ t: 'Farewell.' }] },
      },
    },
    hermit: {
      name: 'Old Hermit',
      entry: [{ node: 'main' }],
      nodes: {
        main: { text: "A hermit in moss-green rags stirs a bubbling pot.\n\"Sit, sit. The woods are loud lately. Loud minds break easy.\"",
          choices: [{ t: 'Share his stew', do: ['heal:40', 'calm:25'], go: 'stew' }, { t: 'Ask about the shards', go: 'lore' }, { t: 'Ask about willpower', go: 'will' }, { t: 'Leave' }] },
        stew: { text: 'The stew tastes of mushrooms and smoke. Warmth spreads through you.', choices: [{ t: 'Thank him', go: 'main' }] },
        lore: { text: "\"The shards are memories, child. Echoes of lives that might have been. The shrine in the village coaxes them out: faces, colors, names. Vanity, mostly. Pretty vanity.\"", choices: [{ t: 'Back', go: 'main' }] },
        will: { text: "\"Willpower lets you stand when your body says fall. Bleed past zero and keep swinging. Hurt bad enough and it makes you fierce. And when the dead whisper, will keeps you sane.\"", choices: [{ t: 'Back', go: 'main' }] },
      },
    },
    inn: {
      name: 'Tobba the Innkeeper',
      entry: [{ node: 'main' }],
      nodes: {
        main: { text: "Tobba polishes a mug that will never be clean.\n\"A bed's 10 gold. Best sleep in Emberhollow. Only sleep in Emberhollow, really.\"",
          choices: [{ t: 'Rest (10 gold)', do: ['rest:10'], go: 'rested' }, { t: 'Leave' }] },
        rested: { text: 'You sleep without dreams. When you wake, the ember-light through the shutters feels like a promise.', choices: [{ t: 'Leave' }] },
        poor: { text: "\"No coin, no cot. The woods are full of coin, I hear. Mostly on things that bite.\"", choices: [{ t: 'Leave' }] },
      },
    },
    altar: {
      name: 'Shard Altar',
      entry: [{ if: { q2: 'active' }, node: 'touch' }, { node: 'idle' }],
      nodes: {
        touch: { text: 'A jagged shard the size of a man floats above a stone altar, pulsing with cold light. The air hums in your teeth.',
          choices: [{ t: 'Touch the shard', do: ['flag:altar', 'ready:q2'], go: 'vision' }, { t: 'Step back' }] },
        vision: { text: "{c}Light floods your mind.{/} You see ruins sunk beneath black water, and a towering figure of shadow and eyes holding the crack in the sky open with both hands.\n{r}The Veil Warden.{/}\nThe vision snaps shut. You should tell Maren.",
          choices: [{ t: 'Leave' }] },
        idle: { text: 'The great shard drifts silently above its altar. Its light seems to watch you.', choices: [{ t: 'Leave' }] },
      },
    },
  },

  /* ---------- Cosmetics (Shrine of Echoes). r = rarity index, def = owned from start */
  rarity: [
    { name: 'Common', color: '#b8b8c0', weight: 62 },
    { name: 'Rare', color: '#4aa8ff', weight: 27 },
    { name: 'Epic', color: '#c06cff', weight: 9 },
    { name: 'Legendary', color: '#ffb020', weight: 2 },
  ],
  pity: { epic: 10, legendary: 40 },     // guaranteed Epic+ every 10 pulls, Legendary by 40
  dupeRefund: [2, 4, 8, 20],

  cosmetics: [
    { id: 'g_at', type: 'glyph', name: 'Classic', val: '@', r: 0, def: true },
    { id: 'g_smile', type: 'glyph', name: 'Grin', val: '☻', r: 0 },
    { id: 'g_para', type: 'glyph', name: 'Pilcrow', val: '¶', r: 0 },
    { id: 'g_amp', type: 'glyph', name: 'Ampersand', val: '&', r: 0 },
    { id: 'g_theta', type: 'glyph', name: 'Theta', val: 'Θ', r: 1 },
    { id: 'g_spade', type: 'glyph', name: 'Spade', val: '♠', r: 1 },
    { id: 'g_heart', type: 'glyph', name: 'Heart', val: '♥', r: 1 },
    { id: 'g_sun', type: 'glyph', name: 'Sunburst', val: '☼', r: 2 },
    { id: 'g_omega', type: 'glyph', name: 'Omega', val: 'Ω', r: 2 },
    { id: 'g_zhe', type: 'glyph', name: 'Starfall', val: 'Ж', r: 3 },

    { id: 'c_white', type: 'color', name: 'Bone White', val: '#f0f0f0', r: 0, def: true },
    { id: 'c_mint', type: 'color', name: 'Mint', val: '#7dffb2', r: 0 },
    { id: 'c_sky', type: 'color', name: 'Sky', val: '#7cc4ff', r: 0 },
    { id: 'c_rose', type: 'color', name: 'Rose', val: '#ff8fb1', r: 1 },
    { id: 'c_ember', type: 'color', name: 'Ember', val: '#ff8a3d', r: 1 },
    { id: 'c_violet', type: 'color', name: 'Voidlight', val: '#c792ea', r: 2 },
    { id: 'c_gold', type: 'color', name: 'Sunforged', val: '#ffd23f', r: 3 },

    { id: 't_wanderer', type: 'title', name: 'the Wanderer', r: 0, def: true },
    { id: 't_ashborn', type: 'title', name: 'Ashborn', r: 0 },
    { id: 't_moss', type: 'title', name: 'Mossheart', r: 0 },
    { id: 't_shard', type: 'title', name: 'Shardbound', r: 1 },
    { id: 't_hollow', type: 'title', name: 'of the Hollow', r: 1 },
    { id: 't_veil', type: 'title', name: 'Veilwalker', r: 2 },
    { id: 't_star', type: 'title', name: 'the Starfallen', r: 3 },

    { id: 'f_single', type: 'frame', name: 'Plain', val: { style: 'single', color: '#4a4a60' }, r: 0, def: true },
    { id: 'f_ascii', type: 'frame', name: 'Retro', val: { style: 'ascii', color: '#5f8f5f' }, r: 0 },
    { id: 'f_round', type: 'frame', name: 'Smooth', val: { style: 'rounded', color: '#5a7a90' }, r: 0 },
    { id: 'f_double', type: 'frame', name: 'Regal', val: { style: 'double', color: '#4a7ad0' }, r: 1 },
    { id: 'f_heavy', type: 'frame', name: 'Voidforged', val: { style: 'heavy', color: '#9a5ad0' }, r: 2 },
    { id: 'f_gold', type: 'frame', name: 'Gilded', val: { style: 'double', color: '#d8a820' }, r: 3 },
  ],
};

// Lets a future Node server reuse this file: const { DATA } = require('./data.js')
if (typeof module !== 'undefined') module.exports = { DATA, MW, MH };
