<script lang="ts">
  import { characterArt } from './character-art';

  let {
    id,
    emotion = 'ready',
    other = null,
    size = 'normal',
    eager = false
  }: {
    id: number;
    emotion?: string;
    other?: number | null;
    size?: 'small' | 'normal' | 'large';
    eager?: boolean;
  } = $props();

  let art = $derived(characterArt(id));
  let partner = $derived(other === null ? null : characterArt(other));
</script>

<div class="fighter" class:duo={partner !== null} class:celebrate={emotion === 'win'} data-size={size} aria-hidden="true">
  <img
    src={art.src}
    srcset={art.srcset}
    sizes={size === 'small' ? '160px' : '(max-width: 600px) 200px, 320px'}
    width="640"
    height="640"
    alt=""
    loading={eager ? 'eager' : 'lazy'}
    decoding="async"
    draggable="false"
  />
  {#if partner}
    <span class="plus">+</span>
    <img src={partner.src} srcset={partner.srcset} sizes="(max-width: 600px) 180px, 260px" width="640" height="640" alt="" decoding="async" draggable="false" />
  {/if}
</div>

<style>
  .fighter { width: var(--fighter-width, 230px); max-width: 100%; position: relative; }
  .fighter[data-size='small'] { width: var(--fighter-width, 160px); }
  .fighter[data-size='large'] { width: var(--fighter-width, 340px); }
  img { display: block; width: 100%; height: auto; object-fit: contain; }
  .fighter.duo { display: flex; align-items: center; width: 580px; }
  .duo img { width: 48%; }
  .plus { font-size: clamp(24px, 5vw, 44px); font-weight: 900; margin: 0 -1%; z-index: 1; }
  .celebrate { animation: salute 450ms ease-out both; }
  @keyframes salute { from { transform: translateY(12px) rotate(-3deg); } to { transform: none; } }
  @media (prefers-reduced-motion: reduce) { .celebrate { animation: none; } }
</style>
