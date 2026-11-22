'use strict';
/* =====================================================================
   SHARDFALL ui - overlays/journal.js   [J]
   Bestiary: every species you've met, with its picture. Entries fill in
   as you fight more of them (see E.journal in engine/progression.js),
   and weaknesses appear as you discover them in battle.
   Places: every area you've visited, how much you've explored, and how
   many chests and standing stones you've found there.
   ===================================================================== */
(function () {
  const U = SF.UI, ui = U.ui, D = SF.data;
  const X = 0, Y = 0, W = 128, H = 41;

  U.journalEntries = () => Engine.journal(ui.s);

  U.drawJournal = function (now) {
    U.box(X, Y, W, H, '{y}Journal{/}', { bg: U.MODAL_BG });
    U.button(X + 2, Y + 1, ui.jTab === 'beasts' ? '{y}[ BESTIARY ]{/}' : '{d}[ bestiary ]{/}', 'jr:tb', () => (ui.jTab = 'beasts'));
    U.button(X + 17, Y + 1, ui.jTab === 'places' ? '{y}[ PLACES ]{/}' : '{d}[ places ]{/}', 'jr:tp', () => (ui.jTab = 'places'));
    U.mtext(X + 30, Y + 1, '{d}[Tab] switch{/}');
    if (ui.jTab === 'beasts') drawBeasts(now); else drawPlaces();
    U.button(X + W - 14, Y + H - 1, '{y}[Esc]{/} Close', 'ov:close', () => (ui.overlay = null));
  };

  function drawBeasts(now) {
    const list = U.journalEntries(), known = list.filter((e) => e.known).length;
    U.mtext(X + W - 22, Y + 1, `{d}discovered{/} {y}${known}{/}{d}/${list.length}{/}`);
    for (let k = 2; k < W - 2; k++) U.put(X + k, Y + 2, '─', '#2c2c38');
    if (ui.jSel >= list.length) ui.jSel = 0;
    // left: the list
    list.forEach((e, k) => {
      const yy = Y + 3 + k;
      if (yy > Y + H - 3) return;
      const label = e.known ? `${U.pad(e.name, 19)}{d}${String(e.kills).padStart(4)}{/}` : '{d}? ? ?{/}';
      U.button(X + 2, yy, `${ui.jSel === k ? '{y}►{/}' : ' '} ${label}`, 'jr:' + k, () => (ui.jSel = k),
        { w: 27, bg: ui.jSel === k ? U.SEL_BG : null, color: e.known ? (e.boss ? '#ff8a8a' : U.FG) : U.DIM });
    });
    for (let yy = Y + 3; yy < Y + H - 1; yy++) U.put(X + 30, yy, '│', '#2c2c38');
    // right: the entry
    const e = list[ui.jSel], rx = X + 33, rw = W - 36;
    if (!e || !e.known) {
      U.mtext(rx, Y + 4, '{d}You have not met this creature yet.{/}');
      U.wrap('{d}Explore further: new areas hold new beasts, and the first kill of each species is worth double XP.{/}', rw, U.FG)
        .forEach((ln, k) => U.drawLine(rx, Y + 6 + k, ln));
      return;
    }
    U.mtext(rx, Y + 3, `{${e.color}}${e.name}{/}${e.boss ? '  {r}BOSS{/}' : ''}`);
    U.mtext(rx, Y + 4, `{d}met ${e.seen} · defeated ${e.kills}${e.habitat.length ? ' · found in ' + e.habitat.join(', ') : ''}{/}`, U.FG, null, null, rw);
    // the picture, in a frame
    const sp = U.sprite(e.sprite), fw = Math.max(30, (sp ? sp.w : 10) + 6), fh = Math.max(13, (sp ? sp.h : 4) + 4);
    U.box(rx, Y + 6, fw, fh, null, { color: '#2c2c38', style: 'single' });
    U.drawSprite(e.sprite, rx + Math.floor(fw / 2), Y + 6 + fh - 2, { color: e.color, now });
    // facts beside / below the picture
    const fx = rx + fw + 2, fwid = rw - fw - 2;
    let y = Y + 7;
    const line = (txt) => { for (const ln of U.wrap(txt, fwid, U.FG)) { if (y < Y + H - 2) U.drawLine(fx, y++, ln); } };
    if (fwid > 20) {
      line(`{d}${e.lore}{/}`);
      y++;
      if (e.stats) line(`{d}Level{/} ${e.stats.lvl}  {d}HP{/} ${e.stats.hp}  {d}ATK{/} ${e.stats.atk}  {d}DEF{/} ${e.stats.def}  {d}XP{/} ${e.stats.xp}`);
      else line('{d}Defeat one to learn its strength.{/}');
      if (e.moves) line(`{d}Moves:{/} ${e.moves.join(', ')}`);
      else if (e.stats) line('{d}Defeat three to learn its moves.{/}');
      if (e.gold) line(`{d}Carries{/} {y}${e.gold[0]}-${e.gold[1]} gold{/}`);
      y++;
      const el = (ids) => ids.map((k) => `{${D.elements[k].color}}${D.elements[k].name}{/}`).join(', ');
      line(`{d}Weak to:{/} ${e.weak.length ? el(e.weak) : '{d}unknown - try other elements{/}'}`);
      if (e.resist.length) line(`{d}Resists:{/} ${el(e.resist)}`);
    }
  }

  function drawPlaces() {
    const places = Engine.places(ui.s), total = Object.keys(D.maps).length;
    U.mtext(X + W - 22, Y + 1, `{d}visited{/} {y}${places.length}{/}{d}/${total}{/}`);
    for (let k = 2; k < W - 2; k++) U.put(X + k, Y + 2, '─', '#2c2c38');
    U.mtext(X + 3, Y + 3, `{d}${U.pad('Area', 26)}${U.pad('Danger', 12)}${U.pad('Altitude', 10)}${U.pad('Explored', 22)}${U.pad('Chests', 9)}Stones{/}`);
    let y = Y + 5, lastRegion = null;
    for (const pl of places.sort((a, b) => (a.region > b.region ? 1 : a.region < b.region ? -1 : b.z - a.z))) {
      if (pl.region !== lastRegion) {
        lastRegion = pl.region;
        if (y > Y + 5) y++;
      }
      const ex = Math.round(pl.explored * 100);
      U.text(X + 3, y, U.pad(pl.name, 25), pl.id === ui.s.p.map ? U.C.y : U.FG);
      U.text(X + 29, y, U.pad(pl.danger, 11), U.DIM);
      U.text(X + 41, y, U.pad(String(pl.z), 9), U.DIM);
      U.bar(X + 51, y, 14, ex, 100, ex >= 100 ? U.C.g : '#5a7a90');
      U.text(X + 66, y, `${ex}%`, U.DIM);
      U.text(X + 73, y, `${pl.chestsOpen}/${pl.chests}`, pl.chests && pl.chestsOpen === pl.chests ? U.C.g : U.FG);
      U.text(X + 82, y, `${pl.stonesUsed}/${pl.stones}`, pl.stones && pl.stonesUsed === pl.stones ? '#7fffe0' : U.FG);
      y++;
    }
    U.wrap('{d}Standing stones give a permanent stat point. Some hide behind cracked walls, up steep slopes, or behind things that bite.{/}', W - 8, U.FG)
      .forEach((ln, k) => U.drawLine(X + 3, Y + H - 4 + k, ln));
  }
})();
