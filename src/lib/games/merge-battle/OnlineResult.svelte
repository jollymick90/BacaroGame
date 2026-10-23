<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from './engine';
  import type { RoomView } from './online';
  import BattleArena from './BattleArena.svelte';
  import Fighter from './Fighter.svelte';
  import ScoreComparison from './ScoreComparison.svelte';
  import OctopusPrize from '$lib/mascot/OctopusPrize.svelte';

  let { session, actor }: { session: RoomView['session']; actor: number } = $props();
  const round = $derived(session.round);
  const result = $derived(resolve(session.ids as number[], session.moves as string[], session.trial, session.config));
  const won = $derived(result.winner === actor);
  let stage = $state(0);
  let heading: HTMLHeadingElement;
  onMount(() => {
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  $effect(() => {
    round;
    stage = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timings = [450, 900, 1350, 1800, 2400, 3000];
    const timers = timings.map((delay, index) => window.setTimeout(() => stage = index + 1, reduced ? (index + 1) * 90 : delay));
    return () => timers.forEach(clearTimeout);
  });
</script>

<section class="online-result" aria-label="Risultato della sfida" data-result-ready={stage >= 6}>
  <p class="owner">Player {actor + 1} · Tu</p>
  <h2 bind:this={heading} tabindex="-1" class:lost={result.winner !== null && !won}>{result.winner === null ? 'Pareggio!' : won ? 'Hai vinto!' : 'Hai perso!'}</h2>
  <BattleArena ids={session.ids as number[]} moves={session.moves as string[]} trial={session.trial} config={session.config} mode="local" {stage} />
  {#if stage >= 6}
    <p class="verdict">{result.winner === null ? 'Le due soluzioni hanno lo stesso punteggio.' : won ? 'La tua soluzione ha convinto il reviewer!' : 'Il reviewer ha scelto la soluzione del tuo collega.'}</p>
    {#if won}<OctopusPrize />{/if}
    <div class="merge-summary">
      <div class="merge-art"><Fighter id={session.ids[0]!} other={session.ids[1]!} emotion="win" eager /></div>
      <div><span>Il vostro merge</span><h3>{result.hybrid}</h3><p>Due idee diverse, un nuovo risultato insieme.</p></div>
    </div>
    <details class="score-details"><summary>Come sono stati calcolati i punti?</summary>
      <ScoreComparison cards={session.moves.map(id => session.config.cards.find(card => card.id === id)!)} weights={session.config.weights[session.trial]} activeAxes={session.config.activeAxes} labels={actor === 0 ? ['Tu', 'Collega'] : ['Collega', 'Tu']} />
    </details>
  {/if}
</section>

<style>
  .online-result { --comic-paper: #17171f; --comic-panel: #23232e; --comic-ink: #f6f3ea; --comic-border: #77758c; --comic-blue: #23232e; --comic-orange: #ff9d63; --comic-teal: #164e58; --comic-display: 'Trebuchet MS', ui-sans-serif, system-ui, sans-serif; margin-top: 24px; color: #f6f3ea; }
  .owner { color: #c9c9d8; margin: 0 0 8px; }
  h2 { color: #00e5a3; font-size: clamp(32px, 6vw, 48px); margin: 0 0 16px; }
  h2.lost { color: #ff9abd; }
  .verdict { font-size: 20px; font-weight: 800; }
  .merge-summary { display: flex; align-items: center; gap: 24px; padding: 20px; margin: 24px 0; border: 2px solid #b9a1fb; border-radius: 14px; background: #23232e; }
  .merge-art { width: 240px; flex-shrink: 0; }
  .merge-summary span { color: #b9a1fb; font-weight: 800; }
  h3 { font-size: 26px; margin: 8px 0; }
  .score-details { margin: 24px 0; }
  summary { min-height: 44px; align-content: center; cursor: pointer; font-weight: 800; }
  @media(max-width:600px) { .merge-summary { flex-direction: column; text-align: center; } .merge-art { width: min(100%, 240px); } }
</style>
