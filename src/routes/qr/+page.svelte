<script lang="ts">
  import { onMount } from 'svelte';
  import { gameCenterUrl } from '$lib/game-center/share';

  let address = $state('');
  let image = $state('');
  let qrError = $state('');
  let actionError = $state('');
  let copied = $state(false);
  let canShare = $state(false);
  let sharing = $state(false);

  async function generate() {
    qrError = '';
    try {
      const { default: QRCode } = await import('qrcode');
      image = await QRCode.toDataURL(address, {
        width: 1000,
        margin: 4,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000', light: '#ffffff' },
      });
    } catch {
      qrError = 'Il QR non si è caricato. Puoi usare il link qui sotto o riprovare.';
    }
  }

  async function copy() {
    copied = false;
    actionError = '';
    try {
      await navigator.clipboard.writeText(address);
      copied = true;
    } catch {
      actionError = 'Copia non riuscita. Seleziona e copia il link qui sopra.';
    }
  }

  async function share() {
    actionError = '';
    sharing = true;
    try {
      await navigator.share({ title: 'BacaroTech Game Center', url: address });
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) {
        actionError = 'Condivisione non riuscita. Puoi copiare il link o mostrare il QR.';
      }
    } finally {
      sharing = false;
    }
  }

  onMount(() => {
    address = gameCenterUrl(window.location.href);
    canShare = typeof navigator.share === 'function';
    void generate();
  });
</script>

<svelte:head>
  <title>Invita a giocare · BacaroTech</title>
  <meta name="description" content="Inquadra il QR e scegli un gioco al BacaroTech." />
</svelte:head>
<div class="arcade-shell">
  <main class="share-page">
    <a class="back" href="/#/">← Torna al Game Center</a>
    <header>
      <img src="/bacarotech-logo.png" alt="BacaroTech" width="52" height="52" />
      <h1>Invita a giocare.</h1>
    </header>
    <p class="instructions">Inquadra il QR con la fotocamera del telefono.</p>
    <div class="qr-frame" aria-busy={!image && !qrError}>
      {#if image}
        <img class="qr" src={image} alt="QR per aprire il BacaroTech Game Center" />
      {:else}<p role="status">{qrError || 'Prepariamo il QR…'}</p>{/if}
    </div>
    <a class="address" href={address || '/#/'}>{address}</a>
    <div class="actions">
      {#if canShare}<button class="arcade-primary" onclick={share} disabled={!address || sharing}>Condividi link</button>{/if}
      <button class={canShare ? 'arcade-secondary' : 'arcade-primary'} onclick={copy} disabled={!address}>{copied ? 'Link copiato' : 'Copia link'}</button>
      {#if image}<a class="arcade-secondary" href={image} download="bacarotech-game-center-qr.png">Scarica QR</a>{/if}
    </div>
    <p class="copy-status" role="status">{copied ? 'Link copiato negli appunti.' : ''}</p>
    {#if actionError}<p class="error" role="alert">{actionError}</p>{/if}
    {#if qrError}<p class="error" role="alert">{qrError}</p><button class="arcade-secondary" onclick={generate}>Riprova QR</button>{/if}
  </main>
</div>

<style>
  .share-page { max-width: 560px; margin: auto; padding: 12px 22px 28px; text-align: center; }
  .back { display: flex; align-items: center; min-height: 44px; font-size: 14px; text-align: left; }
  header { display: flex; justify-content: center; gap: 16px; height: auto; border: 0; padding: 18px 0 0; }
  header img { object-fit: contain; flex-shrink: 0; }
  h1 { font-family: var(--arcade-display); font-size: clamp(28px, 5vw, 38px); line-height: 1.1; letter-spacing: -1px; margin: 0; }
  .qr-frame { aspect-ratio: 1; background: white; color: #15151b; border: 2px solid white; border-radius: 16px; display: flex; align-items: center; justify-content: center; overflow: hidden; max-width: 360px; margin: auto; }
  .qr { display: block; width: 100%; height: 100%; object-fit: contain; }
  .instructions { font-size: 16px; color: var(--arcade-muted); margin: 18px auto 22px; }
  .address { font-size: 14px; overflow-wrap: anywhere; display: block; padding: 12px 4px; }
  .actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 6px; }
  .actions > * { flex: 1 1 130px; font-size: 15px; padding: 12px; }
  .copy-status { min-height: 22px; font-size: 14px; color: var(--arcade-muted); margin: 14px 0 0; }
  @media (max-height: 750px) { .qr-frame { max-width: 290px; } header { padding-top: 8px; } .instructions { margin: 12px 0 16px; } }
</style>
