<script lang="ts">
  import { tick } from 'svelte';
  import MoveCard from './MoveCard.svelte';
  import Fighter from './Fighter.svelte';
  import BattleArena from './BattleArena.svelte';
  import ReviewWeights from './ReviewWeights.svelte';
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
          <p>Ogni attributo viene moltiplicato per il peso del maintainer. Si sommano i quattro risultati; a pari punti è pareggio.</p>
          <p><b>Esempio:</b> Rapidità 4 × peso 3 = 12 punti.</p>
          <p>Rapidità: agire subito. Solidità: reggere gli errori. Evidenza: verifiche e dati. Adattabilità: gestire i cambiamenti.</p>
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
    <p class="instruction">{session.mode === 'solo' ? 'Tocca un ruolo. Il computer ne sceglierà un altro.' : 'Tocca un ruolo per entrare in partita.'}</p>
    <div class="mb-cast">
      {#each cast as character}
        <button
          class="mb-character"
          disabled={session.ids.includes(character.id)}
          onclick={() => send({ type: 'character', actor: actor as 0 | 1, value: character.id })}
          aria-label={character.name}
        >
          <Fighter id={character.id} size="small" />
          <strong>{character.short}</strong>
          {#if session.ids.includes(character.id)}<span class="chosen">Player 1 ✓</span>{/if}
        </button>
      {/each}
    </div>
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
    <div class="criteria"><h2>Cosa conta in questa sfida</h2><ReviewWeights weights={session.config.weights[session.trial]} /><p>Valore della carta × peso. Vince la somma più alta.</p></div>
    <p class="instruction">{session.mode === 'local' ? 'Player 2, guarda altrove: Player 1 sceglie per primo.' : 'Il computer sceglie prima di vedere la tua carta.'}</p>
    <button class="mb-primary" onclick={() => send({ type: 'ready' })}>Scegli la mossa</button>
  {:else if session.phase === 'move1' || session.phase === 'move2'}
    <div class="move-heading">
      <Fighter id={session.ids[actor]!} size="small" eager />
      <div><p class="turn-label">{playerName(actor)} · {characters[session.ids[actor]!].short}</p><h1 bind:this={heading} tabindex="-1">La tua mossa?</h1><p class="instruction">Tocca una carta. La scelta è segreta.</p></div>
    </div>
    <div class="move-scenario"><p>{trials[session.trial].title}</p><ReviewWeights weights={session.config.weights[session.trial]} /></div>
    <div class="mb-hand">
      {#each roleCards(session.config, session.ids[actor]!) as card, index}
        <MoveCard {card} {index} onplay={() => send({ type: 'move', actor: actor as 0 | 1, value: card.id })} />
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
      <ReviewWeights weights={session.config.weights[session.trial]} />
      <div class="calculation-grid">
        {#each session.ids as id, index}
          {@const card = session.config.cards.find(candidate => candidate.id === session!.moves[index])!}
          <div><h3>{playerName(index)} · {characters[id!].short}</h3><p>{card.name}</p>
            <dl>{#each AXES as axis, position}<div><dt>{axis}</dt><dd>{card.stats[position]} × {session.config.weights[session.trial][position]} = <b>{result.contributions[index][position]}</b></dd></div>{/each}</dl>
            <p><strong>Totale: {result.scores[index]}</strong></p>
          </div>
        {/each}
      </div>
      <p>{result.winner === null ? 'Pari punti: nessuno spareggio. Il merge si fa comunque.' : `Vince ${playerName(result.winner)} con ${result.scores[result.winner]} punti: la somma più alta.`}</p>
      {#if session.mode === 'solo'}<p>{session.botLine}</p>{/if}
    </details>
    <div class="result-actions"><button class="mb-primary" onclick={() => send({ type: 'rematch' })}>Rivincita!</button><button class="mb-secondary" onclick={() => start(session!.mode)}>Cambia personaggi</button></div>
  {/if}

  {#if session}<button class="mb-exit" onclick={reset}>← Cambia modalità</button>{/if}
</main>

<style>
  .mb-shell {
    --comic-paper: #fff6e5;
    --comic-ink: #102f36;
    --comic-teal: #164e58;
    --comic-orange: #ff901c;
    --comic-yellow: #ffda66;
    --comic-blue: #d8edf0;
    --comic-display: 'Trebuchet MS', ui-sans-serif, system-ui, sans-serif;
    max-width: 1120px; margin: 0 auto; padding: 22px 32px 40px; background: var(--comic-paper); color: var(--comic-ink); min-height: calc(100svh - 70px); font-family: ui-sans-serif, system-ui, sans-serif;
  }
  .mb-shell :global(button:focus-visible), .mb-shell :global(summary:focus-visible) { outline: 3px solid #006c86; outline-offset: 5px; }
  .mb-shell h1 { font: 900 clamp(28px, 4vw, 44px)/1.08 var(--comic-display); letter-spacing: -1.3px; margin: 0; scroll-margin-top: 20px; }
  .mb-shell h1:focus { outline: none; }
  .mb-shell h2 { font-family: var(--comic-display); }
  .mb-mast { display: flex; justify-content: space-between; gap: 16px; padding: 0 0 14px; margin-bottom: 24px; border-bottom: 2px solid; font-size: 13px; font-weight: 800; }
  .mb-mast b { font-size: 11px; font-weight: 500; margin-left: 8px; }
  .mb-mast > span:last-child { font-size: 12px; font-weight: 500; }
  .intro-layout { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 32px; align-items: center; }
  .cover-panel { position: relative; min-width: 0; border: 3px solid; border-radius: 9px 9px 35px 9px; background: var(--comic-blue); padding: 26px 16px 20px; box-shadow: 6px 7px 0 var(--comic-ink); }
  .cover-panel h1 { position: relative; z-index: 2; font-size: clamp(52px, 7vw, 84px); line-height: .88; text-align: center; transform: rotate(-6deg); letter-spacing: -4px; }
  .cover-panel h1 span { color: #a04400; }
  .cover-cast { position: relative; display: flex; align-items: flex-end; margin: 16px -10px 0; }
  .cover-left, .cover-right { width: 53%; }
  .cover-right { margin-left: -6%; transform: translateY(14px); }
  .cover-vs { position: absolute; z-index: 2; top: 48%; left: 46%; background: var(--comic-yellow); border: 2px solid; border-radius: 50%; padding: 8px 5px; font: italic 900 24px/1 var(--comic-display); transform: rotate(-10deg); }
  .cover-caption { background: var(--comic-paper); border: 2px solid; padding: 9px 16px; margin: 18px 8px 0; width: fit-content; font-size: 16px; line-height: 1.35; transform: rotate(-2deg); }
  .start-panel { min-width: 0; padding: 8px 4px; }
  .balloon { border: 2px solid; border-radius: 50% 50% 50% 8px; padding: 22px 24px; font: 800 23px/1.25 var(--comic-display); text-align: center; background: #fffdf8; margin: 0 0 28px; }
  .mb-mode { display: grid; gap: 16px; }
  .mode-button { display: flex; align-items: center; gap: 20px; text-align: left; border: 3px solid var(--comic-ink); border-radius: 8px; padding: 20px; background: var(--comic-orange); color: var(--comic-ink); box-shadow: 4px 5px 0 var(--comic-ink); }
  .mode-button:hover:not(:disabled) { background: #ffa73e; transform: rotate(-1deg); }
  .mode-button.solo { background: var(--comic-teal); color: var(--comic-paper); }
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
  .picked-label, .scene-tag { display: inline-block; background: var(--comic-yellow); border: 2px solid; padding: 6px 10px; font-size: 12px; font-weight: 800; }
  .mb-cast { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 16px 12px; margin: 28px 0; }
  .mb-character { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 6px 12px; border: 2px solid; border-radius: 8px; color: var(--comic-ink); background: #fffdf8; box-shadow: 3px 4px 0 var(--comic-ink); transition: transform 150ms, background 150ms; min-width: 0; }
  .mb-character:nth-child(3n + 2) { background: #e4f1ed; }
  .mb-character:nth-child(3n) { background: #ffedc0; }
  .mb-character:hover:not(:disabled) { background: var(--comic-yellow); transform: translateY(-5px) rotate(-2deg); }
  .mb-character strong { font: 800 16px/1.1 var(--comic-display); }
  .mb-character:disabled { opacity: .65; box-shadow: none; border-style: dashed; }
  .chosen { position: absolute; top: 40%; background: var(--comic-ink); color: var(--comic-paper); border: 2px solid var(--comic-paper); padding: 6px; font-size: 12px; transform: rotate(-8deg); }
  .brief-panel { margin-top: 24px; border: 3px solid; border-radius: 8px; background: var(--comic-blue); overflow: hidden; }
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
  .mb-primary, .mb-secondary { min-height: 52px; border: 2px solid var(--comic-ink); border-radius: 6px; padding: 14px 24px; background: var(--comic-orange); color: var(--comic-ink); font-weight: 850; box-shadow: 3px 4px 0 var(--comic-ink); }
  .mb-primary:hover:not(:disabled) { background: #ffa73e; }
  .mb-secondary { background: var(--comic-paper); }
  .mb-secondary:hover:not(:disabled) { background: var(--comic-blue); }
  .move-heading { display: flex; align-items: center; gap: 24px; }
  .move-heading .instruction { margin-bottom: 0; }
  .move-scenario { border-top: 2px solid; padding-top: 14px; margin: 12px 0 24px; }
  .move-scenario > p { font-weight: 700; font-size: 15px; margin: 0 0 14px; }
  .mb-hand { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; margin: 28px 0; }
  .mb-handoff { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 560px; text-align: center; }
  .handoff-icon { display: grid; place-items: center; background: var(--comic-yellow); border: 3px solid; border-radius: 14px; font-size: 90px; line-height: 1; width: 150px; height: 140px; transform: rotate(-8deg); margin-bottom: 28px; box-shadow: 5px 5px 0; }
  .mb-handoff .balloon { font-size: 20px; margin: 24px 0 8px; padding: 15px 28px; }
  .mb-handoff > p:not(.balloon) { font-size: 14px; margin-bottom: 24px; }
  .battle-feedback { text-align: center; min-height: 110px; }
  .battle-feedback p { font-weight: 700; font-size: 15px; }
  .result-panel { border: 3px solid; border-radius: 9px; background: var(--comic-yellow); padding: 24px; text-align: center; box-shadow: 5px 6px 0 var(--comic-ink); }
  .result-stamp { display: inline-block; padding: 4px 14px; border: 2px solid; background: var(--comic-paper); transform: rotate(-4deg); margin: 0 0 18px; font-size: 12px; font-weight: 800; }
  .result-panel h1 { font-size: clamp(34px, 5.5vw, 58px); }
  .mb-scoreboard { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; max-width: 520px; margin: 24px auto 0; }
  .mb-scoreboard > div { display: flex; flex-direction: column; background: var(--comic-paper); border: 2px solid; padding: 10px 12px; border-radius: 5px; }
  .mb-scoreboard > .winner { background: var(--comic-teal); color: var(--comic-paper); border-color: var(--comic-ink); }
  .mb-scoreboard span { font-size: 12px; }
  .mb-scoreboard b { font: 900 36px/1.2 var(--comic-display); }
  .mb-scoreboard small { font: 500 12px system-ui, sans-serif; }
  .mb-scoreboard strong { font-size: 13px; }
  .result-summary { max-width: 52ch; margin: 16px auto 0; font-size: 13px; }
  .mb-merge { display: flex; flex-direction: column; align-items: center; margin-top: 4px; }
  .merge-label { background: var(--comic-ink); color: var(--comic-paper); padding: 4px 12px; font-weight: 800; font-size: 12px; transform: rotate(-3deg); }
  .mb-merge h2 { font-size: clamp(23px, 4vw, 34px); line-height: 1.1; overflow-wrap: anywhere; margin: 16px 0 8px; }
  .mb-merge p { font-size: 13px; margin: 0; }
  .result-details { margin: 24px 0; border-bottom: 2px solid; padding-bottom: 8px; }
  .result-details > p { font-size: 14px; }
  .calculation-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-top: 24px; }
  .calculation-grid h3 { font-size: 16px; margin: 0; }
  .calculation-grid p { font-size: 13px; overflow-wrap: anywhere; }
  .calculation-grid dl { font-size: 13px; }
  .calculation-grid dl > div { display: flex; justify-content: space-between; gap: 8px; border-bottom: 1px solid #b4c4bf; padding: 6px 0; }
  .calculation-grid dd { margin: 0; }
  .result-actions { display: flex; gap: 16px; }
  .mb-exit { display: block; background: none; color: var(--comic-ink); border: 0; text-decoration: underline; text-underline-offset: 4px; font-size: 13px; padding: 14px 0; margin-top: 24px; }
  .mb-exit:hover:not(:disabled) { background: none; }
  @media (max-width: 950px) { .mb-cast { grid-template-columns: repeat(4, minmax(0, 1fr)); } .intro-layout { gap: 24px; } .mode-button { padding: 16px 12px; gap: 12px; } }
  @media (max-width: 700px) {
    .mb-shell { padding: 16px 18px 30px; }
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
    .mb-cast { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 12px; }
    .mb-character { padding: 6px 8px 12px; }
    .mb-character strong { font-size: 16px; }
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
    .calculation-grid { grid-template-columns: 1fr; gap: 16px; }
    .result-actions { flex-direction: column; gap: 12px; }
    .mb-primary, .mb-secondary { width: 100%; }
  }
  @media (prefers-reduced-motion: reduce) { .mode-button, .mb-character { transition: none; } .mode-button:hover:not(:disabled), .mb-character:hover:not(:disabled) { transform: none; } }
</style>
