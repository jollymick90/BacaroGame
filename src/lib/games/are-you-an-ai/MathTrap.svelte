<script lang="ts">
  import { mathOutcome, type Outcome } from './trials';
  let { onanswer }: { onanswer: (outcome: Outcome) => void } = $props();
  let answer = $state('');
  let error = $state('');
  function submit(event: SubmitEvent) {
    event.preventDefault();
    const outcome = mathOutcome(answer);
    if (!outcome) {
      error = 'Scrivi un numero. Anche un tentativo va bene.';
      return;
    }
    onanswer(outcome);
  }
</script>

<form onsubmit={submit}>
  <p class="expression">((17 × 8 − 10) ÷ 3) + √144 − 12 = ?</p>
  <label for="math-answer">La tua risposta</label>
  <input
    id="math-answer"
    bind:value={answer}
    inputmode="decimal"
    autocomplete="off"
    aria-describedby="math-error"
  />
  <button type="submit">Conferma il calcolo</button>
  <p id="math-error" role="status">{error}</p>
  <small>È un gioco: questo ufficio non certifica davvero nessuno.</small>
</form>

<style>
  form {
    background: #fffef9;
    border: 2px solid #193e35;
    border-radius: 13px;
    padding: 22px;
  }
  .expression {
    font-size: clamp(17px, 3vw, 23px);
    font-weight: bold;
    line-height: 1.7;
    overflow-wrap: anywhere;
  }
  label {
    display: block;
    font-size: 14px;
    margin-bottom: 8px;
  }
  input {
    width: 100%;
    margin-bottom: 16px;
    min-height: 48px;
  }
  button {
    min-height: 48px;
    width: 100%;
    background: #6742a6;
    color: #fffef9;
  }
  small {
    font-size: 11px;
    color: #536559;
  }
</style>
