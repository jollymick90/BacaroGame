<script lang="ts">
  import type { Snippet } from 'svelte';
  import { EVENT_NAME } from './event-branding';
  let { actions, sticky = false, compactBrand = false, label = 'Navigazione principale', navigationClass = '' }: {
    actions?: Snippet;
    sticky?: boolean;
    compactBrand?: boolean;
    label?: string;
    navigationClass?: string;
  } = $props();
</script>

<header class="site-header" class:sticky class:compact-brand={compactBrand}>
  <nav aria-label={label} class={navigationClass}>
    <div class="brand">
      <a class="home-link" href="/" aria-label="Home" title="Home"><img src="/bacarotech-logo.png" alt="" width="44" height="44" /></a>
      <span class="brand-copy">BacaroTech<small>Game Center · {EVENT_NAME}</small></span>
    </div>
    {#if actions}<div class="header-actions">{@render actions()}</div>{/if}
  </nav>
</header>

<style>
  .site-header { display: block; height: auto; min-height: 72px; background: #323258; color: #f6f3ea; border: 0; border-bottom: 1px solid #77758c; }
  .site-header.sticky { position: sticky; top: 0; z-index: 30; }
  nav { display: flex; align-items: center; justify-content: space-between; gap: 16px; max-width: 1120px; min-height: 72px; margin: auto; padding: 10px 28px; border: 0; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .home-link { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; flex-shrink: 0; border-radius: 6px; }
  img { display: block; width: 44px; height: 44px; object-fit: contain; }
  .brand-copy { font-size: 19px; line-height: 1.2; font-weight: 850; }
  small { display: block; margin-top: 4px; font-size: 12px; font-weight: 500; color: #dfdcef; }
  .header-actions { display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap; gap: 8px; margin-left: auto; }
  nav .header-actions :global(button), nav .header-actions :global(a) { flex: none; white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 8px 12px; border: 1px solid #9c98b7; border-radius: 8px; color: #f6f3ea; background: transparent; text-decoration: none; font-size: 13px; font-weight: 750; }
  nav .header-actions :global(button:hover:not(:disabled)), nav .header-actions :global(a:hover) { background: #45456e; color: #f6f3ea; }
  @media(max-width:650px) { nav { padding: 8px 16px; gap: 12px; } .compact-brand .brand-copy { display: none; } .header-actions :global(button), .header-actions :global(a) { font-size: 12px; padding: 6px 8px; } .brand-copy { font-size: 16px; } small { font-size: 10px; } }
  @media(max-width:380px) { nav { gap: 8px; } .header-actions { gap: 6px; } nav .header-actions :global(button), nav .header-actions :global(a) { font-size: 11px; padding: 6px; } }
</style>
