<script lang="ts">
  import { onMount } from 'svelte';
  import type { mountOctopusShowcase } from './octopus-showcase';
  let { venice = false }: { venice?: boolean } = $props();
  let host: HTMLDivElement;
  let loaded = $state(false);
  onMount(() => {
    let disposed = false;
    let loading = false;
    let visible = false;
    let scene: ReturnType<typeof mountOctopusShowcase> | undefined;
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      scene?.setVisible(visible);
      if (!visible || loading) return;
      loading = true;
      void import('./octopus-showcase').then(({ mountOctopusShowcase }) => {
        if (disposed) return;
        try {
          scene = mountOctopusShowcase(host, venice);
          scene.setVisible(visible);
          loaded = true;
        } catch {
          // Keep the illustrated mascot when WebGL is unavailable.
        }
      }).catch(() => {});
    });
    observer.observe(host);
    return () => { disposed = true; observer.disconnect(); scene?.dispose(); };
  });
</script>
<div class="octopus-showcase" class:venice role="img" aria-label={venice ? 'Il polpo Bacaro corre a Venezia' : 'Il tuo premio: il polpo Bacaro 3D'}>
  {#if !loaded}<img class="fallback" src="/images/merge-battle/full-stack.webp" alt="" width="640" height="640" />{/if}
  <div class="canvas-host" bind:this={host}></div>
</div>
<style>
  .octopus-showcase { position: relative; width: 100%; height: 100%; min-height: 180px; }
  .canvas-host { position: absolute; inset: 0; }
  .canvas-host :global(canvas) { display: block; width: 100%; height: 100%; }
  .fallback { display: block; width: 100%; height: 100%; object-fit: contain; position: absolute; inset: 0; }
  .venice { background: #b8dde0; }
</style>
