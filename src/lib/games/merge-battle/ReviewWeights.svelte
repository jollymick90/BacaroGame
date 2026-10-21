<script lang="ts">
  import { AXES } from './cards';
  let { weights, activeAxes }: { weights: number[]; activeAxes: number[] } = $props();
</script>

<div class="weights" style:--axis-count={activeAxes.length} aria-label="Pesi del maintainer">
  {#each activeAxes as index}
    <span class:priority={weights[index] === Math.max(...activeAxes.map(axis => weights[axis]))}>
      {AXES[index]} <b>×{weights[index]}</b>
    </span>
  {/each}
</div>

<style>
  .weights { display: grid; grid-template-columns: repeat(var(--axis-count), minmax(0, 1fr)); gap: 8px; }
  span { display: flex; justify-content: space-between; align-items: center; gap: 8px; border: 1.5px solid var(--comic-border); border-radius: 5px; padding: 9px 12px; font-size: 13px; background: var(--comic-paper); }
  b { font-size: 18px; white-space: nowrap; }
  .priority { background: var(--comic-yellow); color: var(--comic-on-accent); }
  @media (max-width: 600px) { .weights { grid-template-columns: repeat(min(2, var(--axis-count)), minmax(0, 1fr)); gap: 6px; } span { padding: 6px 9px; } }
</style>
