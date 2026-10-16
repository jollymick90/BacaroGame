<script lang="ts">
  import { onMount, tick, type Component } from 'svelte';
  import GameCenterHome from './GameCenterHome.svelte';

  let { configured }: { configured: boolean } = $props();
  type Route = '#/' | '#/bacarodex' | '#/are-you-an-ai' | '#/merge-battle' | '#/bug-hunter';
  let route = $state<Route>('#/');
  let Bacarodex = $state<Component<{ configured: boolean }> | null>(null);
  let AI = $state<Component | null>(null);
  let MergeBattle = $state<Component | null>(null);
  let BugHunter = $state<Component | null>(null);
  let mergeConfig = $state<import('../games/merge-battle/config').MergeConfig | null>(null);
  let loading = $state(false), error = $state('');
  let content: HTMLDivElement;
  let generation = 0;

  async function openRoute(focus: boolean) {
    const hash = window.location.hash;
    const next: Route = hash === '#/bacarodex' || hash === '#/are-you-an-ai' || hash === '#/merge-battle' || hash === '#/bug-hunter' ? hash : '#/';
    if (hash !== next) window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}${next}`);
    const current = ++generation;
    route = next; Bacarodex = null; AI = null; MergeBattle = null; BugHunter = null; error = ''; loading = next !== '#/';
    try {
      if (next === '#/bacarodex') {
        const module = await import('../games/bacarodex/Bacarodex.svelte');
        if (current !== generation) return;
        Bacarodex = module.default;
      } else if (next === '#/are-you-an-ai') {
        const module = await import('../games/are-you-an-ai/AreYouAnAI.svelte');
        if (current !== generation) return;
        AI = module.default;
      } else if (next === '#/merge-battle') {
        const [module,response] = await Promise.all([import('../games/merge-battle/MergeBattle.svelte'),fetch('/api/merge-battle/config')]);
        if(!response.ok) throw new Error('Configurazione non disponibile');
        const data=await response.json();
        if (current !== generation) return;
        mergeConfig=data.config;
        MergeBattle = module.default;
      } else if (next === '#/bug-hunter') {
        const module = await import('../games/bug-hunter/BugHunter.svelte');
        if (current !== generation) return;
        BugHunter = module.default;
      }
    } catch {
      if (current === generation) error = 'Il gioco non si è caricato. Controlla la connessione e riprova.';
    } finally {
      if (current === generation) {
        loading = false;
        await tick();
        if (focus && current === generation) {
          content.querySelector<HTMLElement>('h1')?.focus();
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
      }
    }
  }
  onMount(() => {
    void openRoute(false);
    const change = () => { void openRoute(true); };
    window.addEventListener('hashchange', change);
    return () => { generation++; window.removeEventListener('hashchange', change); };
  });
</script>

<svelte:head>{#if route === '#/'}<title>BacaroTech Game Center</title>{/if}</svelte:head>
{#if route !== '#/'}
  <div class="center-return"><a href="#/">← Torna al Game Center</a><span>BacaroTech</span></div>
{/if}
<div bind:this={content}>
  {#if route === '#/'}<GameCenterHome />
  {:else if loading}<main class="route-message" aria-busy="true"><h1 tabindex="-1">Prepariamo il gioco…</h1><p role="status">Un momento e si comincia.</p></main>
  {:else if error}<main class="route-message"><h1 tabindex="-1">Il gioco si fa aspettare</h1><p role="alert">{error}</p><button onclick={() => openRoute(true)}>Riprova</button></main>
  {:else if route === '#/bacarodex' && Bacarodex}<Bacarodex {configured} />
  {:else if route === '#/are-you-an-ai' && AI}<AI />
  {:else if route === '#/merge-battle' && MergeBattle}<MergeBattle config={mergeConfig ?? undefined} />
  {:else if route === '#/bug-hunter' && BugHunter}<BugHunter />{/if}
</div>

<style>
  .center-return{display:flex;justify-content:space-between;align-items:center;gap:12px;max-width:1080px;margin:auto;padding:12px 28px;border-bottom:1px solid #d7d9cb;font-size:13px}
  .center-return a{display:inline-flex;align-items:center;min-height:44px;font-weight:700;text-underline-offset:4px}.center-return span{font-size:12px;color:#667368}
  .route-message{max-width:700px;padding:48px 20px;margin:auto}.route-message h1{font-size:32px}
  @media(max-width:650px){.center-return{padding:6px 16px}.center-return span{display:none}}
</style>
