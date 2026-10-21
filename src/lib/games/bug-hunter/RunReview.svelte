<script lang="ts">
  import type { RunStats } from './mechanics';

  let { stats, caught, completed } = $props<{
    stats: RunStats;
    caught: number;
    completed: boolean;
  }>();
  const powers = $derived(stats.powers.reduce((total: number, count: number) => total + count, 0));
  const accuracy = $derived(caught + stats.missed > 0 ? Math.round(caught / (caught + stats.missed) * 100) : 0);
  const verdict = $derived.by(() => {
    if (completed) return 'Obiettivi raggiunti. Questa release può andare in produzione.';
    if (caught === 0) return 'Retino ancora in rodaggio. Il prossimo giro andrà meglio.';
    if (accuracy >= 85) return 'Bug sotto controllo. Il codice ringrazia, i bug un po’ meno.';
    return 'Qualche bug è scappato in produzione. Nessun deploy è perfetto.';
  });
</script>

<section class="run-review" aria-label="Review finale">
  <h2>La review della corsa</h2>
  <p>{verdict}</p>
  <dl>
    <div><dt>Precisione catture</dt><dd>{accuracy}%</dd></div>
    <div><dt>Bug mancati</dt><dd>{stats.missed}</dd></div>
    <div><dt>Urti</dt><dd>{stats.collisions}</dd></div>
    <div><dt>Poteri attivati</dt><dd>{powers}</dd></div>
    <div><dt>Vite recuperate</dt><dd>{stats.healed}</dd></div>
    <div><dt>Bug al sicuro</dt><dd>{caught}</dd></div>
  </dl>
  {#if stats.collisions > 0}
    <p class="tip">Per il prossimo deploy: caffè, monitor e tastiere si aggirano o si saltano.</p>
  {:else if stats.missed > 0}
    <p class="tip">Per il prossimo deploy: cambia corsia in tempo e salta per raggiungere i bug in aria.</p>
  {/if}
</section>

<style>
  .run-review { width: 100%; max-width: 480px; text-align: left; }
  h2 { margin: 0 0 8px; font-size: 22px; color: #f6f3ea; }
  p { margin: 0; font-size: 14px; line-height: 1.4; }
  dl { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 12px 0; }
  dl > div { padding: 8px; border: 1px solid #77758c; border-radius: 10px; background: #23232e; }
  dt { color: #c9c9d8; font-size: 12px; }
  dd { margin: 4px 0 0; font-size: 22px; font-weight: 800; color: #6fffd4; }
  .tip { color: #ffcf70; }
  @media (max-width: 450px) { dl { grid-template-columns: repeat(2, 1fr); } }
</style>
