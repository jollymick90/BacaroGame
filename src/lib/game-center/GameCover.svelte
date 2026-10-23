<script lang="ts">
  import OctopusShowcase from '$lib/mascot/OctopusShowcase.svelte';
  let { game }: { game: 'hunter' | 'merge' | 'dex' | 'ai' } = $props();
</script>

<!-- Artwork adapted from the first arcade proposal; labels live in the card body. -->
<div class="cover" class:mint={game === 'hunter'} class:amber={game === 'merge'} class:sage={game === 'dex'} class:lilac={game === 'ai'} aria-hidden="true">
  {#if game === 'hunter'}
    <OctopusShowcase venice />
  {:else if game === 'merge'}
    <div class="polpo-duel"><img src="/images/merge-battle/frontend.webp" alt="" width="640" height="640" /><b>VS</b><img src="/images/merge-battle/backend.webp" alt="" width="640" height="640" /></div>
  {:else}
  <svg viewBox="0 0 480 180" fill="none" focusable="false">
    {#if game === 'dex'}
      <g stroke="#15151b" stroke-width="4">
        <circle cx="160" cy="89" r="53" fill="#a1e9bd" />
        <path d="M135 101q25 30 50-2" stroke-linecap="round" />
        <circle cx="145" cy="78" r="4" fill="#15151b" /><circle cx="177" cy="78" r="4" fill="#15151b" />
        <g transform="rotate(14 315 91)">
          <circle cx="315" cy="91" r="53" fill="#fffaf0" />
          <path d="M262 91a53 53 0 0 1 106 0z" fill="#ff4757" />
          <path d="M262 91h106" stroke-width="8" />
          <circle cx="315" cy="91" r="17" fill="#fffaf0" />
        </g>
      </g>
      <path d="m236 32 5 13 13 5-13 5-5 13-5-13-13-5 13-5z" fill="#15151b" />
    {:else}
      <g stroke="#15151b" stroke-width="4" stroke-linejoin="round">
        <path d="M118 40h105v49h-28l-17 16V89h-60z" fill="#fffaf0" />
        <rect x="253" y="53" width="102" height="91" rx="18" fill="#15151b" />
        <rect x="246" y="46" width="102" height="91" rx="18" fill="#ffe600" />
        <path d="M297 46V29" /><circle cx="297" cy="24" r="6" fill="#15151b" />
        <path d="M275 109h44" stroke-linecap="round" />
      </g>
      <circle cx="273" cy="80" r="6" fill="#15151b" /><circle cx="320" cy="80" r="6" fill="#15151b" />
      <text x="170" y="76" text-anchor="middle" fill="#15151b" font-size="30" font-family="system-ui" font-weight="700">…?</text>
    {/if}
  </svg>
  {/if}
</div>

<style>
  .cover { height: 220px; background-image: radial-gradient(#15151b20 1px, transparent 1px); background-size: 14px 14px; overflow: hidden; border-bottom: 2px solid #111116; }
  .polpo-duel { height: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .polpo-duel img { width: 43%; height: 100%; object-fit: contain; }
  .polpo-duel b { color: #15151b; font-size: 30px; font-style: italic; }
  svg { width: 100%; height: 100%; }
  .mint { background-color: #00e5a3; }
  .amber { background-color: #f5b530; }
  .sage { background-color: #72d5a3; }
  .lilac { background-color: #b9a1fb; }
  @media (max-width: 600px) { .cover { height: 180px; } }
</style>
