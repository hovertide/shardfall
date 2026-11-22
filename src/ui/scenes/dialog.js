'use strict';
/* SHARDFALL ui - scenes/dialog.js : conversation window. */
(function () {
  const U = SF.UI, ui = U.ui;

  U.drawDialog = function () {
    const v = Engine.dialogView(ui.s);
    if (!v) return;
    const w = 56, x = 3, lines = U.wrap(v.text, w - 4, U.FG), nc = v.choices.length;
    const textRows = Math.min(lines.length, 19 - nc);
    const h = textRows + nc + 3, y = Math.max(0, Math.floor((22 - h) / 2));
    U.box(x, y, w, h, `{y}${v.name}{/}`, { bg: U.MODAL_BG });
    for (let k = 0; k < textRows; k++) U.drawLine(x + 2, y + 1 + k, lines[k]);
    if (ui.dsel >= nc) ui.dsel = 0;
    v.choices.forEach((t, k) => U.button(x + 2, y + textRows + 2 + k, `{y}[${k + 1}]{/} ${t}`, 'dlg:' + k,
      () => U.doAction({ type: 'choose', i: k }), { w: w - 4, bg: ui.dsel === k ? U.SEL_BG : null }));
  };
})();
