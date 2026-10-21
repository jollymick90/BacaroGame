<script lang="ts">
  import { onMount } from 'svelte';
  import type { HeartQuestion } from './questions';

  let { question, onanswer, oncontinue, onskip } = $props<{
    question: HeartQuestion;
    onanswer: (correct: boolean) => void;
    oncontinue: () => void;
    onskip: () => void;
  }>();
  let dialog: HTMLDialogElement;
  let selected = $state<number | null>(null);
  const correct = $derived(selected === question.correctIndex);
  let countdown = $state(3);
  let feedbackHidden = $state(false);
  let feedbackTimer: ReturnType<typeof setTimeout> | undefined;
  let countdownTimer: ReturnType<typeof setInterval> | undefined;

  function stopCountdown() {
    clearInterval(countdownTimer);
    clearTimeout(feedbackTimer);
    countdownTimer = undefined;
  }

  function continueRun() {
    stopCountdown();
    dialog.close();
    oncontinue();
  }

  function visibilityChanged() {
    // Never resume into an unseen course after switching tab or locking a phone.
    if (document.hidden && selected !== null && correct) skip();
  }

  onMount(() => {
    dialog.showModal();
    document.addEventListener('visibilitychange', visibilityChanged);
    return () => {
      stopCountdown();
      document.removeEventListener('visibilitychange', visibilityChanged);
      dialog.close();
    };
  });

  function answer(index: number) {
    if (selected !== null) return;
    selected = index;
    onanswer(correct);
    if (correct) {
      // Also hide without CSS animation (global reduced-motion styles disable it).
      feedbackTimer = setTimeout(() => { feedbackHidden = true; }, 900);
      countdownTimer = setInterval(() => {
        countdown -= 1;
        if (countdown === 0) continueRun();
      }, 1000);
    }
  }

  function skip() {
    stopCountdown();
    dialog.close();
    onskip();
  }
</script>

<dialog bind:this={dialog} class:heart-success={selected !== null && correct}
  aria-labelledby="heart-title"
  aria-describedby={selected !== null && correct ? 'heart-countdown' : 'heart-instructions'}
  oncancel={(event) => { event.preventDefault(); skip(); }}>
  {#if selected !== null && correct}
    <div class="feedback success-feedback" class:hidden={feedbackHidden}>
      <span class="heart" aria-hidden="true">♥</span>
      <h2 id="heart-title">Una vita recuperata! ♥</h2>
      <p>{question.explanation}</p>
    </div>
    <div class="countdown">
      <p id="heart-countdown" role="status">La corsa riparte tra <strong>{countdown}</strong></p>
      <button class="skip" onclick={skip}>Resta in pausa</button>
    </div>
  {:else}
    <span class="heart" aria-hidden="true">♥</span>
    <p class="eyebrow">Un cuore da conquistare</p>
    <h2 id="heart-title">{question.prompt}</h2>
    <p id="heart-instructions">La corsa è ferma. Una risposta giusta vale una vita. Nessun timer, nessuna penalità.</p>
    <div class="answers">
      {#each question.answers as text, index}
        <button disabled={selected !== null} class:correct={selected !== null && index === question.correctIndex}
          class:wrong={selected === index && !correct} onclick={() => answer(index)}>
          <span aria-hidden="true">{String.fromCharCode(65 + index)}</span>
          {text}
          {#if selected !== null && index === question.correctIndex}<span class="result">✓ Corretta</span>{/if}
        </button>
      {/each}
    </div>
    {#if selected !== null}
      <div class="feedback" role="status">
        <strong>{correct ? 'Una vita recuperata! ♥' : 'Questa volta niente cuore. Nessuna vita persa.'}</strong>
        <p>{question.explanation}</p>
      </div>
      <button class="continue" onclick={continueRun}>Continua la corsa</button>
    {:else}
      <button class="skip" onclick={skip}>Salta la domanda e resta in pausa</button>
    {/if}
  {/if}
</dialog>

<style>
  dialog {
    box-sizing: border-box;
    width: min(540px, calc(100vw - 24px));
    max-height: calc(100svh - 24px);
    overflow-y: auto;
    padding: clamp(20px, 4vw, 32px);
    border: 2px solid #b9a1fb;
    border-radius: 24px;
    background: #23232e;
    color: #f6f3ea;
    box-shadow: 0 18px 80px #0008;
    font-family: inherit;
    touch-action: pan-y;
  }
  dialog::backdrop { background: #11111bd9; }
  dialog.heart-success {
    border: 0;
    padding: 8px;
    background: transparent;
    box-shadow: none;
    overflow: visible;
  }
  dialog.heart-success::backdrop {
    animation: clear-backdrop 800ms ease-out forwards;
  }
  .success-feedback, .countdown {
    padding: 20px;
    border: 2px solid #00e5a3;
    border-radius: 20px;
    background: #23232ef5;
    text-align: center;
  }
  .success-feedback {
    pointer-events: none;
    animation: hide-success 350ms ease-in 550ms forwards;
  }
  .success-feedback.hidden { opacity: 0; visibility: hidden; }
  .countdown { width: fit-content; margin: 16px auto 0; }
  .countdown p { margin: 0 0 12px; }
  .countdown strong { display: block; font-size: 52px; line-height: 1.2; color: #6fffd4; }
  @keyframes hide-success {
    to { opacity: 0; transform: translateY(-12px); }
  }
  @keyframes clear-backdrop {
    to { background: #11111b20; }
  }
  @media (prefers-reduced-motion: reduce) {
    .success-feedback { animation: hide-success-still 1ms linear 700ms forwards; }
    @keyframes hide-success-still { to { opacity: 0; } }
    dialog.heart-success::backdrop { animation-duration: 1ms; }
  }
  .heart { color: #ff80a5; font-size: 40px; line-height: 1; }
  .eyebrow { color: #ff9abd; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
  h2 { font-size: clamp(22px, 5vw, 28px); line-height: 1.2; margin: 12px 0; }
  p { line-height: 1.5; }
  #heart-instructions { color: #b8b8ca; font-size: 15px; }
  .answers { display: grid; gap: 10px; margin: 24px 0; }
  button {
    min-height: 48px;
    border: 1px solid #77758c;
    border-radius: 12px;
    background: #30303f;
    color: #f6f3ea;
    padding: 12px 16px;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  button:focus-visible { outline: 3px solid #ffcf70; outline-offset: 3px; }
  .answers button { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .answers button > span:first-child { color: #b9a1fb; font-weight: 800; }
  button:hover:not(:disabled) { border-color: #b9a1fb; background: #3d3952; }
  button:disabled { cursor: default; opacity: 1; }
  button.correct { border-color: #00e5a3; background: #163e36; }
  button.wrong { border-color: #ff80a5; }
  .result { font-size: 13px; color: #6fffd4; }
  .feedback { margin: 18px 0; }
  .feedback p { color: #c9c9d8; }
  .continue { width: 100%; text-align: center; background: #00e5a3; color: #15151b; font-weight: 800; }
  .continue:hover:not(:disabled) { background: #67ffd1; }
  .skip { width: 100%; background: transparent; text-align: center; font-size: 14px; }
  @media (max-height: 500px) {
    dialog { padding: 16px; }
    .heart, .eyebrow { display: none; }
    dialog.heart-success[open] {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 12px;
      width: min(660px, calc(100vw - 24px));
    }
    .success-feedback, .countdown { margin: 0; padding: 12px; }
    .success-feedback h2 { font-size: 22px; }
    .success-feedback p { font-size: 14px; }
    .countdown strong { font-size: 36px; }
    .answers { margin: 14px 0; gap: 8px; }
  }
</style>
