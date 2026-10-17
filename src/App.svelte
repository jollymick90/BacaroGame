<script lang="ts">
  import { onMount } from 'svelte';
  import Photo from './lib/Photo.svelte';
  import Sprite from './lib/Sprite.svelte';
  import ShareQr from './lib/ShareQr.svelte';
  import MemberConsent from './lib/admin/MemberConsent.svelte';
  import SuperadminPanel from './lib/admin/SuperadminPanel.svelte';
  import type { Member, Pokemon } from './lib/types';
  import { gameData, registerMember, removeMember } from './lib/api';
  import { logout } from './lib/firebase/firebase.client';
  import { catalog, details, type Entry } from './lib/pokemon';
  import { extract } from './lib/recognition';

  interface User {
    uid: string;
    name: string;
    email: string;
  }

  let { user }: { user: User } = $props();
  let members = $state<Member[]>([]);
  let entries = $state<Entry[]>([]);
  let ready = $state(false);
  let busy = $state(false);
  let superadmin = $state(false);
  let mode = $state<'self' | 'other'>('self');
  let status = $state('');
  let error = $state('');
  let notice = $state('');
  let name = $state('');
  let query = $state('');
  let selected = $state<Pokemon | null>(null);
  let consent = $state(false);
  let registrationPhoto = $state<HTMLCanvasElement | null>(null);
  let listBusy = $state(false);
  let listError = $state('');
  let picking = $state(false);
  let pickToken = 0;

  const hasRegistration = $derived(members.some(member => member.id === user.uid));
  const registrationBlocked = $derived(
    busy || !ready || (mode === 'self' && hasRegistration) || (mode === 'other' && !superadmin),
  );
  const filtered = $derived(
    entries.filter(pokemon => pokemon.name.includes(query.trim().toLowerCase())).slice(0, 12),
  );

  function message(failure: unknown): string {
    return failure instanceof Error ? failure.message : 'Operazione non riuscita.';
  }

  function resetForm() {
    pickToken += 1;
    picking = false;
    registrationPhoto = null;
    name = '';
    consent = false;
    selected = null;
    query = '';
  }

  async function refresh() {
    const data = await gameData();
    members = data.members;
    superadmin = data.superadmin;
    if (!superadmin && mode === 'other') {
      mode = 'self';
      resetForm();
    }
    ready = true;
  }

  async function loadCatalog() {
    listBusy = true;
    listError = '';
    try {
      entries = await catalog();
    } catch (failure) {
      listError = message(failure);
    } finally {
      listBusy = false;
    }
  }

  onMount(() => {
    async function initialize() {
      try {
        await refresh();
        await loadCatalog();
      } catch (failure) {
        error = message(failure);
      }
    }
    void initialize();
  });

  async function sync() {
    busy = true;
    error = '';
    try {
      await refresh();
    } catch (failure) {
      error = message(failure);
    } finally {
      busy = false;
    }
  }

  async function exit() {
    busy = true;
    try {
      await logout();
    } catch (failure) {
      error = message(failure);
      busy = false;
    }
  }

  async function pick(pokemon: Entry) {
    const token = ++pickToken;
    picking = true;
    error = '';
    selected = null;
    try {
      const data = await details(pokemon.name);
      if (token === pickToken) {
        selected = data;
      }
    } catch (failure) {
      if (token === pickToken) {
        error = message(failure);
      }
    } finally {
      if (token === pickToken) {
        picking = false;
      }
    }
  }

  async function register(event: SubmitEvent) {
    event.preventDefault();
    if (registrationBlocked || !consent || !registrationPhoto || !selected || !name.trim()) {
      return;
    }
    busy = true;
    error = '';
    notice = '';
    try {
      const embedding = await extract(registrationPhoto, text => { status = text; });
      await registerMember(name.trim(), $state.snapshot(selected), embedding, consent, mode);
      resetForm();
      await refresh();
      notice = 'Bacaro registrato per il gioco pubblico! La foto è stata scartata.';
    } catch (failure) {
      error = message(failure);
    } finally {
      busy = false;
      status = '';
    }
  }

  async function remove(member: Member) {
    const confirmed = confirm(
      `Eliminare la registrazione di ${member.name} e il descrittore facciale dal gioco? ` +
      'Le catture già salvate dai giocatori sui loro dispositivi restano locali.',
    );
    if (!confirmed) {
      return;
    }
    busy = true;
    error = '';
    notice = '';
    try {
      await removeMember(member.id);
      await refresh();
      notice = 'La registrazione è stata eliminata dal gioco.';
    } catch (failure) {
      error = message(failure);
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head><title>Bacarodex · Area membri</title></svelte:head>

<div class="app-shell">
  <header>
    <div class="brand"><span class="ball" aria-hidden="true"></span>Bacarodex.</div>
    <a href="/#/bacarodex">Apri il gioco →</a>
  </header>
  <main>
    <div class="hero">
      <p class="eyebrow">AREA RISERVATA AI MEMBRI DEL BACARO</p>
      <h1>Il tuo Pokémon.<br />La loro prossima cattura.</h1>
      <p>
        {superadmin
          ? 'Registra te stesso o altre persone consenzienti e scegli i loro Pokémon.'
          : 'Registra te stesso e scegli il Pokémon che i giocatori dovranno indovinare.'}
      </p>
    </div>
    <div class="account-bar">
      <span>Accesso: <strong>{user.name}</strong>{#if superadmin} · Superadmin{/if}</span>
      <div class="actions">
        <button class="secondary" disabled={busy} onclick={sync}>Aggiorna lista</button>
        <button class="text-button" disabled={busy} onclick={exit}>Esci</button>
      </div>
    </div>
    <div role="status">
      {#if busy}<p class="notice">{status || 'Operazione in corso…'}</p>{/if}
      {#if notice}<p class="notice">{notice}</p>{/if}
    </div>
    {#if error}<p class="error" role="alert">{error}</p>{/if}

    {#if superadmin}
      <SuperadminPanel currentEmail={user.email} onroleschange={refresh} />
    {/if}

    <section aria-labelledby="register-title" class="panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">NUOVO INCONTRO</p>
          <h2 id="register-title">Registra un Bacaro</h2>
        </div>
        <span class="step-label">Prima ci si presenta.</span>
      </div>
      {#if superadmin}
        <label for="registration-mode">Chi vuoi registrare?</label>
        <select id="registration-mode" bind:value={mode} disabled={busy} onchange={resetForm}>
          <option value="self">Me stesso</option>
          <option value="other">Un’altra persona</option>
        </select>
      {/if}
      {#if hasRegistration && mode === 'self'}
        <p class="notice">
          Hai già registrato il tuo Bacaro. Per cambiare foto o Pokémon, elimina la tua registrazione
          e registrati di nuovo. Le registrazioni precedenti alla versione pubblica devono essere
          rifatte con il nuovo consenso.
          {#if superadmin}Per aggiungere altri Bacari scegli “Un’altra persona”.{/if}
        </p>
      {/if}
      <form onsubmit={register}>
        <fieldset disabled={registrationBlocked}>
          <div class="form-grid">
            <div>
              <label for="member-name">Nome del Bacaro</label>
              <input id="member-name" bind:value={name} maxlength="60" required placeholder="Nome del membro" autocomplete="off" />
              <label for="pokemon-search">Pokémon scelto</label>
              <input id="pokemon-search" type="search" bind:value={query} placeholder="Cerca per nome, es. pikachu" autocomplete="off" />
              <p class="hint">Lo sceglie la persona ritratta. Il suo aspetto non c'entra!</p>
              {#if listBusy}<p role="status">Caricamento catalogo…</p>{/if}
              {#if listError}<p class="error">{listError}</p>{/if}
              {#if !entries.length && !listBusy}
                <button type="button" class="secondary" onclick={loadCatalog}>Carica catalogo Pokémon</button>
              {/if}
              <div class="pokemon-results" aria-label="Risultati Pokémon">
                {#each filtered as pokemon}
                  <button
                    type="button"
                    class="pokemon-chip"
                    class:selected={selected?.name === pokemon.name}
                    aria-pressed={selected?.name === pokemon.name}
                    onclick={() => pick(pokemon)}
                  >{pokemon.name}</button>
                {/each}
              </div>
              {#if entries.length && !filtered.length}<p>Nessun Pokémon trovato. Prova un altro nome.</p>{/if}
              {#if picking}<p role="status">Recupero sprite…</p>{/if}
              {#if selected}
                <div class="selected-pokemon">
                  <Sprite pokemon={selected} />
                  <div><span class="eyebrow">IL COMPAGNO SCELTO</span><strong class="pokemon-name">{selected.name}</strong></div>
                </div>
              {/if}
            </div>
            <div>
              <p class="field-label">Una foto del membro</p>
              <Photo bind:photo={registrationPhoto} label="registrazione" disabled={registrationBlocked} />
            </div>
          </div>
          <label class="consent">
            <input type="checkbox" bind:checked={consent} required />
            <span><MemberConsent {mode} /></span>
          </label>
          <button
            class="primary wide"
            type="submit"
            disabled={!consent || !registrationPhoto || !selected || !name.trim() || picking || registrationBlocked}
          >Registra il Bacaro <span aria-hidden="true">↗</span></button>
        </fieldset>
      </form>
    </section>

    <section class="panel members" aria-labelledby="members-title">
      <h2 id="members-title">Bacari registrati <span class="count">{members.length}</span></h2>
      <p class="hint">Stesso Pokémon? Nessun problema: ogni persona resta distinta.</p>
      {#if !members.length}<p class="empty">La compagnia deve ancora arrivare. Inizia tu!</p>{/if}
      {#each members as member (member.id)}
        <div class="member-row">
          <Sprite pokemon={member.pokemon} />
          <div><strong>{member.name}</strong><span class="pokemon-name">{member.pokemon.name}</span></div>
          {#if superadmin || member.id === user.uid}
            <button
              class="text-button danger"
              disabled={busy}
              onclick={() => remove(member)}
              aria-label={`Elimina ${member.name} e i relativi dati`}
            >{member.id === user.uid ? 'Elimina la mia registrazione' : 'Elimina registrazione'}</button>
          {/if}
        </div>
      {/each}
    </section>
    <ShareQr />
  </main>
</div>
