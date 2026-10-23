<script lang="ts">
  import type { Snippet } from 'svelte';
  import { navigating } from '$app/state';

  let { children }: { children: Snippet } = $props();
</script>

<div class="arcade-shell">
  {#if navigating.to}
    <p class="navigation-status" role="status">Apro il gioco…</p>
  {/if}
  {@render children()}
</div>

<style>
  .navigation-status { position: fixed; z-index: 100; bottom: 16px; left: 50%; transform: translateX(-50%); margin: 0; padding: 8px 16px; border-radius: 8px; background: #102f36; color: #fff6e5; }
</style>
