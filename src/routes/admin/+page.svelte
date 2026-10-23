<script lang="ts">
  import { tick } from 'svelte';
  import App from '../../App.svelte';
  import BugHunterQuestions from '$lib/admin/BugHunterQuestions.svelte';
  import MergeBattleCatalog from '$lib/admin/MergeBattleCatalog.svelte';
  import Login from '$lib/Login.svelte';
  let { data } = $props();
  type Game = 'bacarodex' | 'merge-battle' | 'are-you-an-ai' | 'bug-hunter';
  let selected = $state<Game | null>(null);
  let heading = $state<HTMLHeadingElement>();
  const games: { id: Game; name: string; icon: string; description: string; available: boolean }[] = [
    { id: 'bacarodex', name: 'Bacarodex', icon: '◉', description: 'Registrazione membri e Pokémon.', available: true },
    { id: 'merge-battle', name: 'Merge Battle', icon: '⑂', description: 'Catalogo, combinazioni e anteprima giocabile.', available: true },
    { id: 'are-you-an-ai', name: 'Are You an AI?', icon: '▣', description: 'Personalizzazione non ancora disponibile.', available: false },
    { id: 'bug-hunter', name: 'Bug Hunter', icon: '⌁', description: 'Domande semplici per recuperare una vita con i cuori.', available: true },
  ];
  async function open(game: Game | null) {
    selected = game;
    await tick();
    heading?.focus();
  }
</script>

{#if data.user}
  <div class="admin-games">
    {#if selected}<button class="back" onclick={() => open(null)}>← Tutti i giochi</button>{/if}
    <h1 bind:this={heading} tabindex="-1">{selected ? games.find(game => game.id === selected)?.name : 'Game Center / backoffice'}</h1>
    {#if !selected}
      <p>Scegli il gioco da gestire.</p>
      <div class="game-grid">
        {#each games as game}
          <button class="game-tile" onclick={() => open(game.id)}>
            <span class="icon" aria-hidden="true">{game.icon}</span>
            <strong>{game.name}</strong>
            <span>{game.description}</span>
            <small>{game.available ? 'Apri gestione →' : 'Vedi stato →'}</small>
          </button>
        {/each}
      </div>
    {:else if selected === 'merge-battle'}
      <MergeBattleCatalog />
    {:else if selected === 'bug-hunter'}
      <BugHunterQuestions />
    {:else if selected !== 'bacarodex'}
      <div class="pending"><p>La gestione di questo gioco non è ancora disponibile.</p><a href={`/${selected}`}>Apri il gioco →</a></div>
    {/if}
  </div>
  {#if selected === 'bacarodex'}<App user={data.user} />{/if}
{:else}
  <Login configured={data.configured} emulator={data.emulator} />
{/if}

<style>

  .admin-games{max-width:1000px;margin:auto;padding:24px 16px;color:#193e35}.admin-games h1{font-size:28px;letter-spacing:-.8px}.admin-games h1:focus{outline:none}.game-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:28px 0}.game-tile{display:grid;justify-items:start;align-content:start;gap:14px;text-align:left;background:#fffef9;color:#193e35;border:2px solid #193e35;border-radius:16px;padding:24px;min-height:220px}.game-tile:hover{background:#e8ecdd}.game-tile strong{font-size:24px}.game-tile>span:not(.icon){font-size:14px;line-height:1.5}.game-tile small{font-weight:700;margin-top:auto}.icon{font-size:36px;color:#6742a6}.back{background:transparent;color:#193e35;border:0;padding:12px 0;text-decoration:underline;min-height:44px}.pending{padding:24px;background:#fffef9;border:1px solid #bbc8b1;border-radius:12px}.pending a{display:inline-flex;align-items:center;min-height:44px}.game-tile:focus-visible,.back:focus-visible{outline:3px solid #6742a6;outline-offset:4px}@media(max-width:560px){.game-grid{grid-template-columns:1fr;gap:14px}.game-tile{min-height:180px;padding:20px}}
</style>
