<script lang="ts">
  import type { Pokemon } from './db';
  let { pokemon }: { pokemon: Pokemon } = $props();
  let broken = $state(false);
  $effect(() => { pokemon.sprite; broken = false; });
</script>
{#if pokemon.sprite && !broken}<img class="sprite" src={pokemon.sprite} alt={pokemon.name} loading="lazy" referrerpolicy="no-referrer" onerror={() => broken = true} />
{:else}<span class="sprite missing" role="img" aria-label={`Sprite non disponibile: ${pokemon.name}`}>?</span>{/if}
