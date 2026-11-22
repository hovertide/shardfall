'use strict';
/* =====================================================================
   PLACEHOLDER STORY - Chapter I quests.
   Everything story-related lives in content/story/, so it can be
   replaced wholesale once the real storyline is decided.
   ===================================================================== */
SF.define('quests', {
  q1: { name: 'Rot in the Woods', giver: 'Elder Maren', short: 'cull beasts in the woods',
    desc: 'Cull 4 tainted creatures in the Whispering Woods, east of the village.',
    kill: { map: 'woods', n: 4 }, reward: { gold: 40, shards: 5, xp: 30 } },
  q2: { name: 'Light in the Hollow', giver: 'Elder Maren', short: 'find the light in Hollow Cave',
    desc: 'Find the source of the shard-light deep in the Hollow Cave, north through the woods. Look for a way down.',
    reward: { gold: 80, shards: 10, xp: 80 } },
  q3: { name: 'The Veil Warden', giver: 'Elder Maren', short: 'slay the Veil Warden',
    desc: 'Slay the Veil Warden in the Sunken Ruins, south of the woods across the river.',
    reward: { gold: 250, shards: 25, xp: 0 } },
});
