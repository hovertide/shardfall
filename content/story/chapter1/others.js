'use strict';
/* PLACEHOLDER STORY - the hermit, the innkeeper, and the shard altar. */
SF.define('dialogues', {
  hermit: {
    name: 'Old Hermit',
    entry: [{ node: 'main' }],
    nodes: {
      main: { text: "A hermit in moss-green rags stirs a bubbling pot.\n\"Sit, sit. The woods are loud lately. Loud minds break easy.\"",
        choices: [{ t: 'Share his stew', do: ['heal:40', 'calm:25', 'cure'], go: 'stew' }, { t: 'Ask about the shards', go: 'lore' },
          { t: 'Ask about willpower', go: 'will' }, { t: 'Ask about fighting', go: 'fight' }, { t: 'Leave' }] },
      stew: { text: 'The stew tastes of mushrooms and smoke. Warmth spreads through you, and any poison in your blood fades.', choices: [{ t: 'Thank him', go: 'main' }] },
      lore: { text: "\"The shards are memories, child. Echoes of lives that might have been. The shrine in the village coaxes them out: faces, colors, names. Vanity, mostly. Pretty vanity.\"", choices: [{ t: 'Back', go: 'main' }] },
      will: { text: "\"Willpower lets you stand when your body says fall. Bleed past zero and keep swinging. Hurt bad enough and it makes you fierce. And when the dead whisper, will keeps you sane.\"", choices: [{ t: 'Back', go: 'main' }] },
      fight: { text: "\"Watch what a beast means to do before it does it. When one winds up something big, raise your guard: catch the blow right and you can cut back before it recovers. And keep a journal. Every creature has something it fears.\"", choices: [{ t: 'Back', go: 'main' }] },
    },
  },
  inn: {
    name: 'Tobba the Innkeeper',
    entry: [{ node: 'main' }],
    nodes: {
      main: { text: "Tobba polishes a mug that will never be clean.\n\"A bed's 10 gold. Best sleep in Emberhollow. Only sleep in Emberhollow, really.\"",
        choices: [{ t: 'Rest (10 gold)', do: ['rest:10'], go: 'rested' }, { t: 'Leave' }] },
      rested: { text: 'You sleep without dreams. When you wake, the ember-light through the shutters feels like a promise.', choices: [{ t: 'Leave' }] },
      poor: { text: "\"No coin, no cot. The woods are full of coin, I hear. Mostly on things that bite.\"", choices: [{ t: 'Leave' }] },
    },
  },
  altar: {
    name: 'Shard Altar',
    entry: [{ if: { q2: 'active' }, node: 'touch' }, { node: 'idle' }],
    nodes: {
      touch: { text: 'A jagged shard the size of a man floats above a stone altar, pulsing with cold light. The air hums in your teeth.',
        choices: [{ t: 'Touch the shard', do: ['flag:altar', 'ready:q2'], go: 'vision' }, { t: 'Step back' }] },
      vision: { text: "{c}Light floods your mind.{/} You see ruins sunk beneath black water, and a towering figure of shadow and eyes holding the crack in the sky open with both hands.\n{r}The Veil Warden.{/}\nThe vision snaps shut. You should tell Maren.",
        choices: [{ t: 'Leave' }] },
      idle: { text: 'The great shard drifts silently above its altar. Its light seems to watch you.', choices: [{ t: 'Leave' }] },
    },
  },
});
