<script lang="ts">
  import Fighter from './Fighter.svelte';
  import { characters, resolve, type Mode } from './engine';
  import type { MergeConfig } from './config';

  let {
    ids, moves, trial, stage, config, mode
  }: {
    ids: number[];
    moves: string[];
    trial: number;
    stage: number;
    config: MergeConfig;
    mode: Mode;
  } = $props();

  let result = $derived(resolve(ids, moves, trial, config));
</script>

<section class="mb-arena" class:mb-action={stage >= 5} class:mb-verdict={stage >= 6} aria-label="Arena della battaglia">
  <div class="arena-call" aria-live="polite">
    {#if stage < 4}<span class="mb-count">{['3', '2', '1', 'Carte in tavola!'][stage]}</span>
    {:else if stage < 6}<span>Si fa il merge…</span>
    {:else}<span>{result.winner === null ? 'Alla pari!' : 'Review completata!'}</span>{/if}
  </div>
  <div class="contenders">
    {#each ids as id, index}
      <div class="mb-contender" class:mb-right={index === 1} class:mb-winner={stage >= 6 && result.winner === index}>
        <span class="owner">{index === 1 && mode === 'solo' ? 'Computer' : `Player ${index + 1}`}</span>
        <Fighter {id} size="large" eager emotion={stage >= 6 && result.winner === index ? 'win' : 'ready'} />
        <strong class="role-name">{characters[id].short}</strong>
        {#if stage >= 4}
          <div class="played-card">
            <span class="mb-prop" aria-hidden="true">{config.cards.find(card => card.id === moves[index])?.icon}</span>
            <b>{config.cards.find(card => card.id === moves[index])?.name}</b>
          </div>
        {:else}
          <div class="card-back" aria-label="Carta coperta">?</div>
        {/if}
        {#if stage >= 5}<span class="score">{result.scores[index]} <small>punti</small></span>{/if}
      </div>
    {/each}
    <span class="versus" aria-hidden="true">VS</span>
  </div>
</section>

<style>
  .mb-arena { position: relative; isolation: isolate; border: 3px solid var(--comic-border); border-radius: 8px; background: var(--comic-blue); padding: 24px 22px; margin: 20px 0; box-shadow: 5px 6px 0 var(--comic-shadow); }
  .arena-call { position: relative; z-index: 2; min-height: 60px; text-align: center; }
  .arena-call > span { display: inline-block; border: 3px solid var(--comic-border); background: var(--comic-paper); padding: 8px 20px; box-shadow: 3px 3px 0 var(--comic-shadow); font: 900 24px/1.15 var(--comic-display); transform: rotate(-3deg); }
  .arena-call .mb-count { background: var(--comic-yellow); color: var(--comic-on-accent); min-width: 80px; }
  .contenders { position: relative; display: grid; grid-template-columns: 1fr 1fr; gap: 70px; }
  .mb-contender { display: flex; flex-direction: column; align-items: center; min-width: 0; }
  .owner { font-size: 12px; font-weight: 700; margin-top: 8px; }
  .role-name { font: 900 24px/1.1 var(--comic-display); margin-bottom: 18px; text-align: center; }
  .versus { position: absolute; top: 32%; left: 50%; transform: translate(-50%, -50%) rotate(-10deg); font: italic 900 clamp(28px, 5vw, 52px)/1 var(--comic-display); background: var(--comic-orange); color: var(--comic-on-accent); border: 3px solid; padding: 14px 10px; border-radius: 50%; box-shadow: 3px 3px 0 var(--comic-shadow); }
  .played-card { display: flex; align-items: center; gap: 12px; border: 2px solid; background: var(--comic-paper); border-radius: 6px; padding: 12px; min-height: 85px; width: 100%; font-size: 16px; line-height: 1.25; animation: reveal 300ms ease-out both; }
  .played-card b { overflow-wrap: anywhere; }
  .mb-prop { font-size: 30px; flex-shrink: 0; }
  .card-back { display: grid; place-items: center; height: 85px; width: 66px; background: var(--comic-teal); color: var(--comic-ink); border: 3px solid var(--comic-border); border-radius: 6px; font-size: 32px; font-weight: 900; transform: rotate(-8deg); }
  .mb-right .card-back { transform: rotate(8deg); }
  .score { margin-top: 16px; font: 900 38px/1 var(--comic-display); }
  .score small { font: 600 12px/1 system-ui, sans-serif; }
  .mb-winner .score { background: var(--comic-yellow); color: var(--comic-on-accent); outline: 2px solid var(--comic-border); border-radius: 4px; padding: 6px 12px; transform: rotate(-4deg); }
  .mb-action .played-card { animation: collide 450ms ease-out; }
  @keyframes reveal { from { transform: translateY(20px) rotate(-5deg); opacity: 0; } to { transform: none; opacity: 1; } }
  @keyframes collide { 50% { transform: translateX(12px) rotate(3deg); } }
  @media (max-width: 600px) {
    .mb-arena { padding: 20px 10px; }
    .contenders { gap: 30px; }
    .arena-call > span { font-size: 20px; }
    .role-name { font-size: 18px; margin-bottom: 12px; }
    .played-card { flex-direction: column; align-items: flex-start; padding: 10px; font-size: 13px; min-height: 120px; gap: 6px; }
    .mb-prop { font-size: 23px; }
    .versus { padding: 9px 5px; border-width: 2px; top: 25%; }
    .score { font-size: 30px; }
  }
  @media (prefers-reduced-motion: reduce) { .played-card, .mb-action .played-card { animation: none; } }
</style>
