'use strict';
/* =====================================================================
   SHARDFALL engine - api.js
   The only thing the UI (or a future server) talks to:

     const res = Engine.act(state, { type: 'move', dx: 1, dy: 0 });
     // res = { ok, msg, fx: [...] }    state is updated in place

   ACTIONS                              allowed in scene(s)
     move     {dx, dy}                  explore  (walking into things = interact)
     attack   {target, q}               combat   q = perfect | good | weak (strike bar)
     skill    {id, target, q}           combat   sword skills, cost stamina
     spell    {id, target}              combat   spells, cost spirit
     defend / flee                      combat
     use      {id}                      explore, combat, shop
     equip    {id}                      explore, shop
     alloc    {stat}                    explore, shop, shrine, dialog
     cosmetic {id}                      explore, shop, shrine, dialog
     choose   {i}                       dialog
     buy {id} / sell {id}               shop
     pull     {n: 1 | 10}               shrine
     leave                              dialog, shop, shrine
     respawn                            gameover

   FX (animation hints, each has n = log length when it happened):
     start act ehit eheal phit hhit emove dodge kill burn freeze frozen
     dread steal sap poison phase heal win lose flee level pull travel
     hop strain secret chest stone vista buy
   ===================================================================== */
var Engine = (function () {
  const E = SF.E, D = E.D;

  const NOT_COMBAT = ['explore', 'shop', 'shrine', 'dialog'];
  const HANDLERS = {
    move:     [['explore'], E.move],
    attack:   [['combat'], E.combatTurn],
    skill:    [['combat'], E.combatTurn],
    spell:    [['combat'], E.combatTurn],
    defend:   [['combat'], E.combatTurn],
    flee:     [['combat'], E.combatTurn],
    use:      [['explore', 'combat', 'shop'], E.useItem],
    equip:    [['explore', 'shop'], E.equip],
    alloc:    [NOT_COMBAT, E.alloc],
    cosmetic: [NOT_COMBAT, E.wearCosmetic],
    choose:   [['dialog'], E.choose],
    buy:      [['shop'], E.buy],
    sell:     [['shop'], E.sell],
    pull:     [['shrine'], E.pull],
    leave:    [['dialog', 'shop', 'shrine'], E.leave],
    respawn:  [['gameover'], E.respawn],
  };

  function act(s, a) {
    E.OUT = { ok: true, msg: null, fx: [] };
    E.CUR = s;
    const h = a && HANDLERS[a.type];
    if (!h) E.fail('Unknown action.');
    else if (!h[0].includes(s.scene)) { E.OUT.ok = false; E.OUT.msg = 'wrong scene'; }
    else h[1](s, a);
    const out = E.OUT;
    E.OUT = null;
    E.CUR = null;
    return out;
  }

  return {
    SAVE_VERSION: E.SAVE_VERSION, data: D, problems: SF.problems,
    newGame: E.newGame, act, save: E.save, load: E.load, note: E.log,
    // character
    derived: E.derived, fury: E.fury, conditions: E.conditions, xpNeed: E.xpNeed, look: E.look, knows: E.knows,
    // world
    map: E.mapView, cell: (s, x, y) => E.cell(s, E.mapOf(s), x, y), fov: E.fov,
    seen: (s) => E.seenArr(s, s.p.map), path: E.path, places: E.places, explored: (s) => E.explored(s, s.p.map),
    // menus
    dialogView: E.dialogView, questLog: E.questLog, abilities: E.abilities, inventory: E.inventory,
    shopList: E.shopList, sellPrice: E.sellPrice, journal: E.journal,
    intent: (s, e) => E.intentInfo(s, e),
  };
})();

if (typeof module !== 'undefined') module.exports = { Engine };
