<script lang="ts">
  import '../style.css';
  import { page } from '$app/state';
  import SiteHeader from '$lib/game-center/SiteHeader.svelte';
  import CommunityFooter from '$lib/game-center/CommunityFooter.svelte';
  let { children } = $props();
</script>
{#if page.url.pathname !== '/merge-battle' && page.url.pathname !== '/merge-battle/online'}
  <SiteHeader>
    {#snippet actions()}{#if page.url.pathname === '/'}<a href="/qr">Invita</a>{/if}{/snippet}
  </SiteHeader>
{/if}
{@render children()}

<CommunityFooter />
