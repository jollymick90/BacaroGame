<script lang="ts">
  import { onMount } from 'svelte';
  import { createPresentationClock, type PresentationClock, type PresentationTimer } from './presentation-clock';
  import type { HeartQuestion } from './questions';

  let { question, onanswer, oncontinue, onskip, clock = createPresentationClock(), frozen = false, tutorial = false, ondevfreeze } = $props<{
    question: HeartQuestion;
    onanswer: (correct: boolean) => void;
    oncontinue: () => void;
    onskip: () => void;
    clock?: PresentationClock;
    frozen?: boolean;
    tutorial?: boolean;
    ondevfreeze?: () => void;
  }>();
  let dialog: HTMLDialogElement;
  let selected = $state<number | null>(null);
  const correct = $derived(selected === question.correctIndex);
  let countdown = $state(3);
  let feedbackHidden = $state(false);
  let feedbackTimer: PresentationTimer | undefined;
  let countdownTimer: PresentationTimer | undefined;

  function stopCountdown() {
    clock.cancel(countdownTimer);
    clock.cancel(feedbackTimer);
    countdownTimer = undefined;
  }

  function continueRun() {
    stopCountdown();
    dialog.close();
    oncontinue();
  }

  function visibilityChanged() {
    // Never resume into an unseen course after switching tab or locking a phone.
    if (!frozen && document.hidden && selected !== null) skip();
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
    // Also hide without CSS animation (global reduced-motion styles disable it).
    feedbackTimer = clock.schedule(() => { feedbackHidden = true; }, 900);
    countdownTimer = clock.schedule(tickCountdown, 1000);
  }

  function tickCountdown() {
    countdown -= 1;
    if (countdown === 0) {
      continueRun();
      return;
    }
    countdownTimer = clock.schedule(tickCountdown, 1000);
  }

  function skip() {
    stopCountdown();
    dialog.close();
    onskip();
  }
</script>

<dialog bind:this={dialog} class:heart-result={selected !== null}
  aria-labelledby="heart-title"
  aria-describedby={selected !== null ? 'heart-countdown' : 'heart-instructions'}
  oncancel={(event) => { event.preventDefault(); if (!frozen) skip(); }}>
  <div class="quiz-content" inert={frozen}>
  {#if selected !== null}
    <div class="feedback result-feedback" class:hidden={feedbackHidden}>
      <span class="heart" aria-hidden="true">{correct ? '♥' : '♡'}</span>
      <h2 id="heart-title">{correct ? 'Una vita recuperata! ♥' : 'Questa volta niente cuore.'}</h2>
      {#if !correct}<p>Nessuna vita persa.</p>{/if}
      <p>{question.explanation}</p>
    </div>
    <div class="countdown">
      <p id="heart-countdown" role="status">{tutorial ? 'Torni al tutorial tra' : 'La corsa riparte tra'} <strong>{countdown}</strong></p>
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
    <button class="skip" onclick={skip}>Salta la domanda e resta in pausa</button>
  {/if}
  </div>
  {#if ondevfreeze}
    <button class="dev-freeze" aria-pressed={frozen} onclick={ondevfreeze}>
      DEV · {frozen ? 'Sblocca frame' : 'Congela frame'} · O / F8
    </button>
  {/if}
</dialog>

<style>
  .quiz-content { display: contents; }
  .dev-freeze {
    position: fixed;
    right: 12px;
    bottom: 100px;
    min-height: 36px;
    padding: 6px 10px;
    border: 1px dashed #ffcf70;
    background: #15151be6;
    color: #ffcf70;
    font-size: 12px;
  }
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
  dialog.heart-result {
    border: 0;
    padding: 8px;
    background: transparent;
    box-shadow: none;
    overflow: visible;
  }
  dialog.heart-result::backdrop {
    animation: clear-backdrop 800ms ease-out forwards;
  }
  .result-feedback, .countdown {
    padding: 20px;
    border: 2px solid #00e5a3;
    border-radius: 20px;
    background: #23232ef5;
    text-align: center;
  }
  .result-feedback {
    pointer-events: none;
    animation: hide-feedback 350ms ease-in 550ms forwards;
  }
  .result-feedback.hidden { opacity: 0; visibility: hidden; }
  .countdown { width: fit-content; margin: 16px auto 0; }
  .countdown p { margin: 0 0 12px; }
  .countdown strong { display: block; font-size: 52px; line-height: 1.2; color: #6fffd4; }
  @keyframes hide-feedback {
    to { opacity: 0; transform: translateY(-12px); }
  }
  @keyframes clear-backdrop {
    to { background: #11111b20; }
  }
  @media (prefers-reduced-motion: reduce) {
    .result-feedback { animation: hide-feedback-still 1ms linear 700ms forwards; }
    @keyframes hide-feedback-still { to { opacity: 0; } }
    dialog.heart-result::backdrop { animation-duration: 1ms; }
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
  .skip { width: 100%; background: transparent; text-align: center; font-size: 14px; }
  @media (max-height: 500px) {
    dialog { padding: 16px; }
    .heart, .eyebrow { display: none; }
    dialog.heart-result[open] {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 12px;
      width: min(660px, calc(100vw - 24px));
    }
    .result-feedback, .countdown { margin: 0; padding: 12px; }
    .result-feedback h2 { font-size: 22px; }
    .result-feedback p { font-size: 14px; }
    .countdown strong { font-size: 36px; }
    .answers { margin: 14px 0; gap: 8px; }
  }
</style>
