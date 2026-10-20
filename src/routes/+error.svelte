<script lang="ts">
  import { page } from '$app/state';
</script>

<svelte:head><title>Gioco non disponibile · BacaroTech</title></svelte:head>
<main class="route-error">
  <h1>Il gioco si fa aspettare</h1>
  <p role="alert">{page.error?.message ?? 'Controlla la connessione e riprova.'}</p>
  <a href={page.url.pathname} data-sveltekit-reload>Riprova</a>
  <a href="/">Torna al Game Center</a>
</main>

<style>
  .route-error { max-width: 700px; margin: auto; padding: 48px 20px; }
  a { display: inline-block; margin: 12px 24px 12px 0; }
</style>
