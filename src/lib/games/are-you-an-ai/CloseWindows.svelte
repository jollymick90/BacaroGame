<script lang="ts">
  import { onDestroy, tick } from 'svelte';
  let { onsolve }: { onsolve: () => void } = $props();
  const titles = [
    'Aggiornamento aggiornamenti',
    'Errore completato con successo',
    'Accetta i biscotti immaginari',
    'La stampante vuole parlarti',
    'Finestra chiusa. Quasi.',
    'Riavvio del riavvio',
  ];
  let desktop: HTMLDivElement;
  let disposed = false;
  let windows = $state([0, 1, 2]);
  let replacements = $state(0);
  let feedback = $state('');
  let hidden = $state([false, false, false]);
  const timers = new Set<ReturnType<typeof setTimeout>>();
  onDestroy(() => {
    disposed = true;
    for (const timer of timers) clearTimeout(timer);
  });
  async function close(index: number, trigger: HTMLButtonElement) {
    if (hidden[index]) return;
    const moveFocus = document.activeElement === trigger;
    hidden[index] = true;
    const timer = setTimeout(() => {
      hidden[index] = false;
      windows[index] = (windows[index] + 3) % titles.length;
      timers.delete(timer);
    }, 400);
    timers.add(timer);
    replacements++;
    feedback =
      replacements === 1
        ? 'Ottimo. Una finestra in meno, una finestra in più.'
        : 'Il reparto finestre approva questo ricambio d’aria.';
    if (moveFocus) {
      await tick();
      if (disposed) return;
      const nextClose = desktop.querySelector<HTMLButtonElement>('.window-bar button');
      (nextClose ?? desktop).focus({ preventScroll: true });
    }
  }
</script>

<div class="simulated-desktop" bind:this={desktop} tabindex="-1" role="group" aria-label="Desktop simulato">
  <div class="desktop-label">
    <span aria-hidden="true">▦</span> Finestre OS <span>Edizione ostinata</span>
  </div>
  <div class="window-area">
    {#each windows as title, index}
      {#if !hidden[index]}
        <section
          class="fake-window"
          style={`--window-index:${index}`}
          aria-label={`Finestra ${index + 1}`}
        >
          <div class="window-bar">
            <span>{titles[title]}</span><button
              aria-label={`Chiudi finestra ${index + 1}`}
              onclick={(event) => close(index, event.currentTarget)}>×</button
            >
          </div>
          <div class="window-body">
            <span aria-hidden="true">{['📂', '⚠️', '🍪'][index]}</span>
            <p>
              {[
                'Sto organizzando il disordine.',
                'Tutto funziona. È questo il problema.',
                'Solo un’ultima piccola finestra.',
              ][index]}
            </p>
          </div>
        </section>
      {/if}
    {/each}
  </div>
  <div class="taskbar">
    <span>Nessun lavoro salvato. Nessun lavoro fatto.</span><button
      aria-label="Spegni il desktop simulato"
      onclick={onsolve}><span aria-hidden="true">⏻</span> Spegni</button
    >
  </div>
</div>
<p class="window-feedback" role="status">
  {feedback || 'Il computer sembra molto impegnato a non aiutarti.'}
</p>

<style>
  .simulated-desktop {
    color: #193e35;
    border: 2px solid #193e35;
    border-radius: 13px;
    overflow: hidden;
    background: #dce8fa;
  }
  .desktop-label {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 10px 14px;
    font-size: 14px;
  }
  .desktop-label > span:last-child {
    margin-left: auto;
    font-size: 13px;
  }
  .window-area {
    position: relative;
    height: 292px;
    margin: 0 12px;
  }
  .fake-window {
    position: absolute;
    top: calc(var(--window-index) * 65px);
    left: calc(var(--window-index) * 12%);
    width: 72%;
    border: 2px solid #193e35;
    background: #fffef9;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 4px 4px 0 #193e3520;
  }
  .window-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 5px;
    min-height: 48px;
    padding-left: 10px;
    background: #eee8f5;
    border-bottom: 1px solid #193e35;
    font-size: 14px;
    font-weight: 700;
  }
  .window-bar button {
    background: #fffef9;
    color: #193e35;
    border: 0;
    border-left: 1px solid #193e35;
    border-radius: 0;
    min-width: 44px;
    min-height: 48px;
    padding: 0;
    font-size: 26px;
  }
  .window-bar button:hover {
    background: #f5cf68;
  }
  .window-body {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 15px;
    min-height: 90px;
  }
  .window-body > span {
    font-size: 30px;
  }
  .window-body p {
    font-size: 14px;
    margin: 0;
    max-width: 25ch;
  }
  .taskbar {
    display: flex;
    gap: 10px;
    justify-content: space-between;
    align-items: center;
    background: #bac9df;
    border-top: 2px solid #193e35;
    padding: 8px 12px;
  }
  .taskbar > span {
    font-size: 13px;
    max-width: 25ch;
  }
  .taskbar button {
    font-size: 13px;
    white-space: nowrap;
    padding: 8px 13px;
    min-height: 44px;
  }
  .taskbar button span {
    font-size: 19px;
    margin-right: 5px;
  }
  .window-feedback {
    font-size: 13px;
    min-height: 40px;
    margin: 12px 0 0;
    color: var(--arcade-muted);
  }
  @media (max-width: 420px) {
    .window-area {
      height: 285px;
      margin: 0 8px;
    }
    .fake-window {
      width: 82%;
      left: calc(var(--window-index) * 6%);
    }
    .window-bar {
      font-size: 13px;
    }
    .window-body {
      padding: 12px;
      gap: 8px;
    }
    .taskbar {
      padding: 8px;
    }
    .taskbar > span {
      max-width: 18ch;
    }
  }
</style>
