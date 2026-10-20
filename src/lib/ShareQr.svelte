<script lang="ts">
  import { onMount } from 'svelte';
  let url = $state(''), qr = $state(''), error = $state(''), busy = $state(false);
  async function generate() {
    error = ''; busy = true; qr = '';
    try {
      const target = new URL(url);
      if(!['http:','https:'].includes(target.protocol) || target.username || target.password) throw new Error('Inserisci un URL HTTP o HTTPS valido.');
      target.pathname='/';target.search='';target.hash='/bacarodex';url=target.href;
      const { default: QRCode } = await import('qrcode');
      qr = await QRCode.toDataURL(url,{width:280,margin:2,errorCorrectionLevel:'M'});
    } catch { error='Impossibile generare il QR. Controlla l’indirizzo del sito.'; }
    finally { busy=false; }
  }
  onMount(()=>{url=window.location.origin+'/bacarodex';void generate();});
</script>
<section class="panel qr-panel" aria-labelledby="qr-title"><p class="eyebrow">INVITA A GIOCARE</p><h2 id="qr-title">Un QR, nessuna registrazione</h2><p>Chiunque apre questo link entra direttamente nel gioco. L’area membri rimane protetta.</p><label for="public-url">Indirizzo pubblico del gioco</label><input id="public-url" type="url" bind:value={url} /><button class="secondary" disabled={busy} onclick={generate}>Genera QR</button>{#if qr}<div><img class="qr-image" src={qr} alt={`QR per giocare su ${url}`} /><p><a href={url}>{url}</a></p><a class="file-button" href={qr} download="bacarodex-qr.png">Scarica QR</a></div>{/if}{#if error}<p class="error" role="alert">{error}</p>{/if}<p class="hint">Per i telefoni usa l’indirizzo HTTPS del sito pubblicato. Un QR con localhost funziona solo sul computer che esegue l’app.</p></section>
