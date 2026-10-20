<script lang="ts">
  import { AXES, type Card } from './cards';
  let { card, index, onplay }: { card: Card; index: number; onplay: () => void } = $props();
  const componentId = $props.id();
</script>

<article class="move">
  <button class="mb-card" onclick={onplay} aria-label={`Gioca: ${card.name}`} aria-describedby={`${componentId}-values`}>
    <span class="card-top"><span>Mossa {index + 1}</span><b aria-hidden="true">{card.icon}</b></span>
    <strong class="card-name">{card.name}</strong>
    <span class="card-values" id={`${componentId}-values`}>
      {#each AXES as axis, position}
        <span>
          <span>{axis}</span>
          <span class="meter" aria-hidden="true">
            {#each Array(6) as _, point}<i class:filled={point < card.stats[position]}></i>{/each}
          </span>
          <b>{card.stats[position]}</b>
        </span>
      {/each}
    </span>
    <span class="card-bottom">Gioca questa carta <span aria-hidden="true">↗</span></span>
  </button>
  {#if card.description}
    <details><summary>Dettagli della mossa</summary><p>{card.description}</p></details>
  {/if}
</article>

<style>
  .move { min-width: 0; display: flex; flex-direction: column; }
  .mb-card { display: flex; flex: 1; flex-direction: column; width: 100%; min-width: 0; border: 3px solid var(--comic-ink); border-radius: 8px; padding: 16px; background: var(--comic-paper); color: var(--comic-ink); text-align: left; box-shadow: 4px 5px 0 var(--comic-ink); transition: transform 150ms, box-shadow 150ms; }
  .mb-card:hover:not(:disabled) { transform: translateY(-4px) rotate(-1deg); background: #fffdf8; box-shadow: 5px 9px 0 var(--comic-ink); }
  .mb-card:active:not(:disabled) { transform: translate(3px, 4px); box-shadow: 1px 1px 0 var(--comic-ink); }
  .card-top { display: flex; align-items: center; justify-content: space-between; width: 100%; font-size: 12px; }
  .card-top b { display: grid; place-items: center; border: 2px solid; border-radius: 50%; width: 38px; height: 38px; background: var(--comic-yellow); font-size: 25px; line-height: 1; }
  .card-name { display: block; padding: 16px 0 22px; font: 800 22px/1.15 var(--comic-display); overflow-wrap: anywhere; }
  .card-values { display: grid; gap: 8px; width: 100%; margin-top: auto; padding-bottom: 16px; }
  .card-values > span { display: flex; gap: 8px; align-items: center; font-size: 12px; }
  .card-values > span > span:first-child { width: 80px; flex-shrink: 0; font-weight: 500; }
  .meter { display: flex; flex: 1; gap: 3px; }
  .meter i { height: 10px; flex: 1; border: 1px solid #92a7a3; border-radius: 1px; }
  .meter .filled { background: var(--comic-teal); border-color: var(--comic-teal); }
  .card-values b { font-size: 16px; width: 12px; text-align: right; }
  .card-bottom { border-top: 2px solid var(--comic-ink); display: flex; width: 100%; justify-content: space-between; padding-top: 12px; font-size: 14px; }
  details { margin: 12px 4px 0; font-size: 13px; }
  summary { cursor: pointer; min-height: 44px; align-content: center; }
  p { overflow-wrap: anywhere; margin-top: 0; }
  @media (max-width: 700px) {
    .mb-card { padding: 13px 16px; }
    .card-name { font-size: 21px; padding: 8px 0 16px; }
    .card-values { grid-template-columns: 1fr 1fr; gap: 6px 16px; padding-bottom: 12px; }
    .card-values > span { justify-content: space-between; }
    .meter { display: none; }
    .card-values > span > span:first-child { width: auto; }
    .card-top b { width: 30px; height: 30px; font-size: 22px; }
  }
  @media (prefers-reduced-motion: reduce) { .mb-card { transition: none; } .mb-card:hover:not(:disabled) { transform: none; } }
</style>
