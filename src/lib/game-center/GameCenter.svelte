<script lang="ts">
  import type { Snippet } from 'svelte';
  import { page, navigating } from '$app/state';

  let { children }: { children: Snippet } = $props();
</script>

<div class="arcade-shell">
  {#if page.url.pathname !== '/' && page.url.pathname !== '/merge-battle'}
    <div class="center-return">
      <a href="/">← Torna al Game Center</a>
      <span>BacaroTech</span>
    </div>
  {/if}
  {#if navigating.to}
    <p class="navigation-status" role="status">Apro il gioco…</p>
  {/if}
  {@render children()}
</div>

<style>
  .navigation-status { position: fixed; z-index: 100; bottom: 16px; left: 50%; transform: translateX(-50%); margin: 0; padding: 8px 16px; border-radius: 8px; background: #102f36; color: #fff6e5; }
  .center-return{display:flex;justify-content:space-between;align-items:center;gap:12px;max-width:1120px;margin:auto;padding:12px 28px;border-bottom:1px solid var(--arcade-border);font-size:13px}
  .center-return a{display:inline-flex;align-items:center;min-height:44px;font-weight:700;text-underline-offset:4px}.center-return span{font-size:12px;color:var(--arcade-muted)}
  @media(max-width:650px){.center-return{padding:6px 16px}.center-return span{display:none}}
</style>
