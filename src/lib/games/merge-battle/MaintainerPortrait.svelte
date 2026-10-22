<script lang="ts">
  import { maintainerArt } from './maintainer-art';
  import { trials } from './engine';

  let { trial }: { trial: number } = $props();
  const source = $derived(maintainerArt(trial));
</script>

{#if source}
  <img class="maintainer-portrait" src={source} alt={`Maintainer: ${trials[trial].jury}`}
    width="640" height="640" decoding="async" draggable="false" />
{/if}

<style>
  .maintainer-portrait { display: block; width: 100%; height: auto; aspect-ratio: 1; object-fit: contain; }
</style>
