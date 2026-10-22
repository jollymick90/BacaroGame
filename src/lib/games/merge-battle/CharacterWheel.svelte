<script lang="ts">
  import { onDestroy, tick } from 'svelte';
  import CharacterMoves from './CharacterMoves.svelte';
  import type { MergeConfig } from './config';
  import Fighter from './Fighter.svelte';
  import { characters } from './catalog';
  import { nearestCharacter, rotationDelta } from './wheel';

  let { cast, taken, onchoose, config }: {
    config: MergeConfig;
    cast: typeof characters;
    taken: number[];
    onchoose: (id: number) => void;
  } = $props();

  let selected = $state<number | null>(null);
  let rotation = $state(0);
  let spinning = $state(false);
  let dragging = $state(false);
  let gesture: {
    pointerId: number;
    x: number;
    y: number;
    centerX: number;
    centerY: number;
    angle: number;
    rotation: number;
    visibleRotation: number;
    selected: number | null;
  } | null = null;
  let suppressClick = false;
  let confirmButton: HTMLButtonElement;
  let wheel: HTMLDivElement;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let available = $derived(cast.filter(character => !taken.includes(character.id)));
  let chosen = $derived(cast.find(character => character.id === selected));

  function turnTo(id: number, turns = 0) {
    const angle = cast.findIndex(character => character.id === id) * 360 / cast.length;
    const remaining = (360 - (rotation + angle) % 360) % 360;
    rotation += turns * 360 + remaining;
  }

  function select(id: number, event: MouseEvent) {
    if (spinning || dragging || taken.includes(id)) return;
    // A drag starting on a character must not become a selection click on release.
    if (suppressClick && event.detail !== 0) return;
    selected = id;
    turnTo(id);
  }

  async function finishSpin(id: number) {
    selected = id;
    spinning = false;
    await tick();
    confirmButton?.focus({ preventScroll: true });
  }

  function spin() {
    if (spinning || dragging || !available.length) return;
    const winner = available[Math.floor(Math.random() * available.length)];
    selected = null;
    spinning = true;
    turnTo(winner.id, 3);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      void finishSpin(winner.id);
      return;
    }
    timer = setTimeout(() => { void finishSpin(winner.id); }, 2200);
  }

  function beginDrag(event: PointerEvent) {
    if (spinning || gesture || !event.isPrimary || event.button !== 0) return;
    suppressClick = false;
    const bounds = wheel.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    if (Math.hypot(event.clientX - centerX, event.clientY - centerY) < 20) return;

    // A new gesture can interrupt the short settling animation at its visible angle.
    const orbit = wheel.querySelector<HTMLElement>('.orbit')!;
    const matrix = new DOMMatrixReadOnly(getComputedStyle(orbit).transform);
    const visibleAngle = Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
    gesture = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      centerX,
      centerY,
      angle: Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180 / Math.PI,
      rotation,
      visibleRotation: rotation + rotationDelta(rotation, visibleAngle),
      selected,
    };
  }

  function drag(event: PointerEvent) {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y);
    if (!dragging && distance < 6) return;
    if (Math.hypot(event.clientX - gesture.centerX, event.clientY - gesture.centerY) < 20) return;
    event.preventDefault();
    if (!dragging) {
      dragging = true;
      suppressClick = true;
      rotation = gesture.visibleRotation;
      wheel.setPointerCapture(event.pointerId);
    }
    const angle = Math.atan2(event.clientY - gesture.centerY, event.clientX - gesture.centerX) * 180 / Math.PI;
    rotation += rotationDelta(gesture.angle, angle);
    gesture.angle = angle;
    selected = nearestCharacter(rotation, cast.map(character => character.id), taken)?.id ?? null;
  }

  function endDrag(event: PointerEvent, cancelled = false) {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const previous = gesture;
    gesture = null;
    if (dragging) {
      if (cancelled) {
        rotation = previous.rotation;
        selected = previous.selected;
      } else {
        const nearest = nearestCharacter(rotation, cast.map(character => character.id), taken);
        if (nearest) {
          rotation = nearest.rotation;
          selected = nearest.id;
        }
      }
    }
    dragging = false;
    if (wheel.hasPointerCapture(event.pointerId)) wheel.releasePointerCapture(event.pointerId);
  }

  function moveFocus(event: KeyboardEvent, index: number) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const buttons = [...wheel.querySelectorAll<HTMLButtonElement>('.mb-character')];
    const direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' || event.key === 'End' ? -1 : 1;
    let next = index;
    if (event.key === 'Home') next = -1;
    if (event.key === 'End') next = buttons.length;
    for (let step = 0; step < buttons.length; step++) {
      next = (next + direction + buttons.length) % buttons.length;
      if (!buttons[next].disabled) {
        buttons[next].focus({ preventScroll: true });
        buttons[next].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
        return;
      }
    }
  }

  onDestroy(() => clearTimeout(timer));
</script>

<svelte:window
  onpointermove={drag}
  onpointerup={event => endDrag(event)}
  onpointercancel={event => endDrag(event, true)}
/>

<div class="selection-layout">
  <div
    class="wheel"
    bind:this={wheel}
    class:spinning
    class:dragging
    style:--rotation={`${rotation}deg`}
    role="group"
    aria-label="Ruota dei personaggi"
    aria-busy={spinning || dragging}
    onpointerdown={beginDrag}
    onlostpointercapture={event => {
      // Touch starts with implicit capture on a child. Ignore its handoff to the wheel.
      if (event.target === wheel) endDrag(event, true);
    }}
  >
    <span class="pointer" aria-hidden="true">▼</span>
    <div class="orbit" role="group" aria-label="Personaggi disponibili">
      {#each cast as character, index}
        {@const angle = (index / cast.length * 2 * Math.PI) - Math.PI / 2}
        <button
          class="mb-character"
          class:selected={selected === character.id}
          class:taken={taken.includes(character.id)}
          style:left={`${50 + 40 * Math.cos(angle)}%`}
          style:top={`${50 + 40 * Math.sin(angle)}%`}
          disabled={spinning || taken.includes(character.id)}
          aria-label={character.name}
          aria-pressed={selected === character.id}
          title={taken.includes(character.id) ? `${character.name} · scelto da Player 1` : character.name}
          onclick={event => select(character.id, event)}
          onkeydown={event => moveFocus(event, index)}
        >
          <Fighter id={character.id} size="small" eager />
          {#if taken.includes(character.id)}<span class="taken-mark" aria-hidden="true">P1</span>{/if}
          {#if selected === character.id}<span class="selected-mark" aria-hidden="true">✓</span>{/if}
        </button>
      {/each}
    </div>
    <div class="wheel-center" aria-hidden="true">
      {#if chosen}<Fighter id={chosen.id} eager /><strong>{chosen.short}</strong>
      {:else}<span class="wheel-symbol">{spinning ? '↻' : '?'}</span><span>{spinning ? 'Si gira!' : 'Chi sarai?'}</span>{/if}
    </div>
  </div>
  <div class="selection-controls">
    <div class="selection-status" role="status" aria-live="polite" aria-atomic="true">
      {#if chosen}<h2>{chosen.name}</h2><p>Il tuo Polpodev è pronto.</p>
      {:else}<h2>{spinning ? 'La fortuna sta scegliendo…' : 'Scegli tu. O tenta la fortuna.'}</h2><p>Trascina la ruota con il dito o il mouse. Puoi anche toccare un Polpodev.</p>{/if}
    </div>
    {#if chosen}<CharacterMoves id={chosen.id} {config} expanded />{/if}
    <button class="spin-button" disabled={spinning || dragging || !available.length} onclick={spin}><span aria-hidden="true">↻</span> <span>Gira la ruota</span></button>
    <button class="confirm-button" bind:this={confirmButton} disabled={selected === null || spinning || dragging} onclick={() => { if (selected !== null) onchoose(selected); }}>Conferma personaggio</button>
  </div>
</div>

<style>
  .selection-layout { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(240px, 1fr); align-items: center; gap: 40px; margin: 24px 0; }
  .wheel { position: relative; width: 100%; max-width: 580px; aspect-ratio: 1; margin: auto; isolation: isolate; touch-action: none; user-select: none; cursor: grab; }
  .orbit { position: absolute; inset: 0; border: 2px solid var(--comic-border); border-radius: 50%; background: var(--comic-panel); transform: rotate(var(--rotation)); transition: transform 450ms ease-out; }
  .orbit::before { pointer-events: none; content: ''; position: absolute; inset: 18%; border: 1px dashed var(--comic-border); border-radius: 50%; }
  .pointer { pointer-events: none; position: absolute; top: -13px; left: 50%; transform: translateX(-50%); color: var(--comic-orange); font-size: 30px; z-index: 3; line-height: 1; }
  .mb-character { position: absolute; width: 17%; aspect-ratio: 1; min-height: 44px; min-width: 44px; padding: 0; display: block; z-index: 1; border: 2px solid transparent; border-radius: 50%; background: var(--comic-paper); color: var(--comic-ink); transform: translate(-50%, -50%) rotate(calc(-1 * var(--rotation))); transition: transform 450ms ease-out, border-color 150ms; }
  .mb-character :global(.fighter) { width: 100%; min-width: 0; }
  .mb-character { scroll-margin-top: 140px; scroll-margin-bottom: 16px; }
  .mb-character :global(img) { filter: grayscale(1); }
  .mb-character:hover:not(:disabled) { background: var(--comic-raised); border-color: var(--comic-orange); }
  .mb-character:active:not(:disabled) { transform: translate(-50%, -50%) rotate(calc(-1 * var(--rotation))); }
  .mb-character.selected { border-color: var(--comic-orange); background: var(--comic-raised); }
  .mb-character.selected :global(img) { filter: none; }
  .mb-character:disabled { opacity: 1; cursor: default; }
  .mb-character.taken { border-style: dashed; border-color: var(--comic-border); }
  .mb-character.taken :global(img) { opacity: .45; }
  .taken-mark, .selected-mark { position: absolute; bottom: -5px; right: -3px; padding: 2px 5px; border-radius: 4px; background: var(--comic-orange); color: var(--comic-on-accent); font-size: 11px; font-weight: 900; }
  .taken-mark { background: var(--comic-ink); }
  .wheel-center { position: absolute; inset: 28%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; pointer-events: none; }
  .wheel-center strong { font: 800 clamp(14px, 2vw, 22px)/1.1 var(--comic-display); }
  .wheel-center > span:last-child { font-size: 14px; font-weight: 700; }
  .wheel-symbol { color: var(--comic-orange); font: 900 clamp(48px, 9vw, 100px)/1 var(--comic-display); }
  .selection-controls { display: grid; gap: 12px; min-width: 0; }
  .selection-status { min-height: 125px; }
  h2 { font: 900 clamp(23px, 3vw, 32px)/1.15 var(--comic-display); margin: 0 0 12px; }
  p { color: var(--arcade-muted); font-size: 14px; margin: 0 0 20px; }
  .spin-button, .confirm-button { display: flex; justify-content: center; align-items: center; gap: 10px; min-height: 52px; border: 2px solid var(--comic-border); border-radius: 8px; padding: 12px 16px; font-weight: 800; background: var(--comic-raised); color: var(--comic-ink); }
  .confirm-button { background: var(--comic-orange); color: var(--comic-on-accent); }
  .confirm-button:disabled { background: var(--comic-panel); color: var(--arcade-muted); opacity: 1; }
  .spin-button:hover:not(:disabled) { background: var(--comic-teal); }
  .confirm-button:hover:not(:disabled) { background: #ffb48b; }
  .dragging, .dragging :global(button) { cursor: grabbing; }
  .dragging .orbit, .dragging .mb-character { transition: none; }
  .spinning .orbit, .spinning .mb-character { transition: transform 2200ms cubic-bezier(.12,.65,.12,1); }
  @media(max-width: 700px) {
    .selection-layout { grid-template-columns: minmax(0, 1fr); gap: 24px; margin-top: 28px; }
    .wheel { max-width: 430px; }
    .selection-status { min-height: 0; text-align: center; }
    .selection-status p { margin-bottom: 4px; }
    .wheel-center { inset: 29%; }
  }
  @media(prefers-reduced-motion: reduce) { .orbit, .mb-character, .spinning .orbit, .spinning .mb-character { transition: none; } }
</style>
