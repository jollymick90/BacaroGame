<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Photo from '$lib/Photo.svelte';
  import Sprite from '$lib/Sprite.svelte';
  import { extract } from '$lib/recognition';
  import { EMBEDDING_MODEL, type Pokemon } from '$lib/types';
  import { loadCaptures, saveCapture, resetCaptures, playRequest, type GuestCapture } from '$lib/player';
  let { configured }: { configured:boolean }=$props();
  let section=$state<'scan'|'collection'>('scan'),busy=$state(false),ready=$state(false),count=$state(0),error=$state(''),status=$state(''),feedback=$state('');
  let photo=$state<HTMLCanvasElement|null>(null),consent=$state(false),token=$state(''),choices=$state<Pokemon[]>([]),caught=$state<GuestCapture|null>(null),captures=$state<GuestCapture[]>([]);
  let disposed = false;
  const requests = new AbortController();
  onDestroy(() => { disposed = true; requests.abort(); photo = null; token = ''; choices = []; caught = null; consent = false; });
  onMount(()=>{try{captures=loadCaptures();}catch{error='Memoria locale non disponibile: le catture potrebbero non essere salvate. Abilita la memoria del browser.';}if (configured) void refresh();});
  async function refresh(){try{const data=await playRequest<{available:boolean;count:number}>('', undefined, requests.signal);if(disposed)return;count=data.count;ready=data.available;}catch(e){if(!disposed)error=message(e);}}
  const message=(e:unknown)=>e instanceof Error?e.message:'Operazione non riuscita.';
  function reset(){token='';choices=[];caught=null;feedback='';photo=null;consent=false;}
  function navigate(next:'scan'|'collection'){if(busy)return;section=next;reset();error='';}
  async function scan(){if(busy||!photo||!consent)return;busy=true;error='';feedback='';try{
    const embedding=await extract(photo,t=>{if(!disposed)status=t;});if(disposed)return;status='Confronto temporaneo con i membri del Bacaro…';
    const result=await playRequest<{token:string;options:Pokemon[]}>('/scan',{embedding,model:EMBEDDING_MODEL,consent},requests.signal);if(disposed)return;token=result.token;choices=result.options;photo=null;
  }catch(e){if(!disposed)error=message(e);}finally{if(!disposed){busy=false;status='';}}}
  async function answer(p:Pokemon){if(busy||caught||!token)return;busy=true;error='';try{
    const result=await playRequest<{correct:boolean;capture?:GuestCapture}>('/answer',{token,pokemonId:p.id},requests.signal);if(disposed)return;
    if(!result.correct){feedback='Questo Pokémon si è imbucato al Bacaro. Riprova!';return;}
    if(result.capture){caught=result.capture;try{captures=saveCapture(result.capture);}catch{error='Bacaro catturato, ma il browser non permette di salvare la collezione. Abilita la memoria locale.';}}
  }catch(e){if(!disposed)error=message(e);}finally{if(!disposed)busy=false;}}
  function clear(){if(!confirm('Azzerare le catture salvate su questo dispositivo?'))return;try{resetCaptures();captures=[];}catch{error='Impossibile cancellare la memoria locale.';}}
</script>
<svelte:head><title>Bacarodex · Gioca senza registrarti</title></svelte:head>
<div class="app-shell dex-game"><header><div class="brand"><span class="ball" aria-hidden="true"></span>Bacarodex</div><a href="/admin">Area membri</a></header><main><div class="hero"><h1 tabindex="-1">Chi catturi oggi?</h1><p>Incontra un membro registrato, scatta una foto con il suo consenso e indovina il suo Pokémon.</p></div><aside class="privacy-note"><p><strong>Il tuo Bacarodex vive su questo dispositivo.</strong> Le catture restano qui anche dopo il refresh. Su un altro telefono la collezione sarà diversa. Le foto non lasciano il browser; solo il descrittore dello scatto viene inviato temporaneamente al server per il confronto, senza salvarlo.</p></aside>
<nav aria-label="Gioco"><button class:current={section==='scan'} disabled={busy} onclick={()=>navigate('scan')}>Scansiona</button><button class:current={section==='collection'} disabled={busy} onclick={()=>navigate('collection')}>Il mio Bacarodex <small>{captures.length}</small></button></nav>
{#if error}<p class="error" role="alert">{error}</p>{/if}<div role="status">{#if busy}<p class="notice loading">{status||'Controllo della risposta…'}</p>{/if}</div>
{#if section==='scan'}<section class="panel scan-panel"><h2>Scansiona</h2>
{#if !configured}<p class="notice">Gli amministratori devono completare la configurazione del gioco.</p>
{:else if !ready}<p>Collegamento al gioco…</p><button class="secondary" onclick={refresh}>Riprova</button>
{:else if count===0}<p>Nessun membro è ancora pronto per il gioco pubblico. Torna tra poco!</p><button class="secondary" onclick={refresh}>Aggiorna</button>
{:else if caught}<div class="catch-result"><h3>Bacaro catturato!</h3><Sprite pokemon={caught.pokemon}/><p><strong>{caught.name}</strong> · <span class="pokemon-name">{caught.pokemon.name}</span></p><p>È nel tuo Bacarodex locale.</p><button onclick={reset}>Scansiona un altro Bacaro</button></div>
{:else if token}<h3>Bacaro rilevato! Quale Pokémon ha scelto?</h3><div class="quiz-options">{#each choices as p (p.id)}<button class="quiz-choice" disabled={busy} onclick={()=>answer(p)}><Sprite pokemon={p}/><span class="pokemon-name">{p.name}</span></button>{/each}</div><p class="feedback" role="status">{feedback}</p><button class="text-button" disabled={busy} onclick={reset}>Annulla e rifai la foto</button>
{:else}<p>Chiedi al membro prima di scattare. Inquadra una sola persona, con il volto ben illuminato.</p><Photo bind:photo label="nuova foto per il gioco" facing="environment" disabled={busy}/><label class="consent"><input type="checkbox" bind:checked={consent} disabled={busy}/><span>La persona ritratta partecipa volontariamente. Acconsento a elaborare la foto sul dispositivo e a inviarne temporaneamente il descrittore facciale al server per il confronto, senza conservazione. Il descrittore non è un dato anonimo.</span></label><button class="wide" disabled={busy||!photo||!consent} onclick={scan}>Riconosci il Bacaro</button>{/if}</section>
{:else}<section class="panel"><h2>Il mio Bacarodex</h2>{#if !captures.length}<p class="empty">Nessuna cattura ancora. Il prossimo incontro ti aspetta!</p>{/if}<div class="collection-grid">{#each captures as c (c.memberId)}<article class="capture-card"><Sprite pokemon={c.pokemon}/><h3>{c.name}</h3><p class="pokemon-name">{c.pokemon.name}</p><small>{new Date(c.capturedAt).toLocaleDateString('it-IT')}</small></article>{/each}</div><div class="data-actions"><button class="secondary" disabled={!captures.length} onclick={clear}>Azzera le mie catture</button></div></section>{/if}
<footer><strong>Una demo volontaria tra amici.</strong><p>Il confronto è basato su similarità, non su una probabilità certa. Non è autenticazione, anti-spoofing o un sistema anti-cheat. I membri si registrano nell’area riservata; i giocatori non devono creare account. Nessun analytics. Pokémon © Nintendo / Creatures / GAME FREAK.</p></footer></main></div>

<style>
  .dex-game { color: var(--arcade-text); }
  .dex-game :global(header) { height: 76px; border-color: var(--arcade-border); }
  .dex-game :global(.brand) { font-family: var(--arcade-display); font-size: 24px; }
  .dex-game :global(.hero) { padding: 28px 0 20px; }
  .dex-game :global(.hero h1) { font-family: var(--arcade-display); font-size: clamp(32px, 5vw, 48px); letter-spacing: -1.5px; margin-bottom: 14px; }
  .dex-game :global(.hero p), .dex-game :global(footer), .dex-game :global(footer strong) { color: var(--arcade-muted); }
  .dex-game :global(.privacy-note) { background: var(--arcade-panel); color: var(--arcade-muted); border-color: var(--arcade-border); font-size: 14px; }
  .dex-game :global(nav) { border-color: var(--arcade-border); }
  .dex-game :global(nav button) { color: var(--arcade-text); font-size: 15px; }
  .dex-game :global(nav button:hover:not(:disabled)) { background: var(--arcade-raised); color: var(--arcade-text); }
  .dex-game :global(nav button.current) { background: #72d5a3; color: #15151b; }
  .dex-game :global(.panel) { background: var(--arcade-panel); border-color: var(--arcade-border); }
  .dex-game :global(.scan-panel > p:not(.notice)), .dex-game :global(.empty), .dex-game :global(.consent) { color: var(--arcade-muted); font-size: 14px; }
  .dex-game :global(.consent), .dex-game :global(.data-actions) { border-color: var(--arcade-border); }
  .dex-game :global(.wide), .dex-game :global(.catch-result button) { background: #72d5a3; color: #15151b; box-shadow: 0 4px 0 #0c0c10; }
  .dex-game :global(.secondary), .dex-game :global(.file-button) { background: var(--arcade-raised); color: var(--arcade-text); border-color: var(--arcade-border); }
  .dex-game :global(.secondary:hover:not(:disabled)) { background: var(--arcade-raised); color: var(--arcade-text); }
  .dex-game :global(.face-inspector output) { background: var(--arcade-bg); color: var(--arcade-text); border-color: var(--arcade-border); font-size: 13px; }
  .dex-game :global(.text-button) { color: var(--arcade-text); }
  .dex-game :global(.capture-card) { color: #193e35; }
  .dex-game :global(.feedback) { color: #ffb598; }
  .dex-game :global(.hint) { color: var(--arcade-muted); font-size: 14px; }
  .dex-game :global(footer) { font-size: 13px; }
  .dex-game :global(footer strong) { font-size: 14px; }
  .dex-game :global(.photo .actions button), .dex-game :global(.file-button) { font-size: 14px; }
</style>
