'use strict';
/* =====================================================================
   Regions group maps together. A region with several `levels` is
   vertical: the side panel shows an altitude gauge for it, and moving
   between its levels plays a climb / descend transition.
   levels are listed from TOP to BOTTOM.
   ===================================================================== */
SF.define('regions', {
  emberhollow: { name: 'Emberhollow', levels: ['village'] },
  woods:       { name: 'Whispering Woods', levels: ['woods'] },
  hollow_cave: {
    name: 'Hollow Cave', shape: 'cave', levels: ['cave', 'cave_depths'],
    climb: { down: 'You descend the worn steps. The dark presses in close.', up: 'You climb back toward the faint light above.' },
  },
  ashpeak: {
    name: 'Ashpeak', shape: 'mountain', levels: ['summit', 'ridge', 'switchbacks', 'foothills'],
    climb: { up: 'You climb higher. The air grows thin and cold.', down: 'You pick your way back down the mountain.' },
  },
  ruins:       { name: 'Sunken Ruins', levels: ['ruins'] },
});
