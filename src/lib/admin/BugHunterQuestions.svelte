<script lang="ts">
  import { invalidate } from '$app/navigation';
  import { onMount, tick } from 'svelte';
  import { DEFAULT_QUESTIONS, validateQuestionConfig, type QuestionConfig } from '$lib/games/bug-hunter/questions';

  let draft = $state<QuestionConfig>(validateQuestionConfig({ questions: DEFAULT_QUESTIONS }));
  let revision = $state(0);
  let saved = $state('');
  let loading = $state(true);
  let saving = $state(false);
  let status = $state('');
  let failure = $state('');
  let confirmReload = $state(false);
  let expandedId = $state(DEFAULT_QUESTIONS[0].id);
  const dirty = $derived(saved !== '' && JSON.stringify(draft) !== saved);
  const validation = $derived.by(() => {
    try {
      validateQuestionConfig(draft);
      return '';
    } catch (error) {
      return error instanceof Error ? error.message : 'Domande non valide.';
    }
  });

  async function load() {
    loading = true;
    failure = '';
    status = '';
    confirmReload = false;
    try {
      const response = await fetch('/api/bug-hunter/config');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Caricamento delle domande non riuscito.');
      }
      const loaded = validateQuestionConfig(data.config);
      draft = loaded;
      revision = data.revision;
      saved = JSON.stringify(loaded);
      expandedId = loaded.questions[0].id;
      status = data.persisted
        ? 'Domande pubblicate caricate.'
        : '20 domande predefinite. Saranno pubblicate solo quando premi Salva domande.';
    } catch (error) {
      failure = error instanceof Error ? error.message : 'Caricamento delle domande non riuscito.';
    } finally {
      loading = false;
    }
  }

  async function save() {
    saving = true;
    failure = '';
    status = '';
    confirmReload = false;
    try {
      const config = validateQuestionConfig(draft);
      const response = await fetch('/api/bug-hunter/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, revision }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Salvataggio non riuscito. Le modifiche sono conservate.');
      }
      const published = validateQuestionConfig(data.config);
      draft = published;
      revision = data.revision;
      saved = JSON.stringify(published);
      void invalidate('game-center:configuration');
      status = 'Domande salvate. Saranno usate alle prossime aperture di Bug Hunter.';
    } catch (error) {
      failure = error instanceof Error ? error.message : 'Salvataggio non riuscito. Le modifiche sono conservate.';
    } finally {
      saving = false;
    }
  }

  async function addQuestion() {
    if (draft.questions.length >= 100) return;
    const id = `question-${crypto.randomUUID()}`;
    draft.questions.push({
      id,
      prompt: '',
      answers: ['', '', ''],
      correctIndex: 0,
      explanation: '',
    });
    expandedId = id;
    await tick();
    document.getElementById(`prompt-${id}`)?.focus();
  }

  function removeQuestion(id: string) {
    if (draft.questions.length <= 1) return;
    draft.questions = draft.questions.filter(question => question.id !== id);
  }

  function reload() {
    if (dirty) {
      confirmReload = true;
      return;
    }
    void load();
  }

  onMount(() => { void load(); });
</script>

<section class="question-bank" aria-labelledby="question-bank-title">
  <h2 id="question-bank-title">Domande dei cuori</h2>
  <p>Quando un giocatore raccoglie un cuore, una risposta corretta gli restituisce una vita. Usa domande semplici di informatica, con una sola risposta corretta.</p>
  <p class="count">{draft.questions.length} / 100 domande · tre risposte per domanda</p>
  {#if loading}<p role="status">Caricamento delle domande…</p>{/if}

  <fieldset class="editor" disabled={loading || saving || !saved}>
    <legend class="visually-hidden">Modifica le domande di Bug Hunter</legend>
    {#each draft.questions as question, index (question.id)}
      <details class="question" open={question.id === expandedId}>
        <summary>
          <span class="number">{index + 1}</span>
          <span>{question.prompt || 'Nuova domanda da completare'}</span>
        </summary>
        <div class="fields">
          <label for={`prompt-${question.id}`}>Domanda</label>
          <textarea id={`prompt-${question.id}`} bind:value={question.prompt} maxlength="300" rows="2" required></textarea>
          <div class="answers">
            {#each question.answers as _, answerIndex}
              <div class="answer">
                <label for={`answer-${question.id}-${answerIndex}`}>Risposta {answerIndex + 1}</label>
                <input id={`answer-${question.id}-${answerIndex}`} bind:value={question.answers[answerIndex]} maxlength="120" required />
              </div>
            {/each}
          </div>
          <label for={`correct-${question.id}`}>Risposta corretta</label>
          <select id={`correct-${question.id}`} bind:value={question.correctIndex}>
            <option value={0}>Risposta 1</option>
            <option value={1}>Risposta 2</option>
            <option value={2}>Risposta 3</option>
          </select>
          <label for={`explanation-${question.id}`}>Breve spiegazione mostrata dopo la risposta</label>
          <textarea id={`explanation-${question.id}`} bind:value={question.explanation} maxlength="300" rows="2" required></textarea>
          <button class="remove" type="button" disabled={draft.questions.length === 1} onclick={() => removeQuestion(question.id)} aria-label={`Rimuovi domanda ${index + 1}`}>Rimuovi domanda</button>
        </div>
      </details>
    {/each}
    <button type="button" class="secondary" disabled={draft.questions.length >= 100} onclick={addQuestion}>+ Aggiungi domanda</button>
  </fieldset>

  <div class="publish">
    <p role="status">{status}{dirty ? ' Modifiche non salvate.' : ''}</p>
    {#if failure}<p class="error" role="alert">{failure}</p>{/if}
    {#if validation && saved}<p class="error" role="status">{validation}</p>{/if}
    <div class="actions">
      <button type="button" disabled={loading || saving || !saved || !!validation || (!dirty && revision > 0)} onclick={save}>{saving ? 'Salvataggio…' : 'Salva domande'}</button>
      <button type="button" class="secondary" disabled={loading || saving} onclick={reload}>Ricarica domande pubblicate</button>
    </div>
    {#if confirmReload}
      <div class="reload-confirmation" role="alert">
        <p>Ricaricare sostituirà le modifiche non salvate con le domande pubblicate. Vuoi continuare?</p>
        <div class="actions">
          <button type="button" onclick={load}>Scarta modifiche e ricarica</button>
          <button type="button" class="secondary" onclick={() => { confirmReload = false; }}>Continua a modificare</button>
        </div>
      </div>
    {/if}
  </div>
</section>

<style>
  .question-bank { margin: 24px 0; padding: 24px; border: 2px solid #287c76; border-radius: 16px; background: #f4f5ef; color: #193e35; }
  h2 { margin-top: 0; }
  p { line-height: 1.6; }
  .count { font-weight: 700; }
  .editor { min-width: 0; padding: 0; border: 0; margin: 0; }
  .question { margin-bottom: 12px; border: 1px solid #bbc8b1; border-radius: 10px; background: #fffef9; overflow: hidden; }
  summary { padding: 16px; cursor: pointer; line-height: 1.5; overflow-wrap: anywhere; }
  .number { display: inline-block; margin-right: 8px; font-weight: 800; color: #6742a6; }
  .fields { display: grid; gap: 10px; padding: 4px 16px 16px; }
  label { font-weight: 700; line-height: 1.5; }
  input, textarea, select { width: 100%; box-sizing: border-box; min-width: 0; min-height: 44px; padding: 10px 12px; border: 1px solid #829584; border-radius: 6px; background: white; color: #193e35; font: inherit; }
  textarea { resize: vertical; }
  .answers { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 8px 0; }
  .answer { display: grid; gap: 8px; }
  button { min-height: 44px; padding: 10px 16px; border: 1px solid #193e35; border-radius: 8px; background: #193e35; color: #fffef9; font: inherit; font-weight: 700; cursor: pointer; }
  button:disabled { opacity: .5; cursor: default; }
  .secondary { background: #fffef9; color: #193e35; }
  .remove { justify-self: start; margin-top: 8px; background: transparent; color: #92302c; border-color: #92302c; }
  .publish { border-top: 2px solid #287c76; margin-top: 24px; padding-top: 8px; }
  .actions { display: flex; flex-wrap: wrap; gap: 10px; }
  .error { color: #92302c; font-weight: 700; }
  .reload-confirmation { margin-top: 16px; padding: 16px; background: #fff4dc; border: 1px solid #9c7139; border-radius: 8px; }
  .reload-confirmation p { margin-top: 0; }
  :is(button, input, textarea, select, summary):focus-visible { outline: 3px solid #6742a6; outline-offset: 3px; }
  .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
  @media (max-width: 650px) {
    .question-bank { padding: 16px; }
    .answers { grid-template-columns: 1fr; }
    .actions { flex-direction: column; }
  }
</style>
