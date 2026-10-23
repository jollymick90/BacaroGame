<script lang="ts">
  import OctopusShowcase from './OctopusShowcase.svelte';
</script>
<section class="octopus-prize" aria-label="Polpo conquistato">
  <div class="prize-art"><OctopusShowcase /></div>
  <div><h2>Hai conquistato il polpo!</h2><p>La tua soluzione ha convinto il maintainer. Ecco il tuo polpo Bacaro 3D.</p></div>
</section>
<style>
  .octopus-prize { display: flex; align-items: center; gap: 24px; margin: 24px 0; padding: 20px; border: 2px solid #00e5a3; border-radius: 16px; background: #17171f; color: #f6f3ea; }
  .prize-art { width: 240px; height: 260px; flex-shrink: 0; }
  h2 { font-size: 28px; color: #00e5a3; }
  @media(max-width:600px) { .octopus-prize { flex-direction: column; text-align: center; } }
</style>
