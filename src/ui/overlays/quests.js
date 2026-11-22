'use strict';
/* SHARDFALL ui - overlays/quests.js   [Q] */
(function () {
  const U = SF.UI, ui = U.ui;

  U.drawQuests = function () {
    const x = 2, y = 1, w = 62, h = 24;
    U.box(x, y, w, h, 'Quests', { bg: U.MODAL_BG });
    const order = { ready: 0, active: 1, done: 2 };
    const qs = Engine.questLog(ui.s).sort((a, b) => order[a.status] - order[b.status]);
    let yy = y + 2;
    if (!qs.length) {
      for (const ln of U.wrap('No quests yet. Elder Maren in Emberhollow village may need help.', w - 6, U.DIM)) U.drawLine(x + 3, yy++, ln);
    }
    for (const q of qs) {
      if (yy > y + h - 3) break;
      const tag = { ready: '{y}READY {/}', active: '{c}ACTIVE{/}', done: '{d}DONE  {/}' }[q.status];
      const name = q.status === 'done' ? `{d}${q.name}{/}` : q.name;
      U.mtext(x + 3, yy++, `${tag} ${name}${q.progress && q.status === 'active' ? ` {d}(${q.progress}){/}` : ''}`);
      if (q.status !== 'done') {
        const body = q.status === 'ready' ? `Return to ${q.giver}.` : q.desc;
        for (const ln of U.wrap(body, w - 13, U.DIM)) { if (yy > y + h - 3) break; U.drawLine(x + 10, yy++, ln); }
      }
      yy++;
    }
    U.closeBtn(x, y, w, h);
  };
})();
