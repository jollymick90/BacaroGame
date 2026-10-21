<script lang="ts">
  import { TUTORIAL_STEPS, type TutorialSnapshot } from './tutorial';
  import type { RunSettings } from './run-settings';
  import type { Phase } from './mechanics';

  let { state, phase, production, onnext, onreplay, onexit, onplay, onskip, runSettings } = $props<{
    runSettings: RunSettings;
    onskip: () => void;
    state: TutorialSnapshot;
    phase: Phase;
    production: number;
    onnext: () => void;
    onreplay: () => void;
    onexit: () => void;
    onplay: () => void;
  }>();
  let heading: HTMLHeadingElement;
  let panel: HTMLElement;
  const stepId = $derived(state.step);
  const index = $derived(TUTORIAL_STEPS.findIndex(step => step.id === stepId));
  const step = $derived(TUTORIAL_STEPS[index]);
  const quizFailed = $derived(stepId === 'heart' && state.correct === false);

  $effect(() => {
    stepId;
    if (panel) panel.scrollTop = 0;
    heading?.focus({ preventScroll: true });
  });
</script>

<section bind:this={panel} class="tutorial-guide" aria-labelledby="tutorial-title">
  <div class="tutorial-heading">
    <span>Come si gioca · {index + 1}/{TUTORIAL_STEPS.length}</span>
    <button class="exit" onclick={onexit}>Esci dal tutorial</button>
  </div>
  <button class="skip" onclick={onskip}>Salta e non mostrare più</button>
  <h2 id="tutorial-title" bind:this={heading} tabindex="-1">{step.title}</h2>
  <p>{step.text}</p>
  {#if stepId === 'welcome'}
    <p>Parti come developer. A {runSettings.distanceGoal} metri attraversi la barriera premio con il polipo: occupa tutte le corsie e non si può saltare. Diventi il polipo Bacaro, poi catturi altri {runSettings.bugGoal} bug e arrivi alla review finale.</p>
    <p class="hint">La velocità aumenta gradualmente. Hai tre vite: ogni bug mancato o urto costa una vita.</p>
    <details><summary>Abilità automatiche</summary><p class="hint">5 Heisenbug: scudo per 8 s. 3 Regression: una vita in più. 3 Production: rallentamento per 6 s. 4 Feature: punti doppi per 10 s.</p></details>
    <p class="hint">Qui guardi e impari. In partita: ← → / A D per cambiare corsia, ↑ / W / spazio per saltare. Su telefono, scorri o usa i pulsanti.</p>
  {:else if stepId === 'ability'}
    <p class="progress" role="status">Production {Math.min(production, 3)}/3 → rallentamento</p>
  {/if}
  {#if state.complete && stepId !== 'welcome'}
    <p class="outcome" role="status">
      {#if stepId === 'miss'}Bug scappato: da 3 a 2 vite.
      {:else if stepId === 'obstacle'}Il caffè non era un checkpoint: da 2 a 1 vita.
      {:else if stepId === 'ability'}Potere sbloccato! Tre bug uguali, mondo rallentato.
      {:else if state.correct}Rompicapo risolto: da 1 a 2 vite. Sei pronto!
      {:else}Nessuna vita persa. Riprova per conquistare il cuore.{/if}
    </p>
  {:else if stepId !== 'welcome'}
    <p class="hint" role="status">{phase === 'paused' ? 'Dimostrazione in pausa. Premi Rivedi per ripartire.' : 'Guarda la dimostrazione nella scena…'}</p>
  {/if}
  <div class="actions">
    {#if stepId !== 'welcome'}
      <button onclick={onreplay}>{quizFailed ? 'Riprova il quiz' : 'Rivedi'}</button>
    {/if}
    {#if stepId === 'heart'}
      <button class="primary" disabled={!state.complete || state.correct !== true} onclick={onplay}>Gioca</button>
    {:else}
      <button class="primary" disabled={!state.complete} onclick={onnext}>
        {stepId === 'welcome' ? 'Fammi vedere' : 'Avanti'}
      </button>
    {/if}
  </div>
</section>

<style>
  .tutorial-guide {
    position: absolute;
    top: 122px;
    left: 12px;
    width: min(360px, calc(100% - 24px));
    max-height: calc(100% - 140px);
    overflow-y: auto;
    box-sizing: border-box;
    padding: 16px;
    border: 2px solid #b9a1fb;
    border-radius: 20px;
    background: #23232ef5;
    color: #f6f3ea;
    touch-action: pan-y;
  }
  .tutorial-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .tutorial-heading > span { color: #ff9abd; font-size: 12px; font-weight: 800; }
  h2 { margin: 12px 0 8px; font-size: 24px; line-height: 1.15; color: #f6f3ea; }
  p { margin: 8px 0; font-size: 16px; line-height: 1.4; }
  .hint { color: #c9c9d8; font-size: 13px; }
  .progress, .outcome { color: #6fffd4; font-size: 14px; font-weight: 800; }
  .actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
  button {
    min-height: 44px;
    padding: 8px 12px;
    border: 1px solid #77758c;
    border-radius: 10px;
    background: #30303f;
    color: #f6f3ea;
    font: inherit;
    font-size: 14px;
    cursor: pointer;
  }
  .skip { width: 100%; margin-top: 10px; }
  summary { cursor: pointer; font-size: 14px; }
  button.primary { background: #00e5a3; color: #15151b; font-weight: 800; }
  button:disabled { opacity: 0.45; cursor: default; }
  button.exit { padding: 4px 6px; background: transparent; font-size: 12px; }
  button:focus-visible { outline: 3px solid #ffcf70; outline-offset: 2px; }
  @media (max-height: 500px) {
    .tutorial-guide { top: 106px; width: min(300px, calc(50% - 18px)); max-height: calc(100% - 118px); padding: 10px; }
    h2 { font-size: 19px; }
    p { font-size: 13px; }
    .tutorial-heading { flex-wrap: wrap; gap: 2px; }
  }
</style>
