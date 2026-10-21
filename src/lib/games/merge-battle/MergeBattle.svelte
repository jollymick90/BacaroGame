<script lang="ts">
  import { tick } from 'svelte';
  import MoveCard from './MoveCard.svelte';
  import Fighter from './Fighter.svelte';
  import CharacterWheel from './CharacterWheel.svelte';
  import BattleArena from './BattleArena.svelte';
  import ReviewWeights from './ReviewWeights.svelte';
  import ScoreComparison from './ScoreComparison.svelte';
  import { characters, trials, createSession, input, resolve, roleCards, type Session, type Input, type Mode } from './engine';
  import { AXES } from './cards';
  import { DEFAULT_CONFIG, type MergeConfig } from './config';

  let { config = DEFAULT_CONFIG }: { config?: MergeConfig } = $props();
  let session = $state<Session | null>(null);
  let stage = $state(0);
  let heading = $state<HTMLHeadingElement>();
  let actor = $derived(session?.phase === 'character2' || session?.phase === 'move2' ? 1 : 0);
  let result = $derived(session && ['battle', 'result'].includes(session.phase)
    ? resolve(session.ids as number[], session.moves as string[], session.trial, session.config)
    : null);
  let cast = $derived(characters.filter(character => (session?.allowedCharacters ?? config.characters).includes(character.id)));
  let resultTitle = $derived.by(() => {
    if (!session || !result || result.winner === null) return 'Pareggio!';
    if (session.mode === 'solo') return result.winner === 0 ? 'Hai vinto!' : 'Vince il rivale!';
    return `Vince Player ${result.winner + 1}!`;
  });

  async function focusHeading() {
    await tick();
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }

  function start(mode: Mode) {
    const judge = config.judges[Math.floor(Math.random() * config.judges.length)];
    session = createSession(mode, judge, config);
    void focusHeading();
  }

  function send(event: Input) {
    if (!session) return;
    session = input(session, event);
    void focusHeading();
  }

  function reset() {
    session = null;
    void focusHeading();
  }

  function playerName(index: number) {
    if (index === 1 && session?.mode === 'solo') return 'Computer';
    return `Player ${index + 1}`;
  }

  $effect(() => {
    if (session?.phase !== 'battle') return;
    stage = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timings = [800, 1600, 2400, 3400, 5200, 7600];
    const timers = timings.map((delay, index) => window.setTimeout(() => {
      stage = index + 1;
    }, reduced ? (index + 1) * 150 : delay));
    return () => timers.forEach(clearTimeout);
  });
</script>

<svelte:head>
  <title>Merge Battle · BacaroTech Game Center</title>
  <meta name="description" content="Scegli il tuo Polpodev, gioca una carta e sfida il maintainer. Da solo o in due." />
</svelte:head>

<main class="mb-shell" data-phase={session?.phase ?? 'intro'}>
  <nav class="mb-navigation" aria-label="Navigazione Merge Battle">
    <a href="/">← Torna al Game Center</a>
    {#if session}<button onclick={reset}>← Cambia modalità</button>{/if}
    {#if session?.phase === 'result'}
      <button class="rematch" onclick={() => send({ type: 'rematch' })}>Rivincita!</button>
      <button onclick={() => start(session!.mode)}>Cambia personaggi</button>
    {/if}
  </nav>
  <div class="mb-mast">
    <span>Merge Battle <b>by BacaroTech</b></span>
    {#if session}<span>{session.mode === 'solo' ? 'Singolo' : '1 vs 1'} · Round {session.round + 1}</span>{:else}<span>Il gioco dei Polpodev</span>{/if}
  </div>

  {#if !session}
    <div class="intro-layout">
      <section class="cover-panel">
        <h1 bind:this={heading} tabindex="-1">Merge<br />Battle<span>!</span></h1>
        <div class="cover-cast" aria-hidden="true">
          <div class="cover-left"><Fighter id={config.characters[0]} size="large" eager /></div>
          <span class="cover-vs">VS</span>
          <div class="cover-right"><Fighter id={config.characters[1]} size="large" eager /></div>
        </div>
        <p class="cover-caption">Due tentacoli sul codice.<br /><strong>Chi la spunta?</strong></p>
      </section>
      <section class="start-panel" aria-label="Modalità di gioco">
        <p class="balloon">Una carta a testa.<br />Il maintainer decide!</p>
        <a href="/merge-battle/online">Gioca online · Due dispositivi</a>
        <div class="mb-mode">
          <button class="mode-button" onclick={() => start('local')}>
            <span class="mode-icon" aria-hidden="true">1<span>vs</span>1</span>
            <span><strong>Gioca in due</strong><small>Passatevi il telefono</small></span>
          </button>
          <button class="mode-button solo" onclick={() => start('solo')}>
            <span class="mode-icon" aria-hidden="true">1P</span>
            <span><strong>Gioca da solo</strong><small>Sfida il computer</small></span>
          </button>
        </div>
        <details class="mb-how">
          <summary>Come si gioca</summary>
          <ol>
            <li>Scegli un ruolo e leggi lo scenario.</li>
            <li>Gioca una delle tre carte, in segreto.</li>
            <li>Vince chi totalizza più punti. Poi fate il merge!</li>
          </ol>
          <p>Ogni attributo viene moltiplicato per il peso del maintainer. Si sommano i risultati dei parametri attivi; a pari punti è pareggio.</p>
          <p><b>Esempio:</b> {AXES[config.activeAxes[0]]} 4 × peso 3 = 12 punti.</p>
          <p>{#each config.activeAxes as axis}{AXES[axis]}: {['agire subito', 'reggere gli errori', 'verifiche e dati', 'gestire i cambiamenti'][axis]}. {/each}</p>
          <p>In due, chi non sceglie guarda altrove. Nessun limite di tempo.</p>
        </details>
      </section>
    </div>
  {:else if session.phase === 'character1' || session.phase === 'character2'}
    <div class="screen-heading">
      <div><p class="turn-label">{session.mode === 'solo' ? 'Il tuo personaggio' : `Tocca a Player ${actor + 1}`}</p>
        <h1 bind:this={heading} tabindex="-1">Scegli il tuo Polpodev.</h1></div>
      {#if actor === 1}<span class="picked-label">P1: {characters[session.ids[0]!].short} ✓</span>{/if}
    </div>
    {#key actor}
      <CharacterWheel {cast} taken={session.ids.filter((id): id is number => id !== null)} onchoose={id => send({ type: 'character', actor: actor as 0 | 1, value: id })} />
    {/key}
  {:else if session.phase === 'brief'}
    <div class="screen-heading"><div><p class="turn-label">Lo scenario</p><h1 bind:this={heading} tabindex="-1">La sfida è servita.</h1></div></div>
    <div class="brief-panel">
      <div class="scenario">
        <span class="scene-tag">{trials[session.trial].place}</span>
        <h2>{trials[session.trial].title}</h2>
        <p class="judge">Decide: {trials[session.trial].jury}</p>
      </div>
      <div class="mb-versus">
        {#each session.ids as id, index}
          <div><Fighter id={id!} eager /><span>{playerName(index)}</span><strong>{characters[id!].name}</strong></div>
        {/each}
        <b class="vs-label" aria-hidden="true">VS</b>
      </div>
    </div>
    <div class="criteria"><h2>Cosa conta in questa sfida</h2><ReviewWeights weights={session.config.weights[session.trial]} activeAxes={session.config.activeAxes} /><p>Valore della carta × peso. Vince la somma più alta.</p></div>
    <p class="instruction">{session.mode === 'local' ? 'Player 2, guarda altrove: Player 1 sceglie per primo.' : 'Il computer sceglie prima di vedere la tua carta.'}</p>
    <button class="mb-primary" onclick={() => send({ type: 'ready' })}>Scegli la mossa</button>
  {:else if session.phase === 'move1' || session.phase === 'move2'}
    <div class="move-heading">
      <Fighter id={session.ids[actor]!} size="small" eager />
      <div><p class="turn-label">{playerName(actor)} · {characters[session.ids[actor]!].short}</p><h1 bind:this={heading} tabindex="-1">La tua mossa?</h1><p class="instruction">Tocca una carta. La scelta è segreta.</p></div>
    </div>
    <div class="move-scenario"><p>{trials[session.trial].title}</p><ReviewWeights weights={session.config.weights[session.trial]} activeAxes={session.config.activeAxes} /><p class="scoring-hint">Ogni valore della carta si moltiplica per il peso qui sopra. Vince il totale più alto.</p></div>
    <div class="mb-hand">
      {#each roleCards(session.config, session.ids[actor]!) as card, index}
        <MoveCard {card} {index} activeAxes={session.config.activeAxes} onplay={() => send({ type: 'move', actor: actor as 0 | 1, value: card.id })} />
      {/each}
    </div>
  {:else if session.phase === 'handoff'}
    <div class="mb-handoff">
      <span class="handoff-icon" aria-hidden="true">↔</span>
      <h1 bind:this={heading} tabindex="-1">Passa il telefono.</h1>
      <p class="balloon">Player 1, niente sbirciate!</p>
      <p>La prima carta è al sicuro. Tocca a Player 2.</p>
      <button class="mb-primary" onclick={() => send({ type: 'handoff' })}>Sono Player 2</button>
    </div>
  {:else if session.phase === 'battle' && result}
    <div class="screen-heading"><div><p class="turn-label">{trials[session.trial].place}</p><h1 bind:this={heading} tabindex="-1">La resa dei conti.</h1></div></div>
    <BattleArena ids={session.ids as number[]} moves={session.moves as string[]} config={session.config} trial={session.trial} mode={session.mode} {stage} />
    {#if stage >= 5}
      <ScoreComparison
        cards={session.moves.map(move => session!.config.cards.find(card => card.id === move)!)}
        weights={session.config.weights[session.trial]}
        activeAxes={session.config.activeAxes}
        labels={[playerName(0), playerName(1)]}
      />
    {/if}
    <div class="battle-feedback" aria-live="polite">
      {#if stage >= 6}<p>{result.winner === null ? 'Stesso punteggio. Nessuno cede il branch!' : `${playerName(result.winner)} porta a casa la review.`}</p>
        <button class="mb-primary" onclick={() => send({ type: 'finish' })}>Scopri il merge</button>
      {:else}<p>Il maintainer sta valutando le carte…</p>{/if}
    </div>
  {:else if session.phase === 'result' && result}
    <div class="result-panel">
      <p class="result-stamp">Review completata</p>
      <h1 bind:this={heading} tabindex="-1">{resultTitle}</h1>
      <div class="mb-scoreboard">
        {#each session.ids as id, index}
          <div class:winner={result.winner === index}>
            <span>{playerName(index)}</span>
            <b>{result.scores[index]}<small> punti</small></b>
            <strong>{characters[id!].short}</strong>
          </div>
        {/each}
      </div>
      <p class="result-summary">{result.winner === null
        ? 'Stessi punti. Il merge si fa comunque!'
        : `La carta di ${playerName(result.winner)} vale ${Math.abs(result.scores[0] - result.scores[1])} punti in più con i pesi di questo scenario.`}</p>
      <div class="mb-merge">
        <Fighter id={session.ids[0]!} other={session.ids[1]!} emotion="win" size="large" eager />
        <span class="merge-label">Merge riuscito!</span>
        <h2>{result.hybrid}</h2>
        <p>Rivali nella review. Alleati nello stesso branch.</p>
      </div>
    </div>
    <details class="result-details">
      <summary>Perché questo risultato?</summary>
      <p>{trials[session.trial].title}</p>
      <p><b>{trials[session.trial].jury}</b></p>
      <ScoreComparison
        cards={session.moves.map(move => session!.config.cards.find(card => card.id === move)!)}
        weights={session.config.weights[session.trial]}
        activeAxes={session.config.activeAxes}
        labels={[playerName(0), playerName(1)]}
      />
      {#if session.mode === 'solo'}<p>{session.botLine}</p>{/if}
    </details>

  {/if}


</main>

<style>
  .mb-shell {
    --comic-paper: var(--arcade-bg);
    --comic-panel: var(--arcade-panel);
    --comic-raised: var(--arcade-raised);
    --comic-ink: var(--arcade-text);
    --comic-border: var(--arcade-border);
    --comic-shadow: #0c0c10;
    --comic-on-accent: #15151b;
    --comic-teal: #164e58;
    --comic-orange: var(--arcade-orange);
    --comic-yellow: #ffda66;
    --comic-blue: var(--arcade-panel);
    --comic-display: 'Trebuchet MS', ui-sans-serif, system-ui, sans-serif;
    max-width: 1120px; margin: 0 auto; padding: 22px 32px 40px; background: var(--comic-paper); color: var(--comic-ink); min-height: calc(100svh - 70px); font-family: ui-sans-serif, system-ui, sans-serif;
  }
  .mb-shell :global(button:focus-visible), .mb-shell :global(summary:focus-visible) { outline: 3px solid var(--comic-orange); outline-offset: 5px; }
  .mb-shell h1 { font: 900 clamp(28px, 4vw, 44px)/1.08 var(--comic-display); letter-spacing: -1.3px; margin: 0; scroll-margin-top: 150px; }
  .mb-shell h1:focus { outline: none; }
  .mb-shell h2 { font-family: var(--comic-display); }
  .mb-navigation { position: sticky; top: 0; z-index: 30; display: flex; flex-wrap: wrap; align-items: center; gap: 8px 20px; margin: -22px -32px 24px; padding: 10px 32px; border: 0; border-bottom: 1px solid var(--comic-border); background: var(--comic-paper); }
  .mb-navigation a, .mb-navigation button { flex: none; display: inline-flex; align-items: center; min-height: 44px; padding: 6px 0; background: none; border: 0; color: var(--comic-ink); font-size: 13px; font-weight: 700; text-decoration: underline; text-underline-offset: 4px; }
  .mb-navigation button:hover { color: var(--comic-orange); background: none; }
  .mb-navigation .rematch { color: var(--comic-orange); }
  .mb-mast { display: flex; justify-content: space-between; gap: 16px; padding: 0 0 14px; margin-bottom: 24px; border-bottom: 2px solid; font-size: 13px; font-weight: 800; }
  .mb-mast b { font-size: 11px; font-weight: 500; margin-left: 8px; }
  .mb-mast > span:last-child { font-size: 12px; font-weight: 500; }
  .intro-layout { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 32px; align-items: center; }
  .cover-panel { position: relative; min-width: 0; border: 3px solid var(--comic-border); border-radius: 9px 9px 35px 9px; background: var(--comic-blue); padding: 26px 16px 20px; box-shadow: 6px 7px 0 var(--comic-shadow); }
  .cover-panel h1 { position: relative; z-index: 2; font-size: clamp(52px, 7vw, 84px); line-height: .88; text-align: center; transform: rotate(-6deg); letter-spacing: -4px; }
  .cover-panel h1 span { color: var(--comic-orange); }
  .cover-cast { position: relative; display: flex; align-items: flex-end; margin: 16px -10px 0; }
  .cover-left, .cover-right { width: 53%; }
  .cover-right { margin-left: -6%; transform: translateY(14px); }
  .cover-vs { position: absolute; z-index: 2; top: 48%; left: 46%; background: var(--comic-yellow); color: var(--comic-on-accent); border: 2px solid var(--comic-border); border-radius: 50%; padding: 8px 5px; font: italic 900 24px/1 var(--comic-display); transform: rotate(-10deg); }
  .cover-caption { background: var(--comic-paper); border: 2px solid var(--comic-border); padding: 9px 16px; margin: 18px 8px 0; width: fit-content; font-size: 16px; line-height: 1.35; transform: rotate(-2deg); }
  .start-panel { min-width: 0; padding: 8px 4px; }
  .balloon { border: 2px solid var(--comic-border); border-radius: 50% 50% 50% 8px; padding: 22px 24px; font: 800 23px/1.25 var(--comic-display); text-align: center; background: var(--comic-panel); margin: 0 0 28px; }
  .mb-mode { display: grid; gap: 16px; }
  .mode-button { display: flex; align-items: center; gap: 20px; text-align: left; border: 3px solid var(--comic-border); border-radius: 8px; padding: 20px; background: var(--comic-orange); color: var(--comic-on-accent); box-shadow: 4px 5px 0 var(--comic-shadow); }
  .mode-button:hover:not(:disabled) { background: #ffa73e; transform: rotate(-1deg); }
  .mode-button.solo { background: var(--comic-teal); color: var(--comic-ink); }
  .mode-button.solo:hover:not(:disabled) { background: #216575; }
  .mode-icon { font: 900 30px/1 var(--comic-display); white-space: nowrap; min-width: 66px; }
  .mode-icon > span { display: inline-block; font-size: 14px; transform: rotate(-10deg); margin: 0 3px; }
  .mode-button strong { display: block; font: 900 23px/1.15 var(--comic-display); }
  .mode-button small { display: block; margin-top: 6px; font-size: 12px; font-weight: 500; }
  .mb-how { margin-top: 26px; font-size: 14px; }
  .mb-how summary, .result-details summary { min-height: 48px; align-content: center; cursor: pointer; font-weight: 750; }
  .mb-how ol { padding-left: 22px; }
  .mb-how li { margin-bottom: 8px; }
  .mb-how p { font-size: 13px; }
  .screen-heading { display: flex; gap: 20px; align-items: center; justify-content: space-between; margin: 32px 0 12px; }
  .turn-label { font-size: 13px; margin: 0 0 8px; font-weight: 700; }
  .instruction { font-size: 14px; line-height: 1.5; margin: 12px 0 24px; }
  .picked-label, .scene-tag { display: inline-block; background: var(--comic-yellow); color: var(--comic-on-accent); border: 2px solid var(--comic-border); padding: 6px 10px; font-size: 12px; font-weight: 800; }
  .brief-panel { margin-top: 24px; border: 3px solid var(--comic-border); border-radius: 8px; background: var(--comic-blue); overflow: hidden; }
  .scenario { padding: 22px 24px 0; }
  .scene-tag { font-size: 10px; }
  .scenario h2 { font-size: clamp(23px, 3.5vw, 34px); line-height: 1.15; max-width: 30ch; margin: 14px 0 12px; }
  .judge { font-size: 12px; margin: 0; }
  .mb-versus { position: relative; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; padding: 0 30px 22px; }
  .mb-versus > div { display: flex; flex-direction: column; align-items: center; min-width: 0; text-align: center; }
  .mb-versus span { font-size: 12px; }
  .mb-versus strong { font-size: 14px; margin-top: 4px; }
  .vs-label { position: absolute; top: 45%; left: 50%; transform: translate(-50%, -50%) rotate(-9deg); font: italic 900 38px var(--comic-display); }
  .criteria { margin: 24px 0; }
  .criteria h2 { font-size: 16px; margin-bottom: 12px; }
  .criteria p { font-size: 12px; margin-bottom: 0; }
  .mb-primary { min-height: 52px; border: 2px solid var(--comic-border); border-radius: 6px; padding: 14px 24px; background: var(--comic-orange); color: var(--comic-on-accent); font-weight: 850; box-shadow: 3px 4px 0 var(--comic-shadow); }
  .mb-primary:hover:not(:disabled) { background: #ffa73e; }
  .move-heading { display: flex; align-items: center; gap: 24px; }
  .move-heading .instruction { margin-bottom: 0; }
  .move-scenario { border-top: 2px solid; padding-top: 14px; margin: 12px 0 24px; }
  .move-scenario > p { font-weight: 700; font-size: 15px; margin: 0 0 14px; }
  .move-scenario > .scoring-hint { font-size: 12px; font-weight: 500; margin: 12px 0 0; }
  .mb-hand { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; margin: 28px 0; }
  .mb-handoff { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 560px; text-align: center; }
  .handoff-icon { display: grid; place-items: center; background: var(--comic-yellow); color: var(--comic-on-accent); border: 3px solid var(--comic-border); border-radius: 14px; font-size: 90px; line-height: 1; width: 150px; height: 140px; transform: rotate(-8deg); margin-bottom: 28px; box-shadow: 5px 5px 0; }
  .mb-handoff .balloon { font-size: 20px; margin: 24px 0 8px; padding: 15px 28px; }
  .mb-handoff > p:not(.balloon) { font-size: 14px; margin-bottom: 24px; }
  .battle-feedback { text-align: center; min-height: 110px; }
  .battle-feedback p { font-weight: 700; font-size: 15px; }
  .result-panel { border: 3px solid var(--comic-border); border-radius: 9px; background: var(--comic-panel); padding: 24px; text-align: center; box-shadow: 5px 6px 0 var(--comic-shadow); }
  .result-stamp { display: inline-block; padding: 4px 14px; border: 2px solid var(--comic-border); background: var(--comic-paper); transform: rotate(-4deg); margin: 0 0 18px; font-size: 12px; font-weight: 800; }
  .result-panel h1 { font-size: clamp(34px, 5.5vw, 58px); }
  .mb-scoreboard { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; max-width: 520px; margin: 24px auto 0; }
  .mb-scoreboard > div { display: flex; flex-direction: column; background: var(--comic-paper); border: 2px solid var(--comic-border); padding: 10px 12px; border-radius: 5px; }
  .mb-scoreboard > .winner { background: var(--comic-teal); color: var(--comic-ink); border-color: var(--comic-ink); }
  .mb-scoreboard span { font-size: 12px; }
  .mb-scoreboard b { font: 900 36px/1.2 var(--comic-display); }
  .mb-scoreboard small { font: 500 12px system-ui, sans-serif; }
  .mb-scoreboard strong { font-size: 13px; }
  .result-summary { max-width: 52ch; margin: 16px auto 0; font-size: 13px; }
  .mb-merge { display: flex; flex-direction: column; align-items: center; margin-top: 4px; }
  .merge-label { background: var(--comic-orange); color: var(--comic-on-accent); padding: 4px 12px; font-weight: 800; font-size: 12px; transform: rotate(-3deg); }
  .mb-merge h2 { font-size: clamp(23px, 4vw, 34px); line-height: 1.1; overflow-wrap: anywhere; margin: 16px 0 8px; }
  .mb-merge p { font-size: 13px; margin: 0; }
  .result-details { margin: 24px 0; border-bottom: 2px solid; padding-bottom: 8px; }
  .result-details > p { font-size: 14px; }
  @media (max-width: 950px) { .intro-layout { gap: 24px; } .mode-button { padding: 16px 12px; gap: 12px; } }
  @media (max-width: 700px) {
    .mb-shell { padding: 16px 18px 30px; }
    .mb-navigation { margin: -16px -18px 20px; padding: 6px 18px; gap: 0 16px; }
    .mb-navigation a, .mb-navigation button { font-size: 12px; }
    .mb-mast { margin-bottom: 20px; font-size: 12px; }
    .mb-mast b { display: none; }
    .mb-mast > span:last-child { font-size: 11px; }
    .intro-layout { grid-template-columns: minmax(0, 1fr); gap: 26px; }
    .cover-panel { padding: 18px 10px 16px; }
    .cover-panel h1 { font-size: 64px; letter-spacing: -3px; }
    .cover-cast { max-width: 370px; margin: 10px auto 0; }
    .cover-caption { margin: 6px 4px 0; padding: 7px 12px; font-size: 14px; }
    .start-panel { padding: 0; }
    .start-panel > .balloon { display: none; }
    .mode-button { gap: 18px; padding: 16px; }
    .mode-button strong { font-size: 22px; }
    .mb-how { margin-top: 20px; }
    .screen-heading { align-items: flex-start; flex-direction: column; gap: 10px; margin-top: 24px; }
    .mb-versus { gap: 36px; padding: 10px 12px 20px; }
    .mb-versus strong { font-size: 12px; }
    .vs-label { font-size: 27px; }
    .scenario { padding: 18px 16px 0; }
    .move-heading { gap: 8px; }
    .move-heading :global(.fighter) { width: 100px; flex-shrink: 0; }
    .move-heading h1 { font-size: 30px; }
    .move-heading .turn-label { font-size: 11px; }
    .move-heading .instruction { font-size: 12px; }
    .mb-hand { grid-template-columns: 1fr; gap: 20px; }
    .mb-handoff { min-height: 520px; }
    .result-panel { padding: 20px 12px; }
    .mb-scoreboard { gap: 8px; }
    .mb-scoreboard b { font-size: 32px; }
    .mb-primary { width: 100%; }
  }
  @media (prefers-reduced-motion: reduce) { .mode-button { transition: none; } .mode-button:hover:not(:disabled) { transform: none; } }
</style>
