<script lang="ts">
  let { name, priority }: { name: string; priority: string } = $props();
</script>

<section class="maintainer-brief" aria-label="Il maintainer che valuta il tuo lavoro">
  <p class="label">Il tuo capo · Il maintainer</p>
  <h3>{name}</h3>
  <p>Tu e il tuo collega gli proponete due soluzioni. Quale verrà scelta?</p>
  <blockquote>«{priority}»</blockquote>
  <p class="explanation">Le sue priorità sono i pesi della sfida: vince la soluzione con il totale più alto.</p>
</section>

<style>
  .maintainer-brief { margin: 20px 0 0; padding: 18px 20px; border: 2px solid #b9a1fb; border-radius: 12px; background: #17171f; color: #f6f3ea; }
  .label { margin: 0 0 8px; color: #b9a1fb; font-size: 14px; font-weight: 850; }
  h3 { margin: 0 0 12px; font-size: clamp(24px, 3vw, 32px); line-height: 1.2; }
  p { margin: 8px 0; font-size: 16px; line-height: 1.5; }
  blockquote { margin: 16px 0; padding-left: 14px; border-left: 3px solid #00e5a3; font-size: 18px; font-weight: 750; line-height: 1.5; }
  .explanation { color: #c9c9d8; font-size: 14px; }
  @media (max-width: 500px) { .maintainer-brief { padding: 16px; } }
</style>
