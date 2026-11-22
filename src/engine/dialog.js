'use strict';
/* =====================================================================
   SHARDFALL engine - dialog.js
   Conversations (content/story/**). A dialogue picks its first entry
   whose quest conditions match, then follows choices node to node.
   Choice actions (`do`): accept:q  ready:q  turnin:q  flag:x
                          rest:cost  calm:n  heal:pct  cure
   ===================================================================== */
(function () {
  const E = SF.E, D = E.D;

  E.openDialog = function (s, id) {
    const dl = D.dialogues[id];
    if (!dl) return E.fail('They have nothing to say.');
    const p = s.p;
    const entry = dl.entry.find((en) => !en.if || Object.entries(en.if).every(([q, st]) => E.qStatus(p, q) === st));
    s.dialog = { id, node: entry.node };
    s.scene = 'dialog';
    return true;
  };

  E.dialogView = function (s) {
    if (!s.dialog) return null;
    const dl = D.dialogues[s.dialog.id], node = dl.nodes[s.dialog.node];
    return {
      name: dl.name,
      text: node.text.replace(/%(\w+)%/g, (_, q) => E.questProgress(s.p, q)),
      choices: node.choices.map((c) => c.t),
    };
  };

  E.choose = function (s, a) {
    const dl = D.dialogues[s.dialog.id], node = dl.nodes[s.dialog.node], ch = node.choices[a.i];
    if (!ch) return E.fail(null);
    let go = ch.go;
    for (const op of ch.do || []) {
      const i = op.indexOf(':');
      const redirect = dialogOp(s, i < 0 ? op : op.slice(0, i), i < 0 ? '' : op.slice(i + 1));
      if (redirect) go = redirect;
    }
    if (go && dl.nodes[go]) s.dialog.node = go;
    else E.leave(s);
    return true;
  };

  // Returns a node name to redirect to, or null.
  function dialogOp(s, k, v) {
    const p = s.p, d = E.derived(p), q = D.quests[v];
    switch (k) {
      case 'accept':
        if (q && !p.quests[v]) {
          p.quests[v] = { s: 'active', n: 0 };
          E.log(s, `{y}New quest:{/} ${q.name}. ${q.desc}`);
        }
        break;
      case 'ready':
        E.setReady(s, v);
        break;
      case 'turnin': {
        const st = p.quests[v];
        if (!q || !st || st.s !== 'ready') break;
        st.s = 'done';
        const rw = q.reward;
        p.gold += rw.gold || 0;
        p.shards += rw.shards || 0;
        const parts = [rw.gold && `{y}+${rw.gold} gold{/}`, rw.shards && `{m}+${rw.shards} shards{/}`, rw.xp && `+${rw.xp} XP`].filter(Boolean);
        E.log(s, `{y}Quest complete:{/} ${q.name}! ${parts.join(', ')}.`);
        E.gainXp(s, rw.xp || 0);
        break;
      }
      case 'flag':
        p.flags[v] = true;
        break;
      case 'rest': {
        const cost = Number(v) || 0;
        if (p.gold < cost) return 'poor';
        p.gold -= cost;
        p.hp = d.maxHp; p.st = d.maxSt; p.sp = d.maxSp; p.san = d.maxSan; p.poison = null;
        E.log(s, `{g}You rest and recover fully.{/} {d}(-${cost} gold){/}`);
        E.fx({ t: 'heal', stat: 'all' });
        break;
      }
      case 'calm': {
        const before = p.san;
        p.san = Math.min(d.maxSan, p.san + (Number(v) || 0));
        if (p.san > before) E.log(s, `{m}+${p.san - before} sanity{/}`);
        break;
      }
      case 'heal': {
        const before = p.hp;
        p.hp = Math.min(d.maxHp, p.hp + Math.round((d.maxHp * (Number(v) || 0)) / 100));
        if (p.hp > before) E.log(s, `{g}+${p.hp - before} HP{/}`);
        break;
      }
      case 'cure':
        if (p.poison) { p.poison = null; E.log(s, '{g}The poison leaves your blood.{/}'); }
        break;
    }
    return null;
  }

  E.leave = function (s) {
    s.scene = 'explore';
    s.dialog = null;
    s.shop = null;
    return true;
  };
})();
