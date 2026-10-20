<script lang="ts">
  import { onMount } from 'svelte';
  import { gameCenterUrl } from '$lib/game-center/share';
  let address = $state('');
  let image = $state('');
  let error = $state('');
  let copied = $state(false);
  async function generate() {
    error = '';
    try {
      const { default: QRCode } = await import('qrcode');
      image = await QRCode.toDataURL(address, {
        width: 1000,
        margin: 4,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000', light: '#ffffff' },
      });
    } catch {
      error = 'Il QR non si è caricato. Puoi usare il link qui sotto o riprovare.';
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      copied = true;
    } catch {
      error = 'Copia il link dal testo qui sotto.';
    }
  }
  onMount(() => {
    address = gameCenterUrl(window.location.href);
    void generate();
  });
</script>

<svelte:head
  ><title>Invita a giocare · BacaroTech</title><meta
    name="description"
    content="Inquadra il QR e scegli un gioco al BacaroTech."
  /></svelte:head
>
<main class="share-page">
  <a class="back" href="/#/">← Torna al Game Center</a>
  <header>
    <img src="/bacarotech-logo.png" alt="BacaroTech" />
    <p>Il prossimo round è tuo.</p>
    <h1>Inquadra.<br />Scegli. Gioca.</h1>
  </header>
  <div class="qr-frame" aria-busy={!image && !error}>
    {#if image}<img class="qr" src={image} alt="QR per aprire il BacaroTech Game Center" />{:else}<p
        role="status"
      >
        {error || 'Prepariamo il QR…'}
      </p>{/if}
  </div>
  <p class="instructions">Apri la fotocamera del tuo telefono e inquadra il codice.</p>
  <a class="address" href={address || '/#/'}>{address}</a>
  <div class="actions">
    <button onclick={copy} disabled={!address}>{copied ? 'Link copiato ✓' : 'Copia link'}</button
    >{#if image}<a href={image} download="bacarotech-game-center-qr.png">Scarica QR</a>{/if}
  </div>
  {#if error}<p role="alert">{error}</p>
    <button onclick={generate}>Riprova</button>{/if}
</main>

<style>
  .share-page {
    max-width: 540px;
    margin: auto;
    padding: 18px 22px 32px;
    text-align: center;
    font-family: 'Trebuchet MS', sans-serif;
    color: #193e35;
  }
  .back {
    display: flex;
    align-items: center;
    min-height: 44px;
    font-size: 13px;
    text-align: left;
  }
  header {
    display: block;
    height: auto;
    border: 0;
    margin: 0;
    padding: 0;
  }
  header img {
    width: 68px;
    height: 68px;
    object-fit: contain;
    background: #193e35;
    border-radius: 8px;
    padding: 5px;
  }
  header p {
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin: 8px 0;
  }
  h1 {
    font-size: clamp(35px, 9vw, 52px);
    line-height: 1;
    letter-spacing: -2px;
    margin: 12px 0 22px;
  }
  .qr-frame {
    aspect-ratio: 1;
    background: white;
    border: 2px solid #193e35;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    max-width: 390px;
    margin: auto;
  }
  .qr {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .instructions {
    font-size: 14px;
    line-height: 1.5;
    max-width: 30ch;
    margin: 18px auto 12px;
  }
  .address {
    font-size: 13px;
    overflow-wrap: anywhere;
    display: block;
    padding: 5px;
  }
  .actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-top: 18px;
  }
  .actions > * {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid #193e35;
    border-radius: 9px;
    min-height: 48px;
    text-decoration: none;
    font-size: 13px;
    padding: 10px;
    background: #fffef9;
    color: #193e35;
  }
  .actions button {
    background: #193e35;
    color: white;
  }
  @media (max-height: 750px) {
    header img {
      width: 46px;
      height: 46px;
    }
    h1 {
      font-size: 35px;
      margin: 8px 0 14px;
    }
    .qr-frame {
      max-width: 310px;
    }
    .instructions {
      margin-top: 12px;
    }
  }
</style>
