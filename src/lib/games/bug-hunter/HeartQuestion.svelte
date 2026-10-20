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

  onMount(() => {
    dialog.showModal();
    return () => dialog.close();
  });

  function answer(index: number) {
    if (selected !== null) return;
    selected = index;
    onanswer(correct);
  }

  function skip() {
    dialog.close();
    onskip();
  }
</script>

<dialog bind:this={dialog} aria-labelledby="heart-title" aria-describedby="heart-instructions"
  oncancel={(event) => { event.preventDefault(); skip(); }}>
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
    <button class="continue" onclick={() => { dialog.close(); oncontinue(); }}>Continua la corsa</button>
  {:else}
    <button class="skip" onclick={skip}>Salta la domanda e resta in pausa</button>
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
    .answers { margin: 14px 0; gap: 8px; }
  }
</style>
