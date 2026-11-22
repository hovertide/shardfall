'use strict';
/* Spirit and storm spells. Thunder is found, not learned by level. */
SF.define('spells', {
  spirit_hound: {
    name: 'Spirit Hound', cost: 14, lvl: 3, target: 'summon', turns: 5, el: 'spirit', anim: 'summon',
    desc: 'Summon a hound that draws aggro.', cast: '{m}A spirit hound tears free of the Veil, howling!{/}',
  },
  energy_beam: {
    name: 'Energy Beam', cost: 26, lvl: 7, target: 'one', base: 24, scale: 4, el: 'spirit', anim: 'beam',
    desc: 'A portal fires pure spirit energy.', cast: 'A portal rips open behind you. {m}ENERGY BEAM!{/}',
  },
  thunder: {
    name: 'Thunder', cost: 18, lvl: 1, found: true, target: 'chain', chain: 0.6, base: 13, scale: 2, el: 'storm', anim: 'lightning',
    desc: 'Lightning strikes one foe, then arcs to the rest.', cast: 'The sky answers. {y}THUNDER!{/}',
  },
});
