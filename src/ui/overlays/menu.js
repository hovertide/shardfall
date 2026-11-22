'use strict';
/* SHARDFALL ui - overlays/menu.js   [Esc]  menu and settings. */
(function () {
  const U = SF.UI, ui = U.ui;
  const onOff = (v) => (v ? '{g}on {/}' : '{d}off{/}');
  const toggle = (k) => () => { U.settings[k] = !U.settings[k]; U.saveSettings(); };

  U.menuItems = () => [
    ['Resume', () => (ui.overlay = null)],
    ['Save game', () => { U.saveGame(); Engine.note(ui.s, '{d}Game saved.{/}'); ui.overlay = null; }],
    [`Timed strikes     ${onOff(U.settings.timed)}`, toggle('timed')],
    [`Fast animations   ${onOff(U.settings.fast)}`, toggle('fast')],
    ['Quit to title', U.quitToTitle],
  ];

  U.drawMenu = function () {
    const items = U.menuItems(), w = 36, h = items.length * 2 + 3, x = U.L.MAP.x + Math.floor((U.L.MAP.w - w) / 2), y = 4;
    U.box(x, y, w, h, 'Menu', { bg: U.MODAL_BG });
    items.forEach(([label, fn], k) => U.button(x + 2, y + 2 + k * 2, `{y}[${k + 1}]{/} ${label}`, 'menu:' + k, fn, { w: w - 4 }));
  };
})();
