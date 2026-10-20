<script lang="ts">
  let { game }: { game: 'hunter' | 'merge' | 'dex' | 'ai' } = $props();
</script>

<!-- Artwork adapted from the first arcade proposal; labels live in the card body. -->
<div class="cover" class:mint={game === 'hunter'} class:amber={game === 'merge'} class:sage={game === 'dex'} class:lilac={game === 'ai'} aria-hidden="true">
  <svg viewBox="0 0 480 180" fill="none" focusable="false">
    {#if game === 'hunter'}
      <g stroke="#15151b" stroke-width="4" stroke-linecap="round">
        <path d="m125 62 91 86" stroke-width="10" />
        <ellipse cx="116" cy="55" rx="39" ry="30" transform="rotate(-28 116 55)" fill="#b6ffe4" />
        <path d="m89 47 40 27m-30-41 40 27m-37 15 18-43m-4 48 18-39" stroke-width="2" />
        <path d="m266 117-10 19h16m24-15-7 22h18m19-30 5 20h17" />
        <path d="M248 101c17-29 36 24 57 10s34-10 35 4" stroke="#15151b" stroke-width="35" />
        <path d="M248 101c17-29 36 24 57 10s34-10 35 4" stroke="#ffe600" stroke-width="27" />
        <circle cx="244" cy="78" r="26" fill="#ffe600" />
        <path d="m231 54-8-14m32 14 10-13m-37 43q12 13 24-1" />
        <path d="m271 97-5 13m24-5-1 13m24-20 6 13" stroke-width="3" />
      </g>
      <circle cx="235" cy="73" r="4" fill="#15151b" /><circle cx="252" cy="71" r="4" fill="#15151b" />
    {:else if game === 'merge'}
      <g stroke="#15151b" stroke-width="4">
        <rect x="104" y="32" width="105" height="122" rx="12" fill="#b9a1fb" transform="rotate(-12 156 93)" />
        <rect x="275" y="32" width="105" height="122" rx="12" fill="#fff0c4" transform="rotate(12 327 93)" />
      </g>
      <text x="155" y="115" text-anchor="middle" fill="#15151b" font-size="66" font-family="system-ui">⌘</text>
      <text x="326" y="115" text-anchor="middle" fill="#15151b" font-size="66" font-family="system-ui">∑</text>
      <path d="m248 44-29 53h25l-14 40 37-58h-27z" fill="#15151b" />
    {:else if game === 'dex'}
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
</div>

<style>
  .cover { height: 168px; background-image: radial-gradient(#15151b20 1px, transparent 1px); background-size: 14px 14px; overflow: hidden; border-bottom: 2px solid #111116; }
  svg { width: 100%; height: 100%; }
  .mint { background-color: #00e5a3; }
  .amber { background-color: #f5b530; }
  .sage { background-color: #72d5a3; }
  .lilac { background-color: #b9a1fb; }
  @media (max-width: 600px) { .cover { height: 120px; } }
</style>
