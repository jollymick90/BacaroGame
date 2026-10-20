<script lang="ts">
  import { onMount } from 'svelte';
  import { bugs } from './content';
  import { ABILITY_THRESHOLDS } from './mechanics';
  import type { mountRunner, Snapshot } from './scene';
  let host: HTMLDivElement;
  let game: ReturnType<typeof mountRunner> | undefined;
  let ready = $state(false),
    error = $state(false);
  let hud = $state<Snapshot>({
    phase: 'intro',
    health: 3,
    distance: 0,
    caught: 0,
    collection: [0, 0, 0, 0],
    score: 0,
    charges: [0, 0, 0, 0],
    shield: 0,
    slow: 0,
    double: 0,
    healReady: false,
    speed: 8,
    message: '',
    capture: 0,
  });
  onMount(() => {
    let cancelled = false;
    void import('./scene')
      .then(({ mountRunner }) => {
        if (cancelled) return;
        try {
          game = mountRunner(
            host,
            (s) => (hud = s),
            () => {
              error = true;
            },
          );
          ready = true;
        } catch (e) {
          console.error('Bug Hunter initialization failed', e);
          error = true;
        }
      })
      .catch(() => {
        error = true;
      });
    return () => {
      cancelled = true;
      game?.dispose();
      game = undefined;
    };
  });
  function control(type: 'left' | 'right' | 'jump' | 'pause') {
    game?.action(type);
    host.focus({ preventScroll: true });
  }
</script>

<svelte:head
  ><title>Bug Hunter · BacaroTech</title><meta
    name="description"
    content="Un retino contro il caos. Corri, salta e cattura quattro specie di bug in un mondo 3D cartoon."
  /></svelte:head
>
<main class="bh-page">
  <div
    class="bh-stage"
    class:bh-menu={hud.phase !== 'running'}
    bind:this={host}
    tabindex="-1"
    role="application"
    aria-label="Bug Hunter, arena 3D. Frecce o A e D per muoverti, W o spazio per saltare, P per pausa."
  >
    {#if error}<div class="bh-overlay">
        <h1 tabindex="-1">Il retino ha perso il segnale.</h1>
        <p>La scena 3D non è disponibile. Riapri il gioco con WebGL attivo.</p>
        <a href="#/">Torna al Game Center</a>
      </div>
    {:else if hud.phase === 'intro'}
      <div class="bh-intro">
        <span class="bh-kicker">BacaroTech presenta</span>
        <h1 tabindex="-1">BUG<br />HUNTER</h1>
        <p>I bug sono scappati in production.<br />Riprendili.</p>
        <button class="bh-go" disabled={!ready} onclick={() => game?.start()}
          >{ready ? 'VAI A CACCIA' : 'Prepariamo il retino…'}</button
        >
        <p class="bh-instructions">
          ← → / A D per muoverti · ↑ / W / spazio per saltare<br />Su telefono: scorri o usa i tre
          pulsanti.<br />Tre vite: ogni bug mancato o urto costa una vita.<br />Salta i bug in aria
          e le barriere. Abilità automatiche: 50 Heisenbug → scudo 8 s · 25 Regression → +1 vita ·
          30 Production → rallenta 6 s · 40 Feature → punti ×2 per 10 s.
        </p>
      </div>
    {:else}
      <div class="bh-hud">
        <div>
          <b>{hud.score} punti</b><small>{hud.distance} m · velocità {hud.speed.toFixed(1)}</small
          ><span aria-label={`${hud.health} possibilità rimaste`}
            >{'♥'.repeat(hud.health)}{'♡'.repeat(3 - hud.health)}</span
          >
        </div>
        <button aria-label="Pausa" onclick={() => control('pause')} disabled={hud.phase === 'over'}
          >Ⅱ</button
        >
        <div class="bh-jar" class:bh-pop={hud.capture > 0}>
          <span aria-hidden="true">🫙</span><b data-testid="bug-count">{hud.caught}</b><small
            >bug al sicuro</small
          >
        </div>
      </div>
      {#if hud.phase === 'running'}
        <div class="bh-abilities" aria-label="Carica abilità automatiche">
          {#each bugs as bug, index}
            <div>
              <b>{bug.name.replace(' Bug', '')}</b><span
                >{hud.charges[index]}/{ABILITY_THRESHOLDS[index]}</span
              >
            </div>
          {/each}
          {#if hud.shield > 0}<p>Scudo {Math.ceil(hud.shield)} s</p>{/if}
          {#if hud.slow > 0}<p>Rallentamento {Math.ceil(hud.slow)} s</p>{/if}
          {#if hud.double > 0}<p>Punti ×2 · {Math.ceil(hud.double)} s</p>{/if}
          {#if hud.healReady}<p>Una cura pronta ♥</p>{/if}
        </div>
        <div class="bh-feedback" role="status">{hud.message}</div>
        <div class="bh-controls">
          <button aria-label="Spostati a sinistra" onclick={() => control('left')}>←</button><button
            aria-label="Salta"
            onclick={() => control('jump')}>SALTA ↑</button
          ><button aria-label="Spostati a destra" onclick={() => control('right')}>→</button>
        </div>
      {:else if hud.phase === 'paused'}<div class="bh-overlay">
          <h1 tabindex="-1">Pausa caffè.</h1>
          <p>I bug aspettano. Stranamente educati.</p>
          <button class="bh-go" onclick={() => control('pause')}>RIPRENDI</button><a href="#/"
            >Torna al Game Center</a
          >
        </div>
      {:else if hud.phase === 'over'}<div class="bh-overlay bh-results">
          <h1 tabindex="-1">PRODUCTION È ANCORA IN FIAMME.</h1>
          <p>
            <strong>{hud.caught} bug catturati · {hud.score} punti · {hud.distance} metri</strong
            ><br />{hud.caught
              ? 'Almeno questi non scappano. Crediamo.'
              : 'Il retino era nuovo. Facciamo un altro giro?'}
          </p>
          <div class="bh-collection">
            {#each bugs as bug, i}<div class:bh-missing={!hud.collection[i]}>
                <span style:background={`#${bug.color.toString(16)}`} aria-hidden="true"
                  >{['◌', '↶', '!', '✦'][i]}</span
                >
                <p>
                  <b>{bug.name} × {hud.collection[i]}</b><small
                    >{hud.collection[i] ? bug.description : 'Ancora a piede libero.'}</small
                  >
                </p>
              </div>{/each}
          </div>
          <button class="bh-go" onclick={() => game?.start()}>RIPROVA</button><a href="#/"
            >Torna al Game Center</a
          >
        </div>{/if}
    {/if}
  </div>
</main>

<style>
  .bh-abilities {
    position: absolute;
    top: 150px;
    left: 12px;
    display: grid;
    gap: 4px;
    font-size: 10px;
    background: #fff4d7e8;
    border-radius: 10px;
    padding: 8px;
    pointer-events: none;
  }
  .bh-abilities > div {
    display: flex;
    gap: 10px;
    justify-content: space-between;
  }
  .bh-abilities p {
    margin: 0;
    font-weight: bold;
    color: #6742a6;
  }
  .bh-hud small {
    font-size: 11px;
  }
  @media (max-height: 450px) {
    .bh-abilities {
      top: 130px;
      font-size: 9px;
      padding: 4px;
    }
    .bh-abilities > div {
      gap: 5px;
    }
  }

  .bh-page {
    background: #9fe5ed;
    color: #30264e;
    font-family: 'Trebuchet MS', sans-serif;
  }
  .bh-stage {
    height: calc(100svh - 72px);
    min-height: 0;
    max-height: 1100px;
    position: relative;
    overflow: hidden;
    isolation: isolate;
    touch-action: none;
    outline-offset: -4px;
  }
  .bh-stage.bh-menu {
    touch-action: pan-y;
  }
  .bh-results {
    justify-content: flex-start;
  }
  .bh-stage :global(canvas) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    display: block;
  }
  .bh-intro {
    position: absolute;
    top: 5%;
    left: 7%;
    max-width: 470px;
    pointer-events: none;
  }
  .bh-intro button {
    pointer-events: auto;
  }
  .bh-kicker {
    font-size: 16px;
    font-weight: bold;
  }
  .bh-intro h1 {
    font-size: clamp(62px, 8vw, 108px);
    letter-spacing: -5px;
    line-height: 0.83;
    margin: 20px 0;
    color: #46328b;
    text-shadow: 3px 4px 0 #fff3cf;
  }
  .bh-intro p {
    font-size: 20px;
    line-height: 1.4;
  }
  .bh-go {
    background: #ffcc52;
    color: #30264e;
    border: 3px solid #46328b;
    border-radius: 12px;
    box-shadow: 0 5px 0 #46328b;
    padding: 15px 30px;
    min-height: 58px;
    font-size: 20px;
    font-weight: 950;
    letter-spacing: 0.5px;
  }
  .bh-go:hover {
    background: #ffe28b;
  }
  .bh-intro .bh-instructions {
    font-size: 12px;
    line-height: 1.7;
    background: #fff4d7dc;
    border-radius: 12px;
    padding: 12px;
    margin-top: 20px;
  }
  .bh-hud {
    position: absolute;
    top: 18px;
    left: 20px;
    right: 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    pointer-events: none;
  }
  .bh-hud > div:first-child {
    display: grid;
    gap: 6px;
    font-size: 23px;
    font-weight: bold;
    text-shadow: 1px 2px #fff;
  }
  .bh-hud > div:first-child span {
    color: #a62c54;
    font-size: 27px;
    letter-spacing: 3px;
  }
  .bh-hud > button {
    pointer-events: auto;
    background: #fff4d7;
    color: #46328b;
    border: 2px solid #46328b;
    border-radius: 50%;
    width: 48px;
    height: 48px;
    padding: 0;
    font-size: 25px;
  }
  .bh-jar {
    display: grid;
    grid-template-columns: auto auto;
    align-items: center;
    background: #fff4d7e8;
    border: 2px solid #46328b;
    border-radius: 16px;
    padding: 8px 12px;
    transition: transform 0.2s;
  }
  .bh-jar > span {
    font-size: 32px;
  }
  .bh-jar b {
    font-size: 30px;
  }
  .bh-jar small {
    grid-column: span 2;
    font-size: 10px;
  }
  .bh-pop {
    transform: scale(1.1);
    background: #ffdf6f;
  }
  .bh-feedback {
    position: absolute;
    top: 112px;
    left: 15%;
    right: 15%;
    text-align: center;
    font-size: 15px;
    font-weight: 800;
    text-shadow: 1px 1px #fff;
    pointer-events: none;
  }
  .bh-controls {
    position: absolute;
    bottom: 24px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    gap: 18px;
  }
  .bh-controls button {
    background: #fff4d7e8;
    color: #46328b;
    border: 2px solid #46328b;
    border-radius: 16px;
    min-width: 65px;
    min-height: 58px;
    font-size: 24px;
    box-shadow: 0 3px #46328b;
  }
  .bh-controls button:nth-child(2) {
    font-size: 15px;
    padding: 12px 25px;
  }
  .bh-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 16px;
    padding: 28px;
    background: #d7f3f1e8;
    overflow: auto;
    touch-action: pan-y;
  }
  .bh-overlay h1 {
    font-size: clamp(28px, 4vw, 45px);
    line-height: 1;
    letter-spacing: -1px;
    max-width: 550px;
    margin: 0;
  }
  .bh-overlay p {
    line-height: 1.5;
    margin: 0;
    max-width: 500px;
  }
  .bh-overlay a {
    color: #46328b;
    min-height: 44px;
    display: flex;
    align-items: center;
    font-weight: bold;
  }
  .bh-collection {
    width: 100%;
    max-width: 480px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    text-align: left;
  }
  .bh-collection > div {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }
  .bh-collection > div > span {
    border: 2px solid #46328b;
    min-width: 30px;
    text-align: center;
    font-weight: bold;
    border-radius: 50%;
    font-size: 22px;
  }
  .bh-collection b {
    font-size: 12px;
  }
  .bh-collection small {
    display: block;
    font-size: 11px;
    line-height: 1.5;
  }
  .bh-missing {
    opacity: 0.55;
  }
  .bh-stage button:focus-visible,
  .bh-stage a:focus-visible {
    outline: 3px solid #46328b;
    outline-offset: 4px;
  }
  @media (max-width: 600px) {
    .bh-stage {
      height: calc(100svh - 57px);
      min-height: 0;
    }
    .bh-intro {
      top: 4%;
      left: 7%;
      right: 7%;
      text-align: center;
      max-width: none;
    }
    .bh-intro h1 {
      font-size: 72px;
    }
    .bh-intro p {
      font-size: 16px;
    }
    .bh-intro .bh-instructions {
      font-size: 11px;
      margin-top: 15px;
    }
    .bh-hud {
      left: 12px;
      right: 12px;
    }
    .bh-hud > div:first-child {
      font-size: 18px;
    }
    .bh-hud > div:first-child span {
      font-size: 23px;
    }
    .bh-feedback {
      left: 10%;
      right: 10%;
      font-size: 13px;
    }
    .bh-overlay {
      padding: 20px 16px;
      gap: 15px;
    }
    .bh-results h1 {
      font-size: 29px;
    }
    .bh-collection {
      gap: 14px 8px;
    }
    .bh-controls {
      bottom: 20px;
    }
  }
  @media (max-height: 650px) and (min-width: 601px) {
    .bh-stage {
      min-height: 0;
    }
    .bh-intro {
      top: 4%;
      max-width: 45%;
    }
    .bh-intro h1 {
      font-size: 42px;
      margin: 10px 0;
    }
    .bh-intro p {
      font-size: 13px;
    }
    .bh-intro .bh-kicker {
      font-size: 12px;
    }
    .bh-intro .bh-go {
      font-size: 15px;
      min-height: 44px;
      padding: 8px 18px;
    }
    .bh-intro .bh-instructions {
      font-size: 10px;
      padding: 8px;
    }
    .bh-intro .bh-instructions {
      margin-top: 12px;
    }
    .bh-results {
      justify-content: flex-start;
    }
  }
  @media (max-height: 450px) and (min-width: 601px) {
    .bh-controls {
      justify-content: flex-start;
      padding: 0 12px;
      gap: 10px;
      bottom: 12px;
    }
    .bh-controls button:nth-child(2) {
      position: absolute;
      right: 12px;
    }
    .bh-controls button {
      min-height: 46px;
      min-width: 54px;
    }
    .bh-feedback {
      top: 85px;
      font-size: 11px;
    }
    .bh-jar {
      padding: 4px 8px;
    }
    .bh-jar > span,
    .bh-jar b {
      font-size: 22px;
    }
  }
</style>
