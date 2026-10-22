<script lang="ts">
  import { roleCards, characters } from './engine';
  import { AXES } from './cards';
  import type { MergeConfig } from './config';

  let { id, config, expanded = false }: { id: number; config: MergeConfig; expanded?: boolean } = $props();
  const cards = $derived(roleCards(config, id));
</script>

<details class="character-moves" open={expanded}>
  <summary>Mosse di {characters[id].name}</summary>
  <p class="hint">Queste sono le carte che potrai giocare scegliendo questo ruolo.</p>
  <ul>
    {#each cards as card}
      <li>
        <strong>{card.icon} {card.name}</strong>
        {#if card.description}<p>{card.description}</p>{/if}
        <dl>{#each config.activeAxes as axis}<div><dt>{AXES[axis]}</dt><dd>{card.stats[axis]}</dd></div>{/each}</dl>
      </li>
    {/each}
  </ul>
</details>

<style>
  .character-moves { margin: 12px 0; padding: 12px; border-radius: 8px; background: var(--comic-paper); text-align: left; color: var(--comic-ink); }
  summary { cursor: pointer; min-height: 44px; align-content: center; font-weight: 800; }
  .hint { font-size: 13px; line-height: 1.5; }
  ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
  li { padding: 12px; border: 1px solid var(--comic-border); border-radius: 8px; background: var(--comic-paper); overflow-wrap: anywhere; }
  strong { display: block; font-size: 15px; }
  p { font-size: 13px; line-height: 1.5; }
  dl { display: flex; flex-wrap: wrap; gap: 6px 14px; margin: 8px 0 0; font-size: 13px; }
  dl div { display: flex; gap: 6px; }
  dd { margin: 0; font-weight: 850; }
</style>
