<script lang="ts">
  import { tick } from 'svelte';
  import Robot from './Robot.svelte';
  import CloseWindows from './CloseWindows.svelte';
  import Loading99 from './Loading99.svelte';
  import SelectRobot from './SelectRobot.svelte';

  import MathTrap from './MathTrap.svelte';
  import { selectTrials, trials, type Outcome, type Trial } from './trials';
  let selected = $state<Trial[]>(trials.slice(0, 3));
  let outcome = $state<Outcome>('human');
  let downloading = $state(false);
  let downloadError = $state('');
  async function download() {
    downloading = true;
    downloadError = '';
    try {
      const { downloadCertificate } = await import('./certificate');
      await downloadCertificate(outcome);
    } catch {
      downloadError = 'Le stampanti hanno scioperato. Riprova a scaricare il PDF.';
    } finally {
      downloading = false;
    }
  }
  function answerMath(answer: Outcome) {
    if (answer === 'robot') {
      outcome = 'robot';
      phase = 'certificate';
      void focusHeading();
      return;
    }
    void solve();
  }
  let phase = $state<'intro' | 'trial' | 'certificate'>('intro');
  let checked = $state(false),
    trial = $state(0),
    solved = $state(false),
    hint = $state(0),
    attempt = $state(0);
  const current = $derived(selected[trial]);
  let heading = $state<HTMLHeadingElement>();
  let result = $state<HTMLHeadingElement>();
  async function focusHeading() {
    await tick();
    heading?.focus();
  }
  function start() {
    selected = selectTrials();
    outcome = 'human';
    downloadError = '';
    phase = 'trial';
    trial = 0;
    solved = false;
    hint = 0;
    attempt++;
    void focusHeading();
  }
  function restart() {
    trial = 0;
    solved = false;
    hint = 0;
    attempt++;
    void focusHeading();
  }
  async function solve() {
    solved = true;
    await tick();
    result?.focus();
  }
  function next() {
    if (trial === 2) phase = 'certificate';
    else {
      trial++;
      solved = false;
      hint = 0;
      attempt++;
    }
    void focusHeading();
  }
  function replay() {
    checked = false;
    phase = 'intro';
    trial = 0;
    hint = 0;
    solved = false;
    attempt++;
    void focusHeading();
  }
</script>

<svelte:head><title>Are You an AI? · BacaroTech Game Center</title></svelte:head>
<div class="ai-game">
  <header class="ai-header">
    <span class="game-name">Are You an AI?</span><span class="department"
      >Ufficio dubbi sull’umanità</span
    >
  </header>
  <main class="ai-main">
    {#if phase === 'intro'}
      <section class="intro-screen">
        <div class="intro-heading">
          <div>

            <h1 bind:this={heading} tabindex="-1">Hai l’aria<br />di un algoritmo.</h1>
          </div>
          <Robot />
        </div>
        <p class="intro-copy">
          Tre prove casuali per convincere un robot molto poco convincibile. Prenditi tutto il tempo
          che vuoi.
        </p>
        <label class="human-checkbox"
          ><input type="checkbox" bind:checked /><span>Non sono un robot</span><span
            class="checkbox-mark"
            aria-hidden="true">✓?</span
          ></label
        >
        <div class="intro-answer" role="status">
          {#if checked}<p>“È esattamente quello che direbbe un robot.”</p>{:else}<p>
              Il robot attende una dichiarazione molto sospetta.
            </p>{/if}
        </div>
        <button class="ai-primary start-button" disabled={!checked} onclick={start}
          >Verificami, allora</button
        >
        <p class="small-print">
          È un gioco, non una certificazione reale.
        </p>
      </section>
    {:else if phase === 'trial'}
      <section class="trial-screen" aria-label={`Prova ${trial + 1} di 3`}>
        <div class="trial-progress">
          <span>Prova {trial + 1} di 3</span>
          <div class="progress-dots" aria-hidden="true">
            {#each selected as _, index}<span
                class:complete={index < trial || (index === trial && solved)}
                class:active={index === trial}
              ></span>{/each}
          </div>
        </div>
        <div class="trial-heading">
          <div>
            <h1 bind:this={heading} tabindex="-1">{current.title}</h1>
            <p>
              {solved ? 'Annoterò questo comportamento nel tuo fascicolo.' : current.description}
            </p>
          </div>
          <Robot interactive={current.id === 'robot' && !solved} onclick={solve} />
        </div>
        {#if solved}
          <div class="solved-panel">
            <div class="solved-symbol" aria-hidden="true">{current.symbol}</div>
            <h2 bind:this={result} tabindex="-1">{current.result}</h2>
            <p class="robot-response">“{current.response}”</p>
            <button class="ai-primary" onclick={next}>Continua</button>
          </div>
        {:else}
          {#key attempt}
            {#if current.id === 'windows'}<CloseWindows
                onsolve={solve}
              />{:else if current.id === 'loading'}<Loading99
                onsolve={solve}
              />{:else if current.id === 'math'}<MathTrap
                onanswer={answerMath}
              />{:else}<SelectRobot />{/if}
          {/key}
          <div class="trial-controls">
            <button
              class="hint-button"
              disabled={hint === 2}
              onclick={() => (hint = Math.min(2, hint + 1))}
              >{hint === 0 ? 'Indizio' : hint === 1 ? 'Altro indizio' : 'Indizi mostrati'}<span
                aria-hidden="true"
              >
                ?</span
              ></button
            ><button class="restart-button" onclick={restart}>Ricomincia dalla prima prova</button>
          </div>
          <div class="hint-area" role="status">
            {#if hint > 0}<p><strong>Indizio 1.</strong> {current.hints[0]}</p>{/if}{#if hint > 1}<p
              >
                <strong>Indizio 2.</strong>
                {current.hints[1]}
              </p>{/if}
          </div>
        {/if}
      </section>
    {:else}
      <section class="certificate-screen">
        <div class="certificate">
          <div class="certificate-top">
            <span>Ufficio dubbi sull’umanità</span><img
              class="certificate-logo"
              src="/bacarotech-logo.png"
              alt="BacaroTech"
            />
          </div>
          <p class="certificate-label">Certificato di tolleranza provvisoria</p>
          <h1 bind:this={heading} tabindex="-1">
            {#if outcome === 'robot'}ROBOT PER<br />ECCESSO<br />DI PRECISIONE{:else}UMANO PER<br
              />INSUFFICIENZA<br />DI PROVE{/if}
          </h1>
          <p class="certificate-subtitle">
            {outcome === 'robot'
              ? 'Risposta esatta. Un umano avrebbe almeno esitato.'
              : 'Il sistema non è convinto, ma deve andare in pausa.'}
          </p>
          <div class="certificate-bottom">
            <span
              >{outcome === 'robot'
                ? 'Calcolo perfetto. Sospetto confermato.'
                : 'Tre prove superate. Zero certezze acquisite.'}</span
            >
            <div class="human-stamp" aria-hidden="true">
              {outcome === 'robot' ? 'Beccato! 🤖' : 'Pare umano ✓'}
            </div>
          </div>
        </div>
        <p class="small-print">Un verdetto scherzoso del BacaroTech, senza alcun valore reale.</p>
        <button class="ai-primary download-button" disabled={downloading} onclick={download}
          >{downloading ? 'Prepariamo il PDF…' : 'Scarica certificato PDF'}</button
        >
        {#if downloadError}<p role="alert">{downloadError}</p>{/if}
        <div class="certificate-actions">
          <button class="home-button" onclick={replay}>Riprova</button><a
            class="home-button"
            href="/">Torna al Game Center</a
          >
        </div>
      </section>
    {/if}
  </main>
</div>

<style>
  .certificate-logo {
    width: 65px;
    height: 65px;
    object-fit: contain;
    background: #193e35;
    border-radius: 6px;
    padding: 4px;
  }
  .download-button {
    width: 100%;
    margin-top: 20px;
  }

  .ai-game {
    max-width: 850px;
    margin: auto;
    padding: 0 28px;
    font-family: var(--arcade-display);
    color: var(--arcade-text);
  }
  .ai-header {
    height: 75px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    border-bottom: 1px solid var(--arcade-border);
  }
  .game-name {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.7px;
  }
  .department {
    font-size: 13px;
    color: var(--arcade-muted);
  }
  .ai-main {
    max-width: 640px;
    margin: 30px auto 48px;
    background: var(--arcade-panel);
    border: 1px solid var(--arcade-border);
    border-radius: 22px;
    padding: 28px;
  }
  .intro-heading,
  .trial-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .intro-heading h1 {
    font-size: clamp(31px, 5vw, 47px);
    letter-spacing: -1.8px;
    line-height: 1.06;
    margin: 0;
  }
  .intro-copy {
    font-size: 15px;
    max-width: 50ch;
    margin: 24px 0;
    color: var(--arcade-muted);
  }
  .human-checkbox {
    display: flex !important;
    align-items: center;
    gap: 14px;
    padding: 22px 18px;
    background: #fffef9;
    color: #193e35;
    border: 2px solid #193e35;
    border-radius: 12px;
    font-size: 20px !important;
    font-weight: 700 !important;
    cursor: pointer;
    margin: 0 !important;
  }
  .human-checkbox input {
    width: 28px;
    height: 28px;
    accent-color: var(--arcade-violet);
    flex: none;
    margin: 0;
  }
  .checkbox-mark {
    font-size: 24px;
    margin-left: auto;
    color: var(--arcade-violet);
  }
  .intro-answer {
    min-height: 78px;
    padding: 17px 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--arcade-violet);
  }
  .intro-answer p {
    margin: 0;
    max-width: 43ch;
  }
  .ai-primary {
    box-shadow: 0 4px 0 #0c0c10;
    background: var(--arcade-violet);
    border: 1px solid #15151b;
    color: #15151b;
    min-height: 50px;
    padding: 12px 24px;
    font-weight: 700;
    border-radius: 9px;
    font-size: 15px;
  }
  .ai-primary:hover:not(:disabled) {
    background: #c9b5ff;
  }
  .start-button {
    width: 100%;
  }
  .small-print {
    font-size: 13px;
    color: var(--arcade-muted);
    margin: 15px 0 0;
    text-align: center;
  }
  .trial-progress {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 700;
    color: var(--arcade-violet);
    margin-bottom: 20px;
  }
  .progress-dots {
    display: flex;
    gap: 7px;
  }
  .progress-dots span {
    width: 22px;
    height: 7px;
    border-radius: 8px;
    background: #d4c9df;
  }
  .progress-dots span.active {
    background: #6742a6;
  }
  .progress-dots span.complete {
    background: #193e35;
  }
  .trial-heading {
    margin-bottom: 22px;
  }
  .trial-heading h1 {
    font-size: 30px;
    letter-spacing: -1px;
    line-height: 1.13;
    margin: 0 0 10px;
    max-width: 15ch;
  }
  .trial-heading p {
    font-size: 14px;
    line-height: 1.45;
    color: var(--arcade-muted);
    max-width: 29ch;
    margin: 0;
  }
  .trial-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-top: 14px;
  }
  .hint-button {
    color: var(--arcade-violet);
    background: var(--arcade-raised);
    border: 1px solid #b7a4cc;
    font-size: 13px;
    min-height: 44px;
    padding: 8px 14px;
  }
  .hint-button:hover:not(:disabled) {
    background: var(--arcade-raised);
  }
  .hint-button span {
    font-weight: 800;
  }
  .restart-button {
    background: none !important;
    color: var(--arcade-muted);
    border: 0;
    text-decoration: underline;
    text-underline-offset: 3px;
    font-size: 14px;
    min-height: 44px;
    padding: 8px;
  }
  .hint-area {
    font-size: 13px;
    line-height: 1.5;
  }
  .hint-area p {
    background: #fffef9;
    color: #193e35;
    border-left: 3px solid #6742a6;
    padding: 12px 14px;
    margin: 12px 0 0;
  }
  .hint-area strong {
    color: #6742a6;
  }
  .solved-panel {
    border: 2px solid #193e35;
    border-radius: 13px;
    padding: 30px 20px;
    text-align: center;
    background: #fffef9;
    color: #193e35;
  }
  .solved-symbol {
    font-size: 52px;
    color: var(--arcade-violet);
    font-weight: 800;
    letter-spacing: -2px;
  }
  .solved-panel h2 {
    font-size: 24px;
    line-height: 1.2;
    letter-spacing: -0.7px;
    margin: 12px 0 20px;
  }
  .solved-panel .robot-response {
    font-size: 20px;
    line-height: 1.4;
    color: #6742a6;
    max-width: 30ch;
    margin: 0 auto 28px;
  }
  .certificate {
    border: 3px double #193e35;
    outline: 1px solid #193e35;
    outline-offset: 5px;
    border-radius: 4px;
    background: #fffef9;
    color: #193e35;
    padding: 22px;
  }
  .certificate-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border-bottom: 1px solid #bac4b1;
    padding-bottom: 16px;
    font-size: 13px;
  }
  .certificate-top > span:last-child {
    font-size: 32px;
    line-height: 1;
  }
  .certificate .certificate-label {
    font-size: 14px;
    color: #6742a6;
    margin: 24px 0 12px;
  }
  .certificate h1 {
    font-size: clamp(28px, 5vw, 43px);
    line-height: 1.06;
    letter-spacing: -1px;
    margin: 0 0 20px;
    overflow-wrap: anywhere;
  }
  .certificate-subtitle {
    font-size: 15px;
    line-height: 1.5;
    max-width: 35ch;
  }
  .certificate-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: 28px;
    font-size: 13px;
    color: #536559;
  }
  .human-stamp {
    border: 2px solid #6742a6;
    border-radius: 50%;
    padding: 14px 9px;
    text-align: center;
    transform: rotate(-13deg);
    color: #6742a6;
    font-size: 14px;
    font-weight: 800;
  }
  .certificate-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 28px;
  }
  .certificate-actions > * {
    flex: 1;
    text-align: center;
  }
  .home-button {
    background: transparent;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid #6742a6;
    border-radius: 9px;
    min-height: 50px;
    padding: 10px 14px;
    font-size: 14px;
    color: var(--arcade-violet);
    font-weight: 700;
    text-decoration: none;
  }
  .home-button:hover {
    background: var(--arcade-raised);
  }
  @media (max-width: 650px) {
    .ai-game {
      padding: 0 16px;
    }
    .ai-header {
      height: 61px;
    }
    .department {
      font-size: 13px;
      max-width: 16ch;
      text-align: right;
    }
    .ai-main {
      margin: 18px auto 30px;
      padding: 20px 16px;
      border-radius: 16px;
    }
    .intro-heading {
      gap: 5px;
    }
    .intro-heading h1 {
      font-size: 34px;
      letter-spacing: -1.3px;
    }
    .intro-copy {
      font-size: 14px;
      margin: 20px 0;
    }
    .human-checkbox {
      font-size: 17px !important;
      padding: 18px 14px;
      gap: 10px;
    }
    .checkbox-mark {
      font-size: 20px;
    }
    .trial-heading {
      gap: 6px;
      margin-bottom: 18px;
    }
    .trial-heading h1 {
      font-size: 27px;
    }
    .trial-progress {
      margin-bottom: 16px;
    }
    .certificate {
      padding: 20px 15px;
    }
    .certificate h1 {
      font-size: 32px;
    }
    .certificate-actions {
      flex-direction: column;
    }
    .solved-panel .robot-response {
      font-size: 18px;
    }
    .trial-controls {
      gap: 5px;
    }
    .hint-button {
      font-size: 14px;
      padding: 8px 10px;
    }
  }
  @media (max-width: 370px) {
    .ai-game {
      padding: 0 12px;
    }
    .ai-main {
      padding: 18px 12px;
    }
    .intro-heading h1 {
      font-size: 29px;
    }
    .trial-heading h1 {
      font-size: 24px;
    }
    .human-checkbox {
      font-size: 16px !important;
    }
    .checkbox-mark {
      display: none;
    }
    .certificate h1 {
      font-size: 28px;
    }
  }
  @media (max-height: 750px) and (max-width: 650px) {
    .ai-header {
      height: 52px;
    }
    .ai-main {
      margin-top: 12px;
      padding-top: 16px;
    }
    .trial-progress {
      margin-bottom: 10px;
    }
    .trial-heading {
      margin-bottom: 12px;
    }
    .trial-heading h1 {
      font-size: 25px;
    }
  }
</style>
