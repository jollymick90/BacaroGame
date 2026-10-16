<script lang="ts">
  import { onMount } from 'svelte';
  import Photo from './lib/Photo.svelte';
  import Sprite from './lib/Sprite.svelte';
  import ShareQr from './lib/ShareQr.svelte';
  import type { Member, Pokemon } from './lib/types';
  import { gameData, registerMember, removeMyMember } from './lib/api';
  import { logout } from './lib/firebase/firebase.client';
  import { catalog, details, type Entry } from './lib/pokemon';
  import { extract } from './lib/recognition';
  let { user }: { user: { uid: string; name: string; email: string } } = $props();
  let members=$state<Member[]>([]), entries=$state<Entry[]>([]);
  let ready=$state(false),busy=$state(false),status=$state(''),error=$state(''),notice=$state('');
  let name=$state(''),query=$state(''),selected=$state<Pokemon|null>(null),consent=$state(false);
  let registrationPhoto=$state<HTMLCanvasElement|null>(null);
  let listBusy=$state(false),listError=$state(''),picking=$state(false),pickToken=0;
  const hasRegistration=$derived(members.some(m=>m.id===user.uid));
  const filtered=$derived(entries.filter(p=>p.name.includes(query.trim().toLowerCase())).slice(0,12));
  const message=(e:unknown)=>e instanceof Error?e.message:'Operazione non riuscita.';
  async function refresh(){members=(await gameData()).members;ready=true;}
  async function loadCatalog(){listBusy=true;listError='';try{entries=await catalog();}catch(e){listError=message(e);}finally{listBusy=false;}}
  onMount(()=>{void (async()=>{try{await refresh();await loadCatalog();}catch(e){error=message(e);}})();});
  async function sync(){busy=true;error='';try{await refresh();}catch(e){error=message(e);}finally{busy=false;}}
  async function exit(){busy=true;try{await logout();}catch(e){error=message(e);busy=false;}}
  async function pick(p:Entry){const token=++pickToken;picking=true;error='';selected=null;try{const data=await details(p.name);if(token===pickToken)selected=data;}catch(e){error=message(e);}finally{if(token===pickToken)picking=false;}}
  async function register(event:SubmitEvent){
    event.preventDefault();if(busy||!ready||hasRegistration||!consent||!registrationPhoto||!selected||!name.trim())return;
    busy=true;error='';notice='';
    try{const embedding=await extract(registrationPhoto,t=>status=t);await registerMember(name.trim(),$state.snapshot(selected),embedding,consent);registrationPhoto=null;name='';consent=false;selected=null;query='';await refresh();notice='Bacaro registrato per il gioco pubblico! La foto è stata scartata.';}
    catch(e){error=message(e);}finally{busy=false;status='';}
  }
  async function remove(member:Member){if(!confirm(`Eliminare la tua registrazione (${member.name}) e il descrittore facciale dal gioco? Le catture già salvate dai giocatori sui loro dispositivi restano locali.`))return;busy=true;error='';try{await removeMyMember();await refresh();notice='La tua registrazione è stata eliminata dal gioco.';}catch(e){error=message(e);}finally{busy=false;}}
</script>
<svelte:head><title>Bacarodex · Area membri</title></svelte:head>
<div class="app-shell"><header><div class="brand"><span class="ball" aria-hidden="true"></span>Bacarodex.</div><a href="/#/bacarodex">Apri il gioco →</a></header><main><div class="hero"><p class="eyebrow">AREA RISERVATA AI MEMBRI DEL BACARO</p><h1>Il tuo Pokémon.<br />La loro prossima cattura.</h1><p>Registra te stesso e scegli il Pokémon che i giocatori dovranno indovinare.</p></div><div class="account-bar"><span>Accesso: <strong>{user.name}</strong></span><div class="actions"><button class="secondary" disabled={busy} onclick={sync}>Aggiorna lista</button><button class="text-button" disabled={busy} onclick={exit}>Esci</button></div></div>
<div role="status">{#if busy}<p class="notice">{status||'Operazione in corso…'}</p>{/if}{#if notice}<p class="notice">{notice}</p>{/if}</div>{#if error}<p class="error" role="alert">{error}</p>{/if}
      <section aria-labelledby="register-title" class="panel">
        <div class="section-heading"><div><p class="eyebrow">NUOVO INCONTRO</p><h2 id="register-title">Registra un Bacaro</h2></div><span class="step-label">Prima ci si presenta.</span></div>
        {#if hasRegistration}<p class="notice">Hai già registrato il tuo Bacaro. Per cambiare foto o Pokémon, elimina la tua registrazione e registrati di nuovo. Le registrazioni precedenti alla versione pubblica devono essere rifatte con il nuovo consenso.</p>{/if}
        <form onsubmit={register}>
          <fieldset disabled={busy || !ready || hasRegistration}>
            <div class="form-grid"><div>
              <label for="member-name">Come ti chiami?</label><input id="member-name" bind:value={name} maxlength="60" required placeholder="Il tuo nome da Bacaro" autocomplete="off" />
              <label for="pokemon-search">Qual è il tuo Pokémon?</label><input id="pokemon-search" type="search" bind:value={query} placeholder="Cerca per nome, es. pikachu" autocomplete="off" />
              <p class="hint">Lo scegli tu. Il tuo aspetto non c'entra!</p>
              {#if listBusy}<p role="status">Caricamento catalogo…</p>{/if}
              {#if listError}<p class="error">{listError}</p>{/if}
              {#if !entries.length && !listBusy}<button type="button" class="secondary" onclick={loadCatalog}>Carica catalogo Pokémon</button>{/if}
              <div class="pokemon-results" aria-label="Risultati Pokémon">{#each filtered as p}<button type="button" class="pokemon-chip" class:selected={selected?.name === p.name} aria-pressed={selected?.name === p.name} onclick={() => pick(p)}>{p.name}</button>{/each}</div>
              {#if entries.length && !filtered.length}<p>Nessun Pokémon trovato. Prova un altro nome.</p>{/if}
              {#if picking}<p role="status">Recupero sprite…</p>{/if}
              {#if selected}<div class="selected-pokemon"><Sprite pokemon={selected} /><div><span class="eyebrow">IL TUO COMPAGNO</span><strong class="pokemon-name">{selected.name}</strong></div></div>{/if}
            </div><div><p class="field-label">Una foto del membro</p><Photo bind:photo={registrationPhoto} label="registrazione" disabled={busy || !ready || hasRegistration} /></div></div>
            <label class="consent"><input type="checkbox" bind:checked={consent} required /><span>Sono il membro ritratto e acconsento esplicitamente a elaborare la foto e salvare su Firebase il mio nome, il Pokémon scelto e il descrittore facciale per la demo Bacarodex, per consentire il riconoscimento durante il gioco pubblico, accessibile a chiunque tramite link o QR senza login. Il descrittore registrato resta sul server; i giocatori inviano temporaneamente quello dello scatto per il confronto e vedono il mio nome e Pokémon dopo la cattura. So che <strong>non è un dato anonimo</strong> e posso eliminare qui la mia registrazione condivisa. La fotografia viene scartata dopo il salvataggio. Posso ritirare la partecipazione eliminando la registrazione; le catture già salvate sui dispositivi dei giocatori non possono essere richiamate.</span></label>
            <button class="primary wide" type="submit" disabled={!consent || !registrationPhoto || !selected || !name.trim() || picking || busy || !ready || hasRegistration}>Registra il Bacaro <span aria-hidden="true">↗</span></button>
          </fieldset>
        </form>
      </section>
      <section class="panel members" aria-labelledby="members-title"><h2 id="members-title">Bacari registrati <span class="count">{members.length}</span></h2><p class="hint">Stesso Pokémon? Nessun problema: ogni persona resta distinta.</p>
        {#if !members.length}<p class="empty">La compagnia deve ancora arrivare. Inizia tu!</p>{/if}
        {#each members as m (m.id)}<div class="member-row"><Sprite pokemon={m.pokemon} /><div><strong>{m.name}</strong><span class="pokemon-name">{m.pokemon.name}</span></div>{#if m.id === user.uid}<button class="text-button danger" disabled={busy} onclick={() => remove(m)} aria-label={`Elimina ${m.name} e i relativi dati`}>Elimina la mia registrazione</button>{/if}</div>{/each}
      </section>
<ShareQr /></main></div>
