<script lang="ts">
  import { onMount } from 'svelte';
  import { TimedLoading } from './trials';
  let { onsolve }: { onsolve: () => void } = $props();
  const loading = new TimedLoading();
  let progress = $state(0);
  let ready = $state(false);
  let relaxed = $state(false);
  let feedback = $state('Aspetta ORA, poi premi. Cinque conferme e ci siamo.');
  let timer: ReturnType<typeof setTimeout>;
  let disposed = false;
  function schedule() {
    clearTimeout(timer);
    ready = false;
    loading.schedule(performance.now());
    timer = setTimeout(
      () => {
        if (disposed) return;
        ready = true;
        if (!loading.relaxed) {
          timer = setTimeout(
            () => {
              if (disposed) return;
              feedback = 'Occasione persa. Nessun problema: riproviamo.';
              schedule();
            },
            Math.max(0, loading.closesAt - performance.now()),
          );
        }
      },
      Math.max(0, loading.readyAt - performance.now()),
    );
  }
  function confirm() {
    if (loading.confirm(performance.now())) {
      progress = loading.progress;
      feedback = `Conferma ricevuta. ${progress}%.`;
      if (progress === 100) {
        clearTimeout(timer);
        ready = false;
        onsolve();
        return;
      }
    } else {
      feedback = 'Fuori tempo. Il progresso resta: aspetta ORA.';
    }
    schedule();
  }
  function timingChanged() {
    loading.relaxed = relaxed;
    schedule();
  }
  onMount(() => {
    schedule();
    return () => {
      disposed = true;
      clearTimeout(timer);
    };
  });
</script>

<div class="loading-box">
  <p class="filename">humanity_final_final_v3.zip</p>
  <div class="loading-label">
    <strong>{progress}%</strong><span>Il server vuole una mano.</span>
  </div>
  <progress value={progress} max="100" aria-label="Caricamento dell'umanità"></progress>
  <button
    class="rhythm-button"
    class:ready
    onclick={confirm}
    onkeydown={(event) => {
      if (event.repeat) event.preventDefault();
    }}
    aria-describedby="loading-instructions">{ready ? 'ORA — premi!' : 'Aspetta…'}</button
  >
  <p role="status">{feedback}</p>
  <label
    ><input type="checkbox" bind:checked={relaxed} onchange={timingChanged} /> Senza scadenza: premi con
    calma quando compare ORA</label
  >
  <p id="loading-instructions">
    Premi quando compare ORA: ogni conferma vale il 20%. Puoi usare touch, Invio o Spazio. Gli
    errori non cancellano il progresso.
  </p>
</div>

<style>
  .loading-box {
    color: #193e35;
    border: 2px solid #193e35;
    border-radius: 13px;
    background: #fffef9;
    padding: 24px;
  }
  .filename {
    text-align: center;
    font-size: 14px;
    color: #536559;
    margin: 0 0 26px;
    overflow-wrap: anywhere;
  }
  .loading-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .loading-label strong {
    font-size: 33px;
  }
  .loading-label span {
    font-size: 14px;
  }
  progress {
    display: block;
    width: 100%;
    height: 30px;
    accent-color: #6742a6;
    margin: 15px 0 22px;
  }
  .rhythm-button {
    width: 100%;
    min-height: 64px;
    background: #e4d9f4;
    color: #193e35;
    border: 2px solid #193e35;
    font-size: 20px;
  }
  .rhythm-button.ready {
    background: #f5cf68;
  }
  .loading-box p[role] {
    min-height: 44px;
    font-size: 14px;
  }
  .loading-box label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    line-height: 1.5;
  }
  .loading-box input {
    width: 22px;
    height: 22px;
    flex: none;
    accent-color: #6742a6;
  }
  #loading-instructions {
    font-size: 14px;
    line-height: 1.5;
    border-top: 1px solid #ded6e7;
    margin: 20px 0 0;
    padding-top: 14px;
  }
</style>
