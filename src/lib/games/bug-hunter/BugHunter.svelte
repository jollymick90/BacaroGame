<script lang="ts">
  import { onMount } from 'svelte';
  import { isLocalRunnerDevelopment } from './dev-mode';
  import { createPresentationClock } from './presentation-clock';
  import { bugs } from './content';
  import CaptureCounter from './CaptureCounter.svelte';
  import TutorialGuide from './TutorialGuide.svelte';
  import RunReview from './RunReview.svelte';
  import { DEFAULT_RUN_SETTINGS, type RunSettings } from './run-settings';
  import HeartQuestionDialog from './HeartQuestion.svelte';
  import { DEFAULT_QUESTIONS, type HeartQuestion } from './questions';
  import type { mountRunner, Snapshot } from './scene';
  const presentationClock = createPresentationClock();
  let devAvailable = $state(false);
  let devFrozen = $state(false);
  let devBackgrounded = false;
  let host: HTMLDivElement;
  let game: ReturnType<typeof mountRunner> | undefined;
  let ready = $state(false),
    error = $state(false);
  let { questions = DEFAULT_QUESTIONS, runSettings = DEFAULT_RUN_SETTINGS }: { questions?: HeartQuestion[]; runSettings?: RunSettings } = $props();
  let questionBag: HeartQuestion[] = [];
  let currentQuestion = $state<HeartQuestion | null>(null);
  let hud = $state<Snapshot>({
    phase: 'intro',
    finishReason: null,
    stats: { missed: 0, collisions: 0, healed: 0, powers: [0, 0, 0, 0] },
    progress: null,
    tutorial: null,
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
    messageTone: 'neutral',
    capture: 0,
  });
  onMount(() => {
    let cancelled = false;
    devAvailable = isLocalRunnerDevelopment();
    function freezeShortcut(event: KeyboardEvent) {
      const freezeKey = event.key === 'F8' || event.key.toLowerCase() === 'o';
      if (!freezeKey || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      event.preventDefault();
      toggleDevFreeze();
    }
    function devVisibility() {
      if (document.hidden && devFrozen) devBackgrounded = true;
    }
    if (devAvailable) {
      window.addEventListener('keydown', freezeShortcut);
      document.addEventListener('visibilitychange', devVisibility);
    }
    void import('./scene')
      .then(({ mountRunner }) => {
        if (cancelled) return;
        try {
          game = mountRunner(
            host,
            (s) => (hud = s),
            () => {
              error = true;
              currentQuestion = null;
            },
            runSettings,
          );
          ready = true;
          let tutorialDismissed = false;
          try {
            tutorialDismissed = localStorage.getItem('bug-hunter:skip-tutorial') === 'true';
          } catch {
            // Storage can be unavailable; the tutorial remains accessible.
          }
          if (!tutorialDismissed) openTutorial();
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
      window.removeEventListener('keydown', freezeShortcut);
      document.removeEventListener('visibilitychange', devVisibility);
      presentationClock.dispose();
      game?.dispose();
      game = undefined;
    };
  });
  $effect(() => {
    if (!error && hud.phase === 'question' && !currentQuestion) {
      if (!questionBag.length) {
        questionBag = hud.tutorial ? [questions[0] ?? DEFAULT_QUESTIONS[0]] : [...questions];
        for (let index = questionBag.length - 1; index > 0; index--) {
          const other = Math.floor(Math.random() * (index + 1));
          [questionBag[index], questionBag[other]] = [questionBag[other], questionBag[index]];
        }
      }
      currentQuestion = questionBag.pop()!;
    }
  });
  function toggleDevFreeze() {
    if (!devAvailable || !ready || error) return;
    devFrozen = !devFrozen;
    game?.setDevFrozen(devFrozen);
    if (!devFrozen && devBackgrounded) {
      if (currentQuestion) finishQuestion(false);
      devBackgrounded = false;
    }
    presentationClock.setFrozen(devFrozen);
    if (!devFrozen) host.focus({ preventScroll: true });
  }

  function openTutorial() {
    if (devFrozen) return;
    currentQuestion = null;
    questionBag = [];
    game?.startTutorial();
  }
  function skipTutorial() {
    if (devFrozen) return;
    try {
      localStorage.setItem('bug-hunter:skip-tutorial', 'true');
    } catch {
      // Skipping still starts the game when persistence is unavailable.
    }
    start();
  }
  function exitTutorial() {
    if (devFrozen) return;
    currentQuestion = null;
    questionBag = [];
    game?.exitTutorial();
  }
  function replayTutorial() {
    if (devFrozen) return;
    currentQuestion = null;
    questionBag = [];
    game?.replayTutorial();
  }
  function start() {
    if (devFrozen) return;
    currentQuestion = null;
    questionBag = [];
    game?.start();
  }
  function finishQuestion(resume: boolean) {
    // Resolve a skipped question too; a second resolution cannot grant another life.
    game?.resolveHeart(false);
    currentQuestion = null;
    if (resume && !document.hidden && hud.phase === 'paused') game?.action('pause');
    host.focus({ preventScroll: true });
  }
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
<main class="bh-page" class:dev-frozen={devFrozen}>
  {#if devAvailable && ready && !error}
    <div class="bh-dev-tools">
      <button aria-pressed={devFrozen} onclick={toggleDevFreeze}>
        DEV · {devFrozen ? 'Sblocca frame' : 'Congela frame'} · O / F8
      </button>
    </div>
  {/if}
  <div
    class="bh-stage"
    inert={devFrozen}
    class:bh-menu={hud.phase !== 'running'}
    bind:this={host}
    tabindex="-1"
    role="application"
    aria-label="Bug Hunter, arena 3D. Frecce o A e D per muoverti, W o spazio per saltare, P per pausa."
  >
    {#if error}<div class="bh-overlay">
        <h1 tabindex="-1">Il retino ha perso il segnale.</h1>
        <p>La scena 3D non è disponibile. Riapri il gioco con WebGL attivo.</p>
        <a href="/">Torna al Game Center</a>
      </div>
    {:else if hud.phase === 'intro'}
      <div class="bh-intro">

        <h1 tabindex="-1">Bug Hunter</h1>
        <p>Corri, cattura i bug e cattura il polpo!</p>
        <button class="bh-go" disabled={!ready} onclick={start}
          >{ready ? 'Inizia' : 'Prepariamo il retino…'}</button
        >
        <button class="bh-learn" disabled={!ready} onclick={openTutorial}>Come si gioca</button>

      </div>
    {:else}
      <div class="bh-hud">
        <div>
          <b>{hud.score} {hud.score === 1 ? 'punto' : 'punti'}</b><small>{hud.distance} m · velocità {hud.speed.toFixed(1)}</small
          ><span aria-label={`${hud.health} possibilità rimaste`}
            >{'♥'.repeat(hud.health)}{'♡'.repeat(3 - hud.health)}</span
          >
        </div>
        <button aria-label="Pausa" onclick={() => control('pause')} disabled={!!hud.tutorial || hud.phase === 'over' || hud.phase === 'question'}
          >Ⅱ</button
        >
        <CaptureCounter
          capture={hud.capture}
          caught={hud.caught}
          collection={hud.collection}
          charges={hud.charges}
          oninspect={() => host.focus({ preventScroll: true })}
        />
      </div>
      {#if hud.progress && !hud.tutorial && hud.phase !== 'over'}
        <div class="bh-objective" aria-label="Obiettivo della corsa">
          {#if hud.progress.stage === 'distance'}1/2 · Cattura il polpo a {hud.progress.distanceGoal} m · {Math.min(hud.distance, hud.progress.distanceGoal)}/{hud.progress.distanceGoal} m
          {:else}2/2 · {hud.progress.bugsInFinalStage}/{hud.progress.bugGoal} bug{/if}
        </div>
      {/if}
      {#if hud.tutorial}
        <TutorialGuide runSettings={runSettings} onskip={skipTutorial}
          state={hud.tutorial}
          phase={hud.phase}
          production={hud.collection[2]}
          onnext={() => game?.nextTutorial()}
          onreplay={replayTutorial}
          onexit={exitTutorial}
          onplay={start}
        />
      {:else if hud.phase === 'running'}
        {#if hud.shield > 0 || hud.slow > 0 || hud.double > 0 || hud.healReady}
          <div class="bh-abilities" aria-label="Abilità attive">
            {#if hud.shield > 0}<p>Scudo {Math.ceil(hud.shield)} s</p>{/if}
            {#if hud.slow > 0}<p>Rallentamento {Math.ceil(hud.slow)} s</p>{/if}
            {#if hud.double > 0}<p>Punti ×2 · {Math.ceil(hud.double)} s</p>{/if}
            {#if hud.healReady}<p>Una cura pronta ♥</p>{/if}
          </div>
        {/if}
        <div class="bh-feedback" data-tone={hud.messageTone} role="status">{hud.message}</div>
        <div class="bh-controls">
          <button aria-label="Spostati a sinistra" onclick={() => control('left')}>←</button><button
            aria-label="Salta"
            onclick={() => control('jump')}>Salta ↑</button
          ><button aria-label="Spostati a destra" onclick={() => control('right')}>→</button>
        </div>
      {:else if hud.phase === 'paused' && !currentQuestion}<div class="bh-overlay bh-pause">
          <h1 tabindex="-1">In pausa.</h1>
          <p>I bug aspettano. Stranamente educati.</p>
          <button class="bh-go" onclick={() => control('pause')}>Riprendi</button><a href="/"
            >Torna al Game Center</a
          >
        </div>
      {:else if hud.phase === 'over'}<div class="bh-overlay bh-results">
          <h1 tabindex="-1">{hud.finishReason === 'goal' ? 'Corsa completata!' : 'Fine della corsa.'}</h1>
          <p>
            <strong>{hud.caught} bug catturati · {hud.score} punti · {hud.distance} metri</strong
            ><br />{hud.caught
              ? 'Almeno questi non scappano. Crediamo.'
              : 'Il retino era nuovo. Facciamo un altro giro?'}
          </p>
          <RunReview stats={hud.stats} caught={hud.caught} completed={hud.finishReason === 'goal'} />
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
          <button class="bh-go" onclick={start}>Riprova</button><a href="/"
            >Torna al Game Center</a
          >
        </div>{/if}
    {/if}
  </div>
  {#if currentQuestion && !error}
    <HeartQuestionDialog tutorial={!!hud.tutorial} question={currentQuestion} clock={presentationClock} frozen={devFrozen}
      ondevfreeze={devAvailable ? toggleDevFreeze : undefined}
      onanswer={(correct) => game?.resolveHeart(correct)}
      oncontinue={() => finishQuestion(true)}
      onskip={() => finishQuestion(false)} />
  {/if}
</main>

<style>
  .bh-dev-tools { position: fixed; right: 12px; bottom: 100px; z-index: 10; }
  .bh-dev-tools button {
    min-height: 36px;
    padding: 6px 10px;
    border: 1px dashed #ffcf70;
    border-radius: 8px;
    background: #15151be6;
    color: #ffcf70;
    font-size: 12px;
  }
  .dev-frozen :global(*), .dev-frozen :global(*::before), .dev-frozen :global(*::after), .dev-frozen :global(dialog::backdrop) {
    animation-play-state: paused !important;
    transition: none !important;
  }
  .bh-objective {
    position: absolute;
    top: 108px;
    left: 12px;
    font-size: 12px;
    font-weight: 800;
    color: #30264e;
    text-shadow: 0 1px #fff4d7;
  }
  .bh-abilities {
    position: absolute;
    top: auto;
    bottom: 100px;
    left: 12px;
    display: grid;
    gap: 4px;
    font-size: 13px;
    background: #fff4d7e8;
    border-radius: 10px;
    padding: 8px;
    pointer-events: none;
  }
  .bh-abilities p {
    margin: 0;
    font-weight: bold;
    color: #6742a6;
  }
  .bh-hud small {
    font-size: 13px;
  }
  @media (max-height: 450px) {
    .bh-abilities {
      top: auto;
      bottom: 80px;
      font-size: 12px;
      padding: 4px;
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
  .bh-intro { max-height: 92%; overflow-y: auto; pointer-events: auto; padding: 0 6px 10px; }
  .bh-intro h1 {
    font-size: clamp(42px, 7vw, 78px);
    letter-spacing: -3px;
    line-height: 1;
    margin: 20px 0;
    color: #46328b;
    text-shadow: 3px 4px 0 #fff3cf;
  }
  .bh-intro p {
    font-size: 20px;
    line-height: 1.4;
  }
  .bh-learn {
    min-height: 48px;
    margin: 12px 0 0 12px;
    padding: 10px 16px;
    border: 2px solid #46328b;
    border-radius: 12px;
    background: #fff4d7;
    color: #46328b;
    font-weight: 800;
  }
  .bh-go {
    background: var(--arcade-mint);
    color: #15151b;
    border: 2px solid #15151b;
    border-radius: 12px;
    box-shadow: 0 5px 0 #0c0c10;
    padding: 15px 30px;
    min-height: 58px;
    font-size: 20px;
    font-weight: 950;
    letter-spacing: 0.5px;
  }
  .bh-go:hover {
    background: #67ffd1;
  }
  .bh-hud {
    position: absolute;
    z-index: 1;
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
  .bh-feedback {
    background: #23232e;
    border: 2px solid #b9a1fb;
    padding: 12px;
    border-radius: 24px;
    position: absolute;
    top: 132px;
    left: 12px;
    width: min(300px, calc(50% - 24px));
    text-align: left;
    font-size: 22px;
    line-height: 1.25;
    font-weight: 900;
    overflow-wrap: anywhere;
    color: #f6f3ea;
    text-shadow: none;
    pointer-events: none;
  }
  .bh-feedback:empty { display: none; }
  .bh-feedback[data-tone='positive'] {
    background: #23232ef5;
    border-color: #00e5a3;
    border-radius: 20px;
  }
  .bh-feedback[data-tone='negative'] {
    color: #ff9abd;
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
    z-index: 2;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 16px;
    padding: 28px;
    background: var(--arcade-panel);
    color: var(--arcade-text);
    overflow: auto;
    touch-action: pan-y;
  }
  .bh-pause {
    background: transparent;
    color: #30264e;
    text-shadow: 0 1px 2px #fff4d7;
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
    color: var(--arcade-violet);
    min-height: 44px;
    display: flex;
    align-items: center;
    font-weight: bold;
  }
  .bh-pause a { color: #46328b; }
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
    font-size: 13px;
    line-height: 1.5;
  }
  .bh-missing {
    opacity: 0.8;
  }
  .bh-stage button:focus-visible,
  .bh-stage a:focus-visible {
    outline: 3px solid #46328b;
    outline-offset: 4px;
  }
  .bh-overlay button:focus-visible, .bh-overlay a:focus-visible { outline-color: var(--arcade-orange); }
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
    .bh-intro { max-height: 92%; overflow-y: auto; pointer-events: auto; padding: 0 6px 10px; }
  .bh-intro h1 {
      font-size: 52px;
    }
    .bh-intro p {
      font-size: 16px;
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
      font-size: 20px;
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
    .bh-intro { max-height: 92%; overflow-y: auto; pointer-events: auto; padding: 0 6px 10px; }
  .bh-intro h1 {
      font-size: 42px;
      margin: 10px 0;
    }
    .bh-intro p {
      font-size: 13px;
    }
    .bh-intro .bh-go {
      font-size: 15px;
      min-height: 44px;
      padding: 8px 18px;
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
      top: 112px;
      font-size: 18px;
    }
  }
</style>
