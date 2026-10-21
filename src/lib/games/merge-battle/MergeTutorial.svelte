<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { characters, trials, roleCards, resolve } from './engine';
  import type { MergeConfig } from './config';
  import Fighter from './Fighter.svelte';
  import MoveCard from './MoveCard.svelte';
  import ReviewWeights from './ReviewWeights.svelte';
  import ScoreComparison from './ScoreComparison.svelte';

  let { config, onclose }: { config: MergeConfig; onclose: () => void } = $props();
  let dialog: HTMLDialogElement;
  let heading: HTMLHeadingElement;
  let step = $state(0);
  let selected = $state<string | null>(null);
  const ids = $derived(config.characters.slice(0, 2));
  const trial = $derived(config.judges[0]);
  const hand = $derived(roleCards(config, ids[0]));
  const rival = $derived(roleCards(config, ids[1])[0]);
  const result = $derived(selected ? resolve(ids, [selected, rival.id], trial, config) : null);
  const titles = ['Qual è lo scopo?', 'Scegli il tuo Polpodev', 'Leggi lo scenario', 'Prova a giocare una carta', 'Ecco come si vince'];

  onMount(() => dialog.showModal());
  async function go(next: number) {
    step = next;
    await tick();
    heading.focus();
    dialog.scrollTop = 0;
  }
  function play(id: string) {
    selected = id;
    void go(4);
  }
</script>

<dialog bind:this={dialog} class="merge-tutorial" aria-labelledby="merge-tutorial-title"
  oncancel={(event) => { event.preventDefault(); onclose(); }}>
  <div class="tutorial-top"><span>Come si gioca · {step + 1}/5</span><button onclick={onclose}>Chiudi tutorial</button></div>
  <h2 id="merge-tutorial-title" bind:this={heading} tabindex="-1">{titles[step]}</h2>
  {#if step === 0}
    <p>Devi consegnare il tuo lavoro, il <strong>merge</strong>, al tuo capo: il <strong>maintainer</strong>.</p>
    <p>Scegli il tuo ruolo e gioca la tua mossa.</p>
    <p>Attento: c’è un altro collega che ha un’idea diversa dalla tua ed è pronto a consegnare!</p>
    <p><strong>Quale soluzione verrà scelta?</strong></p>
    <div class="duel"><Fighter id={ids[0]} size="small" /><b>VS</b><Fighter id={ids[1]} size="small" /></div>
    <p>Facciamo un round di prova: non modifica la tua partita.</p>
  {:else if step === 1}
    <div class="duel"><Fighter id={ids[0]} size="small" /><Fighter id={ids[1]} size="small" /></div>
    <p>Il personaggio determina le carte che puoi giocare. In questa prova sei <strong>{characters[ids[0]].name}</strong>; il rivale è {characters[ids[1]].name}.</p>
    <p>In partita scegli tu il Polpodev. Non si può scegliere il personaggio già preso dall’avversario.</p>
  {:else if step === 2}
    <p class="scenario">{trials[trial].title}</p>
    <ReviewWeights weights={config.weights[trial]} activeAxes={config.activeAxes} />
    <p>Questi sono i pesi del maintainer: un parametro con peso ×3 vale tre volte il valore scritto sulla carta. <strong>Per ogni parametro: valore × peso. Poi sommi tutto.</strong></p>
    <p>Si contano soltanto i parametri mostrati. Il maintainer non sceglie a caso: vince il totale più alto, a parità è pareggio.</p>
  {:else if step === 3}
    <p class="scenario">{trials[trial].title}</p>
    <ReviewWeights weights={config.weights[trial]} activeAxes={config.activeAxes} />
    <p>Scegli una carta qui sotto. Il rivale ha già fissato la sua: in partita la scelta avversaria resta segreta fino al confronto.</p>
    <div class="tutorial-hand">{#each hand as card, index}<MoveCard {card} {index} activeAxes={config.activeAxes} onplay={() => play(card.id)} />{/each}</div>
  {:else if result && selected}
    <p class="verdict">{result.winner === null ? 'Pareggio!' : result.winner === 0 ? 'Hai vinto!' : 'Hai perso!'}</p>
    <ScoreComparison cards={[hand.find(card => card.id === selected)!, rival]} weights={config.weights[trial]} activeAxes={config.activeAxes} labels={['Tu', 'Rivale']} />
    <p>Questa è la somma reale delle due carte. <strong>Vince chi ha più punti.</strong> Puoi riprovare un’altra carta per capire come cambiano i totali.</p>
    <p>Dopo la sfida i due ruoli si uniscono in un “merge”: <strong>{result.hybrid}</strong>. È il finale della sfida, non un altro punteggio da conquistare.</p>
    <p>Da solo sfidi il computer; in due sullo stesso dispositivo vi passate il telefono senza sbirciare. Online ognuno sceglie dal proprio dispositivo: Player 1 avvia il round e avete tre minuti dall’ingresso del secondo giocatore.</p>
  {/if}
  <div class="tutorial-actions">
    {#if step > 0}<button onclick={() => go(step - 1)}>{step === 4 ? 'Prova un’altra carta' : 'Indietro'}</button>{/if}
    {#if step < 3}<button class="primary" onclick={() => go(step + 1)}>Avanti</button>
    {:else if step === 4}<button class="primary" onclick={onclose}>Ho capito, giochiamo!</button>{/if}
  </div>
</dialog>

<style>
  .merge-tutorial {
    --comic-paper: #23232e; --comic-panel: #23232e; --comic-raised: #353544;
    --comic-ink: #f6f3ea; --comic-border: #b9a1fb; --comic-yellow: #ffe252;
    --comic-on-accent: #172334; --comic-shadow: #0005;
    width: min(920px, calc(100vw - 24px)); max-height: calc(100dvh - 24px);
    box-sizing: border-box; overflow-y: auto; border: 2px solid #b9a1fb; border-radius: 18px;
    padding: 24px; background: #17171f; color: #f6f3ea;
  }
  .merge-tutorial::backdrop { background: #070710cc; }
  .tutorial-top, .tutorial-actions { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
  .tutorial-top span { color: #b9a1fb; font-weight: 800; }
  h2 { margin: 24px 0 16px; font-size: clamp(24px, 4vw, 36px); }
  p { line-height: 1.6; }
  .duel { display: flex; align-items: center; justify-content: center; gap: 24px; }
  .scenario { padding: 16px; border-left: 3px solid #00e5a3; background: #23232e; font-weight: 800; }
  .tutorial-hand { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
  .verdict { font-size: 28px; font-weight: 900; color: #00e5a3; }
  .tutorial-actions { margin-top: 24px; }
  button { min-height: 44px; background: #23232e; color: #f6f3ea; border: 1px solid #b9a1fb; }
  button.primary { background: #00e5a3; color: #15151b; }
  @media (max-width: 650px) { .merge-tutorial { padding: 16px; } .tutorial-hand { grid-template-columns: 1fr; } .duel { gap: 8px; } }
</style>
