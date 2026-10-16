<script lang="ts">
  import { login } from './firebase/firebase.client';
  let { configured, emulator }: { configured: boolean; emulator: boolean } = $props();
  let busy = $state(false), error = $state(''), email = $state(''), password = $state('');
  async function enter(create = false) {
    busy = true; error = '';
    try { await login(emulator ? { email, password, create } : undefined); }
    catch (e) { error = e instanceof Error && !e.message.startsWith('Firebase:') ? e.message : 'Accesso annullato o non disponibile. Controlla il provider Google e la configurazione Firebase.'; }
    finally { busy = false; }
  }
</script>
<svelte:head><title>Bacarodex · Accedi</title></svelte:head>
<div class="app-shell"><header><div class="brand"><span class="ball" aria-hidden="true"></span>Bacarodex.</div><span class="badge">BACAROTECH</span></header><main class="login-panel panel"><p class="eyebrow">LA COMPAGNIA TI ASPETTA</p><h1>Area membri<br />del Bacaro.</h1><p>Accesso riservato ai membri autorizzati: registra il tuo Pokémon e gestisci la tua partecipazione al gioco.</p><p class="privacy-note">Le foto vengono elaborate nel browser e scartate. Il descrittore facciale, che non è anonimo, viene salvato su Firebase e usato sul server per riconoscerti durante il gioco pubblico, accessibile senza login. Prima della registrazione ti chiederemo un consenso esplicito.</p>
{#if configured}
  {#if emulator}<p class="notice">Emulatori locali: nessun collegamento al progetto Firebase cloud.</p><label for="email">Email di sviluppo</label><input id="email" type="email" bind:value={email} /><label for="password">Password di sviluppo</label><input id="password" type="password" bind:value={password} minlength="6" />{/if}
  <button disabled={busy || (emulator && (!email || password.length < 6))} onclick={() => enter()}>{busy ? 'Accesso…' : emulator ? 'Accedi agli emulatori' : 'Accedi con Google'}</button>
  {#if emulator}<button class="secondary" disabled={busy || !email || password.length < 6} onclick={() => enter(true)}>Crea account locale</button>{/if}
{:else}<p class="notice">Firebase non ancora configurato. Compila le variabili di <code>.env.example</code> in <code>.env</code> seguendo il README, oppure usa gli emulatori locali. Nessuna credenziale privata viene inclusa nell'app.</p>{/if}
{#if error}<p class="error" role="alert">{error}</p>{/if}
<p><a href="/">← Gioca senza registrarti</a></p><p class="hint">Accesso riservato alla lista di amici configurata sul server. Nessuna registrazione biometrica viene creata con il solo login.</p></main></div>
