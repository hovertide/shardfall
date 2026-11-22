'use strict';
/* SHARDFALL ui - overlays/help.js   [?] */
(function () {
  const U = SF.UI, ui = U.ui;

  const HELP = [
    ['{y}Move{/}', 'WASD, arrow keys or the numpad (y u b n for diagonals). Or click any explored tile to walk there.'],
    ['{y}Interact{/}', 'Walk into people ({y}&{/}), chests ({y}${/}), signs ({y}P{/}) and the shrine ({m}n{/}). Glowing paths lead to new areas.'],
    ['{y}Terrain{/}', 'Steep slopes ({y}/{/}) cost stamina to climb. Ledges ({y}_{/}) can only be hopped down. {c}<{/} climbs up, {c}>{/} goes down. Cracked walls may hide passages.'],
    ['{y}Growth{/}', 'Each level gives 1 stat point. Standing stones ({c}I{/}) hidden in the world give more. New areas, lookouts ({w}!{/}) and first kills give bonus XP; weak foes give little.'],
    null,
    ['{y}Combat{/}', '[1] Attack  [2] Skills  [3] Spells  [4] Items  [5] Defend  [6] Flee. Tab or click to change target.'],
    ['{y}Intents{/}', 'Under each enemy is what it will do next turn. {o}!!{/} marks a heavy blow: Defend to take only 20% and riposte. {y}*{/} means it is winding up.'],
    ['{y}Strikes{/}', 'Attacks and sword skills show a strike bar: stop the marker in the {#ffd040}gold{/} zone for a perfect hit. Each weapon swings differently.'],
    ['{y}Elements{/}', 'Fire, frost, storm and spirit. Hitting a weakness does +50%; your journal records every weakness you find.'],
    null,
    ['{r}Vitality{/}', 'More HP, damage resistance, regeneration and stronger potions.'],
    ['{o}Strength{/}', 'Weapon damage, critical hits, dodge and escaping.'],
    ['{g}Stamina{/}', 'Stamina for sword skills and for climbing steep slopes.'],
    ['{b}Spirit{/}', 'Spirit for spells, plus stronger spells and hounds.'],
    ['{m}Willpower{/}', 'Keep fighting below 0 HP (Brink), deal more damage when badly hurt (Fury), resist sanity loss.'],
    ['{m}Sanity{/}', 'Dread attacks drain it. Under 30 you may freeze; at 0 you deal less damage. Tea, the hermit and the inn restore it.'],
    null,
    ['{y}Keys{/}', '[I]tems [C]haracter [J]ournal [Q]uests [O]utfits [?]help [Esc]menu'],
  ];

  U.drawHelp = function () {
    const x = 6, y = 0, w = 88, h = 33;
    U.box(x, y, w, h, '{y}How to play{/}', { bg: U.MODAL_BG });
    let yy = y + 2;
    for (const e of HELP) {
      if (!e) { yy++; continue; }
      U.mtext(x + 3, yy, e[0]);
      for (const ln of U.wrap(e[1], w - 18, U.FG)) { if (yy > y + h - 3) break; U.drawLine(x + 15, yy++, ln); }
    }
    U.button(x + w - 14, y + h - 1, '{y}[Esc]{/} Close', 'help:close', () => {
      if (ui.screen === 'title') ui.titleHelp = false;
      else ui.overlay = null;
    });
  };
})();
