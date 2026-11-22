'use strict';
/* SHARDFALL ui - scenes/gameover.js */
(function () {
  const U = SF.UI, ui = U.ui, R = SF.data.rules;

  U.drawGameOver = function () {
    const s = ui.s, x = 9, y = 5, w = 44, h = 11, cx = x + Math.floor(w / 2), p = s.p;
    U.box(x, y, w, h, '{r}Fallen{/}', { bg: '#1a0c12', color: '#8a2a3a' });
    U.center(cx, y + 2, 'Y O U   H A V E   F A L L E N', U.C.r);
    U.center(cx, y + 4, `Slain by ${s.dead ? s.dead.by : 'the dark'}.`, U.FG);
    U.center(cx, y + 5, 'Your will drags you back from the dark...', U.DIM);
    U.center(cx, y + 6, `You will lose ${Math.floor(p.gold * R.deathGoldLoss)} gold.`, U.C.y);
    U.button(cx - 7, y + 8, '{y}[R]{/} Rise again', 'go:rise', () => U.doAction({ type: 'respawn' }));
  };
})();
