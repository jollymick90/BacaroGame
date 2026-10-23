<script lang="ts">
  import { login } from "./firebase/firebase.client";
  let { configured, emulator }: { configured: boolean; emulator: boolean } =
    $props();
  let busy = $state(false),
    error = $state(""),
    email = $state(""),
    password = $state("");
  // Il login crea la sessione sul server; il pulsante resta bloccato fino alla fine.
  async function enter(create = false) {
    busy = true;
    error = "";
    try {
      await login(emulator ? { email, password, create } : undefined);
    } catch (e) {
      console.error(e);
      // Gli errori Firebase vengono tradotti in un messaggio adatto a chi usa il sito.
      error =
        e instanceof Error && !e.message.startsWith("Firebase:")
          ? e.message
          : "Accesso annullato o non disponibile. Riprova tra poco.";
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head><title>Bacaro membri · Accedi</title></svelte:head>
<main class="login-panel panel">
  <h1>Bacaro membri</h1>
  {#if configured}
    {#if emulator}
      <label for="email">Email di sviluppo</label>
      <input id="email" type="email" bind:value={email} autocomplete="username" />
      <label for="password">Password di sviluppo</label>
      <input id="password" type="password" bind:value={password} minlength="6" autocomplete="current-password" />
    {/if}
    <button disabled={busy || (emulator && (!email || password.length < 6))} onclick={() => enter()}>
      {busy ? "Accesso…" : emulator ? "Accedi agli emulatori" : "Accedi con Google"}
    </button>
    {#if emulator}<button class="secondary" disabled={busy || !email || password.length < 6} onclick={() => enter(true)}>Crea account locale</button>{/if}
  {:else}<p role="status">Accesso temporaneamente non disponibile.</p>{/if}
  {#if error}<p class="error" role="alert">{error}</p>{/if}
</main>

<style>
  .login-panel { max-width: 480px; margin: 64px auto; padding: 28px; }
  h1 { font-size: 32px; margin: 0 0 24px; }
  button { width: 100%; margin-top: 12px; }
  @media(max-width: 520px) { .login-panel { margin: 32px 16px; } }
</style>
