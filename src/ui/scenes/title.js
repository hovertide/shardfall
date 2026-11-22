'use strict';
/* SHARDFALL ui - scenes/title.js : the title screen with falling shards. */
(function () {
  const U = SF.UI, ui = U.ui;

  U.drawTitle = function (now) {
    for (const st of ui.stars) U.put(st.x, Math.floor((st.y0 + now * st.sp) % U.ROWS), st.ch, st.c);
    const logo = U.sprite('logo');
    logo.frames[0].forEach((ln, k) => U.text(Math.floor((U.COLS - logo.w) / 2), 4 + k, ln, logo.rows[k] || U.C.c));
    U.center(50, 12, 'Shards are falling. The Veil is cracked. You remember nothing.', U.DIM);
    let y = 16;
    U.button(41, y, '{y}[N]{/} New game', 'title:new', U.startCreate, { w: 22 });
    y += 2;
    if (ui.saveInfo) {
      U.button(41, y, `{y}[C]{/} Continue  {d}${ui.saveInfo}{/}`, 'title:cont', U.loadGame, { w: 22 });
      y += 2;
    }
    U.button(41, y, '{y}[H]{/} How to play', 'title:help', () => (ui.titleHelp = true), { w: 22 });
    if (ui.msg) U.center(50, 25, ui.msg, U.C.r);
    U.center(50, 31, 'text only - mouse & keyboard - saves in your browser', '#4a4a58');
    if (ui.titleHelp) U.drawHelp();
  };

  const STAR_CH = ['*', '.', '+', "'"], STAR_COL = ['#5fe0e0', '#d08bff', '#ffd866', '#5a5a6a'];
  for (let k = 0; k < 45; k++) {
    ui.stars.push({
      x: Math.floor(Math.random() * U.COLS), y0: Math.random() * U.ROWS, sp: 0.0015 + Math.random() * 0.004,
      ch: STAR_CH[k % 4], c: STAR_COL[Math.floor(Math.random() * 4)],
    });
  }
})();
