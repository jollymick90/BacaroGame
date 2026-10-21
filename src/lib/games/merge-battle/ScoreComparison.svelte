<script lang="ts">
  import { AXES, score, type Card } from './cards';

  let { cards, weights, activeAxes, labels }: {
    cards: Card[];
    weights: number[];
    activeAxes: number[];
    labels: string[];
  } = $props();

  let totals = $derived(cards.map(card => score(card.stats, weights, activeAxes)));
</script>

<section class="comparison" aria-label="Confronto dei punteggi">
  <h2>Come si scontrano le carte</h2>
  <p>Valore × peso = punti. Si sommano i punti: vince il totale più alto.</p>
  <table>
    <thead>
      <tr>
        <th scope="col">Parametro</th>
        {#each labels as label, side}
          <th scope="col">{label}<span class="move-name">{cards[side].name}</span></th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each activeAxes as axis}
        <tr>
          <th scope="row">{AXES[axis]}</th>
          {#each cards as card, side}
            {@const points = card.stats[axis] * weights[axis]}
            {@const advantage = points > cards[1 - side].stats[axis] * weights[axis]}
            <td class:advantage>
              <span>{card.stats[axis]} × {weights[axis]} = <b>{points}</b></span>
              {#if advantage}<small>Vantaggio +{points - cards[1 - side].stats[axis] * weights[axis]}</small>{/if}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
    <tfoot><tr><th scope="row">Totale</th>{#each totals as total}<td><strong>{total}</strong></td>{/each}</tr></tfoot>
  </table>
  <p class="outcome">
    {#if totals[0] === totals[1]}
      Pari punti: pareggio.
    {:else}
      <b>{labels[totals[0] > totals[1] ? 0 : 1]} vince di {Math.abs(totals[0] - totals[1])} punti.</b>
    {/if}
  </p>
</section>

<style>
  .comparison { color: var(--comic-ink, #102f36); border: 2px solid; border-radius: 8px; background: var(--comic-paper, #fff6e5); padding: 20px; margin: 24px 0; }
  h2 { font-size: 20px; margin: 0 0 8px; }
  p { font-size: 13px; line-height: 1.5; margin: 0 0 16px; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 14px; }
  th, td { text-align: center; padding: 12px 8px; border-bottom: 1px solid #9caeaa; }
  th:first-child { text-align: left; overflow-wrap: anywhere; }
  thead th { font-size: 12px; }
  .move-name { display: block; font-size: 11px; font-weight: 500; overflow-wrap: anywhere; margin-top: 6px; }
  td span { white-space: nowrap; }
  td small { display: block; font-size: 11px; font-weight: 750; }
  .advantage { background: #ffda66; color: #15151b; }
  tfoot th, tfoot td { border-bottom: 0; border-top: 2px solid; }
  tfoot strong { font-size: 26px; }
  .outcome { margin: 10px 0 0; font-size: 12px; }
  @media (max-width: 600px) { .comparison { padding: 14px 10px; } th, td { padding: 10px 4px; font-size: 12px; } h2 { font-size: 19px; } }
</style>
