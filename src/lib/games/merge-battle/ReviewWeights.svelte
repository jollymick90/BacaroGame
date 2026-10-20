<script lang="ts">
  import { AXES } from './cards';
  let { weights }: { weights: number[] } = $props();
</script>

<div class="weights" aria-label="Pesi del maintainer">
  {#each AXES as axis, index}
    <span class:priority={weights[index] === Math.max(...weights)}>
      {axis} <b>×{weights[index]}</b>
    </span>
  {/each}
</div>

<style>
  .weights { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
  span { display: flex; justify-content: space-between; align-items: center; gap: 8px; border: 1.5px solid var(--comic-ink); border-radius: 5px; padding: 9px 12px; font-size: 13px; background: var(--comic-paper); }
  b { font-size: 18px; white-space: nowrap; }
  .priority { background: var(--comic-yellow); }
  @media (max-width: 600px) { .weights { grid-template-columns: 1fr 1fr; gap: 6px; } span { padding: 6px 9px; } }
</style>
