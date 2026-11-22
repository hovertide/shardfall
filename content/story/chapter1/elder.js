'use strict';
/* PLACEHOLDER STORY - Elder Maren, the Chapter I quest giver. */
SF.define('dialogues', {
  elder: {
    name: 'Elder Maren',
    entry: [
      { if: { q3: 'done' }, node: 'after' }, { if: { q3: 'ready' }, node: 'q3ready' },
      { if: { q3: 'active' }, node: 'q3active' }, { if: { q2: 'ready' }, node: 'q2ready' },
      { if: { q2: 'active' }, node: 'q2active' }, { if: { q1: 'ready' }, node: 'q1ready' },
      { if: { q1: 'active' }, node: 'q1active' }, { node: 'intro' },
    ],
    nodes: {
      intro: { text: "An old woman leans on a staff of pale ash-wood, watching the sky.\n\"So the Veil spat you out too. Three nights ago the sky cracked like ice and shards rained down like falling stars. The beasts of the Whispering Woods drank the light... and went wrong.\"",
        choices: [{ t: "I'll help. What do you need?", do: ['accept:q1'], go: 'accept' }, { t: 'Who are you?', go: 'who' }, { t: 'Not now.' }] },
      who: { text: "\"Maren. I've kept Emberhollow's ember-well lit for sixty winters.\" She taps her temple. \"The shards hum. You hear them, don't you? That's why you woke here.\"",
        choices: [{ t: 'Tell me about the trouble.', go: 'intro' }, { t: 'Farewell.' }] },
      accept: { text: "\"Cull four of the tainted beasts in the {c}Whispering Woods{/}, east of the village. Bram sells potions in the shop to the west.\"\n\"The {m}Shrine of Echoes{/} ({m}Ω{/}) to the south answers to spirit shards. And if you have legs for it, the goat trail north climbs {c}Ashpeak{/}. Old standing stones up there still hum with power.\"",
        choices: [{ t: "I'm on it." }] },
      q1active: { text: "\"The woods still writhe. Cull the tainted beasts. %q1% so far.\"", choices: [{ t: 'On my way.' }] },
      q1ready: { text: "Maren studies the blood on your blade and nods slowly.\n\"Good. You fight like someone who's done this before, even if you don't remember it.\"",
        choices: [{ t: 'Claim reward', do: ['turnin:q1', 'accept:q2'], go: 'q2intro' }] },
      q2intro: { text: "\"But the beasts were only a symptom. A light burns deep beneath the {c}Hollow Cave{/}, north through the woods. The shards are gathering down there. Find out why.\"",
        choices: [{ t: "I'll go." }] },
      q2active: { text: "\"The Hollow Cave lies north through the woods. The light is deeper still: find the old stairs down. And mind the troll.\"", choices: [{ t: 'Understood.' }] },
      q2ready: { text: "\"You touched it? Then you saw it too. The Warden.\" Her hands tremble on the staff. \"A thing that guards the crack in the sky and keeps it open.\"",
        choices: [{ t: 'Claim reward', do: ['turnin:q2', 'accept:q3'], go: 'q3intro' }] },
      q3intro: { text: "\"It dwells in the {r}Sunken Ruins{/}, south across the river from the woods. End it, wanderer, or we all become like those beasts. Rest at the inn first. Buy steel. Climb the mountain if you must. Grow strong.\"",
        choices: [{ t: 'It ends.' }] },
      q3active: { text: "\"The Warden waits in the Sunken Ruins. Its whispers break minds. Keep your will strong and carry calming tea.\"", choices: [{ t: "I'll be ready." }] },
      q3ready: { text: "The sky above Emberhollow is quiet for the first time in days. Maren weeps openly.\n\"It's done. The Veil is mending. You have Emberhollow's thanks, and mine.\"",
        choices: [{ t: 'Claim reward', do: ['turnin:q3', 'flag:chapter1'], go: 'epilogue' }] },
      epilogue: { text: "{y}~ CHAPTER I COMPLETE ~{/}\n\"But shards still fall, far beyond these hills. The Veil cracked in more than one place.\" She presses a warm ember-stone into your palm. \"When you're ready, the road east waits.\"\n{d}(Thanks for playing! Keep exploring: the journal and the mountain still hold secrets.){/}",
        choices: [{ t: 'Continue.' }] },
      after: { text: "\"The sky is quiet, but I still hear the shards humming. Rest well, wanderer.\"", choices: [{ t: 'Farewell.' }] },
    },
  },
});
