<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { FaceAnalysis } from './face-analysis';
  export type FaceGeometry = Omit<FaceAnalysis, 'embedding'>;
  let {
    photo,
    disabled = false,
    onpreview,
  }: {
    photo: HTMLCanvasElement;
    disabled?: boolean;
    onpreview: (geometry: FaceGeometry | null) => void;
  } = $props();
  let analysis = $state<FaceAnalysis | null>(null);
  let busy = $state(false);
  let status = $state('');
  let error = $state('');
  let disposed = false;
  onDestroy(() => {
    disposed = true;
    analysis = null;
    onpreview(null);
  });
  async function toggle() {
    if (analysis) {
      analysis = null;
      onpreview(null);
      return;
    }
    if (busy || disabled) return;
    busy = true;
    error = '';
    try {
      const { analyzeFace } = await import('./recognition');
      if (disposed) return;
      const result = await analyzeFace(photo, (text) => {
        if (!disposed) status = text;
      });
      if (disposed) return;
      analysis = result;
      const { embedding: _, ...geometry } = result;
      onpreview(geometry);
    } catch (failure) {
      if (!disposed)
        error = failure instanceof Error ? failure.message : 'Analisi non riuscita. Riprova.';
    } finally {
      if (!disposed) {
        busy = false;
        status = '';
      }
    }
  }
</script>

<div class="face-inspector">
  <button
    type="button"
    class="secondary"
    disabled={disabled || busy}
    aria-pressed={!!analysis}
    onclick={toggle}
  >
    {busy ? 'Analisi del volto…' : analysis ? 'Nascondi punti del volto' : 'Mostra punti del volto'}
  </button>
  {#if busy}<p role="status">{status}</p>{/if}
  {#if error}<p class="error" role="alert">{error}</p>{/if}
  {#if analysis}
    <p class="hint" role="status">
      {analysis.landmarks.length} punti rilevati sul volto. Analisi locale: foto e punti restano sul dispositivo.
    </p>
    <details>
      <summary>Vedi embedding del volto ({analysis.embedding.length} valori)</summary>
      <p class="hint">
        Il descrittore numerico riassume le caratteristiche del volto per il confronto. I punti
        sulla foto mostrano la geometria rilevata.
      </p>
      <output aria-label="Descrittore numerico del volto"
        >{analysis.embedding.map((value) => value.toFixed(4)).join(' · ')}</output
      >
    </details>
  {/if}
</div>

<style>
  .face-inspector {
    margin: 12px 0;
  }
  .face-inspector button {
    min-height: 44px;
    font-size: 13px;
  }
  .face-inspector p {
    font-size: 12px;
    line-height: 1.5;
  }
  summary {
    cursor: pointer;
    min-height: 44px;
    padding: 10px 0;
    font-size: 13px;
  }
  output {
    display: block;
    max-height: 150px;
    overflow: auto;
    overflow-wrap: anywhere;
    padding: 12px;
    border: 1px solid #bbc8b1;
    border-radius: 8px;
    font: 11px/1.6 monospace;
    background: #fffef9;
  }
</style>
