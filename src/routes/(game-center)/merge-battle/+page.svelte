<script lang="ts">
  import MergeBattle from '$lib/games/merge-battle/MergeBattle.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

{#if data.configuration.mergeBattle}
  <MergeBattle config={data.configuration.mergeBattle} />
{:else}
  <main class="configuration-error">
    <h1>Configurazione non disponibile</h1>
    <p role="alert">{data.configuration.mergeError}</p>
    <a href="/merge-battle" data-sveltekit-reload>Riprova</a>
  </main>
{/if}

<style>
  .configuration-error { max-width: 700px; margin: auto; padding: 32px 20px; }
</style>
