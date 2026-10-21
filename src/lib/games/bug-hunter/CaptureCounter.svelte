<script lang="ts">
  import { untrack } from 'svelte';
  import { bugs } from './content';
  import { ABILITY_THRESHOLDS } from './mechanics';

  let { caught, capture, collection, charges, oninspect } = $props<{
    caught: number;
    capture: number;
    collection: number[];
    charges: number[];
    oninspect: () => void;
  }>();
  let dismissed = $state(false);
  let pinned = $state(false);
  let highlighted = $state(-1);
  let previousCollection = [0, 0, 0, 0];
  const totalCaught = $derived(caught);
  const automatic = $derived(capture > 0 && highlighted >= 0 && !dismissed);
  const expanded = $derived(automatic || pinned);

  $effect(() => {
    const total = totalCaught;
    untrack(() => {
      if (total === 0) {
        dismissed = false;
        pinned = false;
        highlighted = -1;
      } else {
        highlighted = collection.findIndex((count: number, index: number) => count > previousCollection[index]);
        dismissed = false;
      }
      previousCollection = [...collection];
    });
  });

  function toggle(event: MouseEvent) {
    const wasExpanded = expanded;
    dismissed = true;
    pinned = !wasExpanded;
    if (event.detail > 0) oninspect();
  }
</script>

<div class="captures">
  <button
    class="capture-toggle"
    class:recent={automatic}
    aria-label={`${expanded ? 'Nascondi' : 'Mostra'} dettagli dei bug catturati: ${caught}`}
    aria-expanded={expanded}
    aria-controls="bug-capture-details"
    onclick={toggle}
  >
    <span aria-hidden="true">🫙</span>
    <span class="sr-only" data-testid="bug-count">{caught}</span>
  </button>
  {#if expanded}
    <section id="bug-capture-details" class:automatic={automatic && !pinned} aria-label="Bug catturati">
      <strong>{caught} bug al sicuro</strong>
      <div class="species">
        {#each bugs as bug, index}
          {#if pinned || highlighted === index}
          <div
            class:highlighted={highlighted === index}
            data-captured={highlighted === index}
            style:--bug-color={`#${bug.color.toString(16).padStart(6, '0')}`}
          >
            <span class="swatch" aria-hidden="true">{['◌', '↶', '!', '✦'][index]}</span>
            <div>
              <b>{bug.name.replace(' Bug', '')}</b>
              <small>Abilità {charges[index]}/{ABILITY_THRESHOLDS[index]}</small>
            </div>
            <strong>× {collection[index]}</strong>
          </div>
          {/if}
        {/each}
      </div>
    </section>
  {/if}
</div>

<style>
  .captures { position: relative; pointer-events: auto; }
  .capture-toggle {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    padding: 0;
    border: 2px solid #46328b;
    border-radius: 50%;
    background: #fff4d7;
    font-size: 28px;
    cursor: pointer;
  }
  .capture-toggle:hover:not(:disabled) { background: #ffdf6f; }
  .capture-toggle.recent { background: #ffdf6fbd; }
  .capture-toggle:focus-visible { outline: 3px solid #46328b; outline-offset: 4px; }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  section {
    position: absolute;
    top: 54px;
    right: 0;
    width: max-content;
    max-width: calc(100vw - 32px);
    box-sizing: border-box;
    padding: 7px;
    border: 1px solid #46328ba6;
    border-radius: 12px;
    background: #fff4d7d9;
    color: #30264e;
    box-shadow: 0 3px 10px #30264e18;
    font-size: 12px;
  }
  section.automatic { background: #fff4d7ad; }
  .species { display: grid; gap: 2px; margin-top: 4px; }
  .species > div { display: flex; align-items: center; gap: 5px; padding: 3px; border-radius: 7px; }
  .species > div.highlighted { background: color-mix(in srgb, var(--bug-color) 45%, transparent); box-shadow: inset 2px 0 #46328b; }
  .species > div > div { min-width: 0; }
  .species b { font-size: 12px; }
  .species small { display: block; margin-top: 0; font-size: 10px; }
  .swatch { width: 18px; text-align: center; font-size: 16px; color: #30264e; }
  @media (max-height: 450px) {
    section { top: 50px; padding: 5px; }
    .species { gap: 2px; margin-top: 4px; }
    .species > div { padding: 2px 3px; }
  }
</style>
