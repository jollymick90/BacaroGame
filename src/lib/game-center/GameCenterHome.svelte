<script lang="ts">
  import GameCover from './GameCover.svelte';
  import { EVENT_NAME } from './event-branding';

  let { configured: _configured }: { configured: boolean } = $props();
  const games = [
    { id: 'bug-hunter', cover: 'hunter', name: 'Bug Hunter', description: 'Corri a Venezia, cattura i bug e cattura il polpo!', detail: '', color: '#00e5a3' },
    { id: 'merge-battle', cover: 'merge', name: 'Merge Battle', description: 'Scegli la tua mossa e sfida il verdetto del maintainer.', detail: 'Da solo, sullo stesso dispositivo o online.', color: '#b9a1fb' },
    { id: 'bacarodex', cover: 'dex', name: 'Bacarodex', description: 'Trova un membro BacaroTech e indovina il suo Pokémon.', detail: '', color: '#72d5a3' },
    { id: 'are-you-an-ai', cover: 'ai', name: 'Are You an AI?', description: 'Un robot non crede che tu sia umano.', detail: '', color: '#b9a1fb' },
  ] as const;

</script>

<div class="center-home">
  <header class="center-header">
    <a class="center-brand" href="/" aria-label="BacaroTech Game Center">
      <img src="/bacarotech-logo.png" alt="" width="44" height="44" />
      <span>BacaroTech<small>Game Center · {EVENT_NAME}</small></span>
    </a>
    <a class="invite-link arcade-secondary" href="/qr">Invita</a>
  </header>
  <main id="game-list">
    <h1 tabindex="-1">Scegli un gioco.</h1>
    <div class="playable">
      {#each games as game}
        {@const comingSoon = game.id === 'bacarodex' || game.id === 'are-you-an-ai'}
        <article class="game-card" class:coming-soon={comingSoon} style:--game-accent={game.color} aria-labelledby={`${game.id}-title`}>
          <div class="cover-wrap"><GameCover game={game.cover} />{#if comingSoon}<span class="watermark" aria-hidden="true">COMING SOON</span>{/if}</div>
          <div class="card-copy">
            <h2 id={`${game.id}-title`}>{game.name}</h2>
            <p>{game.description}</p>
            {#if game.detail}<p class="prerequisite">{game.detail}</p>{/if}
            {#if comingSoon}
              <p class="coming-label">Coming soon</p>
            {:else}
              <a class="play-link" href={`/${game.id}`} aria-label={`Gioca a ${game.name}`}>Gioca <span aria-hidden="true">▶</span></a>
            {/if}
          </div>
        </article>
      {/each}
    </div>
  </main>
  <footer class="center-footer"><span>BacaroTech · Una pausa a {EVENT_NAME}</span><a href="/admin">Area membri</a></footer>
</div>

<style>
  .center-home { max-width: 1120px; margin: auto; padding: 0 28px; }
  .center-header { min-height: 88px; height: auto; gap: 16px; border-color: var(--arcade-border); }
  .center-brand { display: flex; gap: 12px; align-items: center; font-size: 22px; font-weight: 800; text-decoration: none; line-height: 1.2; }
  .center-brand small { display: block; font-size: 14px; font-weight: 400; color: var(--arcade-muted); margin-top: 4px; }
  .invite-link { padding: 10px 22px; }
  h1 { font-family: var(--arcade-display); font-size: clamp(32px, 4vw, 48px); line-height: 1.1; letter-spacing: -1.5px; margin: 38px 0 28px; }
  .playable { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px; }
  .game-card { display: flex; flex-direction: column; border: 1px solid var(--arcade-border); border-radius: 16px; overflow: hidden; background: var(--arcade-panel); box-shadow: 0 5px 0 #0c0c10; }
  .cover-wrap { position: relative; }
  .coming-soon .cover-wrap { filter: grayscale(1); }
  .watermark { position: absolute; inset: 0; display: grid; place-items: center; background: #15151b88; color: #fff; font-size: clamp(26px, 4vw, 40px); font-weight: 950; letter-spacing: 2px; text-shadow: 0 2px 4px #000; }
  .coming-label { font-weight: 850; padding: 12px 0; }
  .card-copy { padding: 24px; display: flex; flex-direction: column; flex: 1; }
  h2 { font-family: var(--arcade-display); font-size: 28px; line-height: 1.15; margin: 0 0 10px; letter-spacing: -.6px; }
  .card-copy p { color: var(--arcade-muted); font-size: 16px; margin: 0 0 18px; max-width: 45ch; }
  .card-copy .prerequisite { font-size: 14px; margin-top: -6px; }
  .play-link { display: flex; justify-content: space-between; align-items: center; gap: 12px; min-height: 48px; padding: 12px 18px; margin-top: auto; border: 1px solid #15151b; border-radius: 8px; text-decoration: none; font-weight: 750; background: var(--game-accent); color: #15151b; box-shadow: 0 4px 0 #0c0c10; }
  .play-link:hover { filter: brightness(1.08); }
  .play-link:active { transform: translateY(3px); box-shadow: 0 1px 0 #0c0c10; }
  .play-link span { font-size: 14px; }
  .center-footer { display: flex; justify-content: space-between; align-items: center; gap: 16px; max-width: none; padding: 28px 0; color: var(--arcade-muted); font-size: 14px; }
  .center-footer a { display: inline-flex; align-items: center; min-height: 44px; }
  @media (max-width: 600px) {
    .center-home { padding: 0 16px; }
    .center-header { min-height: 76px; }
    .center-brand { font-size: 19px; gap: 8px; }
    .center-brand img { width: 36px; height: 36px; }
    .invite-link { padding: 10px 16px; }
    h1 { margin: 26px 0 22px; }
    .playable { grid-template-columns: 1fr; gap: 22px; }
    .card-copy { padding: 20px; }
    h2 { font-size: 26px; }
    .center-footer { flex-wrap: wrap; gap: 4px; }
  }
</style>
