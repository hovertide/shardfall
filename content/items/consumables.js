'use strict';
/* Usable items. stat: hp | st | sp | san (restore `amt`), cure (poison), flee. */
SF.define('items', {
  hp_potion:  { name: 'Health Potion', price: 15, stat: 'hp', amt: 40, desc: 'Restore 40 HP (+2 per VIT).' },
  st_tonic:   { name: 'Stamina Tonic', price: 12, stat: 'st', amt: 30, desc: 'Restore 30 stamina.' },
  sp_draught: { name: 'Spirit Draught', price: 15, stat: 'sp', amt: 30, desc: 'Restore 30 spirit.' },
  calm_tea:   { name: 'Calming Tea', price: 20, stat: 'san', amt: 40, desc: 'Restore 40 sanity.' },
  antidote:   { name: 'Antidote', price: 10, stat: 'cure', desc: 'Cure poison.' },
  smoke_bomb: { name: 'Smoke Bomb', price: 25, stat: 'flee', combatOnly: true, desc: 'Escape any non-boss fight.' },
});
