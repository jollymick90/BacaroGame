<script lang="ts">
  import { onMount } from 'svelte';
  let { photo = $bindable<HTMLCanvasElement | null>(null), facing = 'user', disabled = false, label }: { photo?: HTMLCanvasElement | null; facing?: 'user' | 'environment'; disabled?: boolean; label: string } = $props();
  let video: HTMLVideoElement;
  let stream: MediaStream | null = null;
  let active = $state(false), starting = $state(false), error = $state(''), preview = $state('');
  let direction = $state<'user' | 'environment'>('user');
  onMount(() => { direction = facing; });
  let generation = 0;
  function stop() {
    generation++; stream?.getTracks().forEach(t => t.stop()); stream = null;
    if (video) video.srcObject = null;
    active = false; starting = false;
  }
  async function start() {
    stop(); error = ''; const token = generation; starting = true;
    try {
      if (!window.isSecureContext) throw new Error('La fotocamera richiede HTTPS oppure localhost. Puoi caricare una foto.');
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Fotocamera non disponibile in questo browser. Carica una foto.');
      const acquired = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: direction }, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
      if (token !== generation) { acquired.getTracks().forEach(t => t.stop()); return; }
      stream = acquired; video.srcObject = acquired; await video.play(); if (token !== generation) return; active = true;
    } catch (e) {
      if (token !== generation) return;
      stop();
      const name = e instanceof DOMException ? e.name : '';
      error = name === 'NotAllowedError' ? 'Permesso fotocamera negato. Abilitalo nelle impostazioni del browser o carica una foto.' : name === 'NotFoundError' ? 'Nessuna fotocamera trovata. Carica una foto.' : e instanceof Error ? e.message : 'Impossibile aprire la fotocamera.';
    } finally { if (token === generation) starting = false; }
  }
  function resize(source: CanvasImageSource, width: number, height: number) {
    if (!width || !height) throw new Error('Immagine non leggibile. Riprova.');
    const scale = Math.min(1, 1024 / Math.max(width, height));
    const canvas = document.createElement('canvas'); canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvas non disponibile.');
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height); photo = canvas;
  }
  function shoot() { try { resize(video, video.videoWidth, video.videoHeight); stop(); } catch (e) { error = String(e); } }
  async function upload(event: Event) {
    const input = event.target as HTMLInputElement; const file = input.files?.[0]; if (!file) return;
    stop(); const token = generation; error = ''; photo = null;
    try {
      if (!file.type.startsWith('image/')) throw new Error('Scegli un file immagine.');
      if (file.size > 30 * 1024 * 1024) throw new Error('Immagine troppo grande (massimo 30 MB).');
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      try { if (token === generation) resize(bitmap, bitmap.width, bitmap.height); } finally { bitmap.close(); }
    } catch { if (token !== generation) return; error = 'Foto non leggibile o troppo grande. Prova un JPEG/PNG sotto 30 MB.'; }
    finally { input.value = ''; }
  }
  $effect(() => { preview = photo ? photo.toDataURL('image/jpeg', 0.85) : ''; });
  onMount(() => {
    const hide = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', hide); window.addEventListener('pagehide', stop);
    return () => { stop(); document.removeEventListener('visibilitychange', hide); window.removeEventListener('pagehide', stop); };
  });
</script>
<div class="photo">
  <div class="viewfinder" class:live={active}>
    <video bind:this={video} playsinline muted aria-label={`Anteprima fotocamera: ${label}`} hidden={!active && !starting}></video>
    {#if preview && !active && !starting}<img src={preview} alt={`Foto da elaborare: ${label}`} />
    {:else if !active && !starting}<div class="camera-placeholder"><span aria-hidden="true">＋</span><p>Un volto, ben illuminato.<br />Il prossimo Bacaro sei tu?</p></div>{/if}
    {#if active}<div class="scan-line" aria-hidden="true"></div>{/if}
  </div>
  <div class="actions">
    {#if active}
      <button type="button" onclick={shoot} {disabled}>Scatta foto</button>
      <button type="button" class="secondary" onclick={() => { direction = direction === 'user' ? 'environment' : 'user'; void start(); }} {disabled}>Cambia camera</button>
    {:else}<button type="button" onclick={start} disabled={disabled || starting}>{starting ? 'Apertura…' : photo ? 'Rifai dalla camera' : 'Apri fotocamera'}</button>{/if}
    {#if active || starting}<button type="button" class="secondary" onclick={stop}>Chiudi camera</button>{/if}
    <label class="file-button" class:disabled>Carica foto<input type="file" accept="image/*" onchange={upload} {disabled} aria-label={`Carica foto: ${label}`} /></label>
    {#if photo}<button type="button" class="text-button" onclick={() => { photo = null; }} {disabled}>Rimuovi foto</button>{/if}
  </div>
  {#if error}<p class="error" role="alert">{error}</p>{/if}
</div>
