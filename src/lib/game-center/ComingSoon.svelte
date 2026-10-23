<script lang="ts">
  import { EVENT_NAME } from './event-branding';
  let { name }: { name: string } = $props();
</script>
<svelte:head><title>{name} · Coming soon</title></svelte:head>
<main class="coming-soon">
  <p class="stamp">Coming soon</p>
  <h1>{name}</h1>
  <p>Questo gioco non è ancora disponibile a {EVENT_NAME}.</p>
  <a href="/">Scegli un altro gioco</a>
</main>
<style>
  .coming-soon { max-width: 640px; margin: 60px auto; padding: 24px; text-align: center; }
  .stamp { color: #ffda66; font-size: 32px; font-weight: 900; transform: rotate(-6deg); }
  a { display: inline-block; padding: 14px 24px; margin-top: 16px; border-radius: 8px; background: #00e5a3; color: #15151b; font-weight: 800; }
</style>
