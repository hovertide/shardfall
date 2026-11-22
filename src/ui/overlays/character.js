'use strict';
/* SHARDFALL ui - overlays/character.js   [C]  stats and stat points. */
(function () {
  const U = SF.UI, ui = U.ui, D = SF.data;

  U.drawChar = function () {
    const s = ui.s, x = 2, y = 1, w = 62, h = 24, p = s.p, d = Engine.derived(p), L = Engine.look(p), pct = U.pct;
    U.box(x, y, w, h, 'Character', { bg: U.MODAL_BG });
    U.mtext(x + 3, y + 1, `${p.name} {d}${L.title} · Level ${p.lvl}{/}`, L.color);
    const pts = p.points ? `{y}${p.points} point${p.points > 1 ? 's' : ''} to spend{/}` : '{d}no points to spend{/}';
    U.mtext(x + w - 3 - U.plainLen(pts), y + 1, pts);
    D.stats.forEach((st, k) => {
      const yy = y + 3 + k;
      U.mtext(x + 3, yy, `{y}[${k + 1}]{/}`);
      U.text(x + 7, yy, st.short, st.color);
      U.text(x + 11, yy, String(p.stats[st.k]).padStart(3), U.C.w);
      if (p.points > 0) U.button(x + 15, yy, '{g}[+]{/}', 'char:' + st.k, () => U.doAction({ type: 'alloc', stat: st.k }));
      U.text(x + 19, yy, st.desc, U.DIM, null, null, w - 21);
    });
    const rows = [
      `{d}Max HP{/} ${d.maxHp}   {d}Stamina{/} ${d.maxSt}   {d}Spirit{/} ${d.maxSp}   {d}Spell power{/} ${d.power}`,
      `{d}Damage{/} ${d.dmgMin}-${d.dmgMax}   {d}Crit{/} ${pct(d.crit)}   {d}Dodge{/} ${pct(d.dodge)}`,
      `{d}Damage resist{/} ${pct(d.resist)}   {d}Regen per round{/} ${d.regen} HP, ${d.stRegen} ST, ${d.spRegen} SP`,
      `{m}Brink:{/} keep fighting down to {r}-${d.brink} HP{/}`,
      `{o}Fury:{/} +${pct(d.furyBonus)} damage under 35% HP, +${pct(d.furyBonus * 2)} below 0`,
      `{m}Sanity{/} ${p.san}/${d.maxSan}   {d}Dread resist{/} ${pct(d.dreadResist)}   {d}Terror{/} ${pct(d.terror)}`,
    ];
    rows.forEach((r, k) => U.mtext(x + 3, y + 9 + k, r, U.FG, null, null, w - 6));
    U.mtext(x + 3, y + 17, `{d}Kills ${p.kills} · Steps ${p.steps} · Deaths ${p.deaths} · Stones ${p.stones || 0} · Echoes ${p.pulls}{/}`);
    U.mtext(x + 3, y + h - 2, p.points > 0 ? '{d}[1-5] or [+] to raise a stat{/}' : '{d}+1 point per level. Standing stones give more.{/}');
    U.closeBtn(x, y, w, h);
  };
})();
