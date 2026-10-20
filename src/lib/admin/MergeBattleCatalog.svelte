<script lang="ts">
  import { invalidate } from '$app/navigation';
 import {onMount} from 'svelte';
 import {AXES} from '$lib/games/merge-battle/cards';
 import {characters,trials} from '$lib/games/merge-battle/catalog';
 import {DEFAULT_CONFIG,validateConfig,type MergeConfig} from '$lib/games/merge-battle/config';
 import MergeBattle from '$lib/games/merge-battle/MergeBattle.svelte';
 import MergeCardsEditor from './MergeCardsEditor.svelte';
 let draft=$state<MergeConfig>(JSON.parse(JSON.stringify(DEFAULT_CONFIG)));
 let previewConfig=$state<MergeConfig>(DEFAULT_CONFIG),preview=$state(false);
 let revision=$state(0),loading=$state(true),saving=$state(false),status=$state(''),error=$state(''),saved=$state('');
 const dirty=$derived(JSON.stringify(draft)!==saved);
 const validation=$derived.by(()=>{try{validateConfig(draft);return '';}catch(e){return e instanceof Error?e.message:'Configurazione non valida.';}});
 async function load(){loading=true;error='';status='';preview=false;try{const response=await fetch('/api/merge-battle/config');const data=await response.json();if(!response.ok)throw Error(data.message||'Caricamento non riuscito.');draft=validateConfig(data.config);revision=data.revision;saved=JSON.stringify(draft);status=data.persisted?'Configurazione caricata da Firebase.':'Valori predefiniti: salva per pubblicarli su Firebase.';}catch(e){error=e instanceof Error?e.message:'Caricamento non riuscito.';}finally{loading=false;}}
 async function save() {
  saving = true;
  error = '';
  status = '';
  try {
   const config = validateConfig(draft);
   const response = await fetch('/api/merge-battle/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config, revision }),
   });
   const data = await response.json();
   if (!response.ok) throw Error(data.message || 'Salvataggio non riuscito.');
   revision = data.revision;
   draft = validateConfig(data.config);
   saved = JSON.stringify(draft);
   void invalidate('game-center:configuration');
   status = 'Configurazione salvata su Firebase. Sarà usata nelle nuove partite.';
  } catch (failure) {
   error = failure instanceof Error ? failure.message : 'Salvataggio non riuscito.';
  } finally {
   saving = false;
  }
 }
 function toggle(kind:'characters'|'judges',id:number){const list=draft[kind];draft[kind]=list.includes(id)?list.filter(n=>n!==id):[...list,id].sort((a,b)=>a-b);if(kind==='characters'&&!draft.assignments[id])draft.assignments[id]=[...DEFAULT_CONFIG.assignments[id]];if(kind==='judges'&&!draft.weights[id])draft.weights[id]=[...DEFAULT_CONFIG.weights[id]];}
 function toggleAxis(axis: number) {
  const enabled = draft.activeAxes.includes(axis);
  if (enabled && draft.activeAxes.length === 1) return;
  draft.activeAxes = enabled
   ? draft.activeAxes.filter(value => value !== axis)
   : [...draft.activeAxes, axis].sort((left, right) => left - right);
 }
 function openPreview(){previewConfig=validateConfig(draft);preview=true;}
 onMount(()=>{void load();});
</script>
<section class="catalog" aria-labelledby="merge-catalog-title">
 <h2 id="merge-catalog-title">Merge Battle / carte e catalogo</h2>
 <p>Configura ruoli, mosse e maintainer e salva su Firebase. I giocatori scelgono solo fra le carte assegnate ai personaggi abilitati.</p>
 <fieldset disabled={loading||saving}>
 <legend>Configurazione della partita</legend>
 <h3>Parametri dello scontro</h3>
 <p>Solo i parametri selezionati compaiono nel gioco e contano nel punteggio. Mantienine almeno uno; i valori degli altri restano salvati per poterli riattivare.</p>
 <div class="parameters">
  {#each AXES as axis, index}
   <label class="parameter"><input type="checkbox" checked={draft.activeAxes.includes(index)} disabled={draft.activeAxes.length === 1 && draft.activeAxes.includes(index)} onchange={() => toggleAxis(index)} />{axis}</label>
  {/each}
 </div>
 <h3>Personaggi abilitati ({draft.characters.length}/{characters.length})</h3>
 <div class="roles">{#each characters as c}<label class="choice"><input type="checkbox" checked={draft.characters.includes(c.id)} onchange={()=>toggle('characters',c.id)} /><span><strong>{c.icon} {c.name}</strong><small>{c.trait}</small></span></label>{/each}</div>
 <h3>Maintainer abilitati ({draft.judges.length}/{trials.length})</h3>
 <div class="roles">{#each trials as t,i}<label class="choice"><input type="checkbox" checked={draft.judges.includes(i)} onchange={()=>toggle('judges',i)} /><span><strong>{t.jury}</strong><small>{t.title}</small></span></label>{/each}</div>
 <MergeCardsEditor bind:config={draft} />
 </fieldset>
 <div class="publish"><p role="status">{status}{dirty&&saved?' Modifiche non salvate.':''}</p>{#if error}<p role="alert">{error}</p>{/if}{#if validation}<p role="status">{validation}</p>{/if}
 <button disabled={loading||saving||!saved||!!validation||(!dirty&&revision>0)} onclick={save}>{saving?'Salvataggio…':'Salva configurazione pubblica'}</button>
 <button disabled={loading||saving} onclick={load}>Ricarica da Firebase</button>
 <button disabled={loading||saving||!!validation} onclick={()=>preview?preview=false:openPreview()}>{preview?'Chiudi anteprima':'Apri anteprima giocabile'}</button></div>
 {#if preview}<p>L’anteprima conserva le impostazioni con cui è stata aperta. Chiudila e riaprila per provare altre modifiche.</p><MergeBattle config={previewConfig} />{/if}
</section>
<style>
 .parameters{display:flex;flex-wrap:wrap;gap:12px}.parameter{display:flex!important;align-items:center;gap:8px;min-height:44px;padding:8px 12px;border:1px solid #87968d;border-radius:6px;background:white}.parameter input{width:20px;height:20px}
 fieldset{border:0;padding:0;margin:0;min-width:0}legend{font-weight:700}.catalog{padding:24px;border:2px solid #287c76;border-radius:16px;background:#f4f5ef;margin:24px 0}.roles{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0}.choice{display:flex;align-items:flex-start;gap:12px;padding:14px;background:white;border:1px solid #ccd5cc;border-radius:8px;cursor:pointer}.choice input{width:20px;height:20px;flex-shrink:0}.choice small{display:block;line-height:1.5;margin-top:8px}.publish{margin:24px 0;border-top:2px solid #287c76;padding-top:12px}.publish button{margin:8px 8px 0 0}.publish p{line-height:1.5}@media(max-width:600px){.roles{grid-template-columns:1fr}.catalog{padding:16px}}
</style>
