<script lang="ts">
 import {AXES,ICONS,compareCards,score,type Card} from '$lib/games/merge-battle/cards';
 import {characters,trials} from '$lib/games/merge-battle/catalog';
 import {validateConfig,type MergeConfig} from '$lib/games/merge-battle/config';
 let {config=$bindable()}:{config:MergeConfig}=$props();
 let selected=$state(''), query=$state('');
 let card=$derived(config.cards.find(c=>c.id===selected));
 let a=$state(''),b=$state(''),judge=$state(0);
 let filtered=$derived(config.cards.filter(c=>c.name.toLowerCase().includes(query.toLowerCase())));
 let simulation=$derived.by(()=>{try{const left=config.cards.find(c=>c.id===a),right=config.cards.find(c=>c.id===b);return left&&right?compareCards(left,right,config.weights[judge]):null;}catch{return null;}});
 let validation=$derived.by(()=>{try{validateConfig(config);return '';}catch(e){return e instanceof Error?e.message:'Configurazione non valida.';}});
 let balance=$derived.by(()=>{
  try{return config.judges.map(j=>{const candidates=config.cards.filter(c=>c.active&&config.characters.some(id=>config.assignments[id]?.includes(c.id)));const best=Math.max(...candidates.map(c=>score(c.stats,config.weights[j])));return {judge:trials[j].jury,best,cards:candidates.filter(c=>score(c.stats,config.weights[j])===best).map(c=>c.name)};});}catch{return [];}
 });
 function add(source?:Card){if(config.cards.length>=100)return;const id=crypto.randomUUID();config.cards.push(source?{...source,id,name:source.name.slice(0,70)+' (copia)',stats:[...source.stats]}:{id,name:'Nuova mossa',description:'',icon:'⌘',active:true,stats:[3,3,3,3]});selected=id;}
</script>
<div class="editor">
 <h3>Carte e caratteristiche</h3><p>Ogni carta distribuisce 12 punti: da 0 a 6 su ciascun asse. Nome e descrizione sono liberi.</p>
 <label>Cerca carta<input type="search" bind:value={query} /></label>
 <div class="columns"><label>Carta da modificare<select bind:value={selected}><option value="">Scegli una carta</option>{#each filtered as c}<option value={c.id}>{c.active?'':'[disattiva] '}{c.name}</option>{/each}</select></label><button type="button" disabled={config.cards.length>=100} onclick={()=>add()}>Crea carta ({config.cards.length}/100)</button></div>
 {#if card}
 <div class="card-editor">
 <label>Nome<input maxlength="80" bind:value={card.name} /></label>
 <label>Descrizione<textarea maxlength="500" bind:value={card.description}></textarea></label>
 <label>Icona<select bind:value={card.icon}>{#each ICONS as icon}<option value={icon}>{icon}</option>{/each}</select></label>
 <label class="check"><input type="checkbox" bind:checked={card.active} />Carta attiva</label>
 <div class="axes">{#each AXES as axis,i}<label>{axis}<input type="number" min="0" max="6" step="1" bind:value={card.stats[i]} /></label>{/each}</div>
 <p role="status">Totale: {card.stats.reduce((sum,n)=>sum+(n||0),0)}/12</p><button type="button" disabled={config.cards.length>=100} onclick={()=>add(card)}>Duplica carta</button>
 </div>
 {/if}
 <h3>Tre carte per personaggio</h3><p>Una carta può essere condivisa da più ruoli. Prima di disattivarla, sostituiscila nei ruoli attivi.</p>
 {#each characters.filter(c=>config.characters.includes(c.id)) as role}
 <details><summary>{role.name}</summary><div class="assignments">{#each [0,1,2] as slot}<label>Carta {slot+1}<select bind:value={config.assignments[role.id][slot]}>{#each config.cards.filter(c=>c.active||config.assignments[role.id][slot]===c.id) as c}<option value={c.id}>{c.name}{c.active?'':' (disattiva)'}</option>{/each}</select></label>{/each}</div></details>
 {/each}
 <h3>Criteri di review dei maintainer</h3><p>Ogni peso va da 1 a 3. Il punteggio è la somma di valore × peso. Un pareggio resta un pareggio.</p>
 {#each config.judges as id}<details><summary>{trials[id].jury}</summary><div class="axes">{#each AXES as axis,i}<label>{axis}<input type="number" min="1" max="3" step="1" bind:value={config.weights[id][i]} /></label>{/each}</div></details>{/each}
 {#if validation}<p class="invalid" role="status">{validation}</p>{/if}
 <details><summary>Simula uno scontro</summary><div class="columns">{#each [0,1] as side}<label>Carta {side+1}<select value={side===0?a:b} onchange={e=>{if(side===0)a=e.currentTarget.value;else b=e.currentTarget.value;}}><option value="">Scegli</option>{#each config.cards.filter(c=>c.active) as c}<option value={c.id}>{c.name}</option>{/each}</select></label>{/each}</div><label>Maintainer<select bind:value={judge}>{#each trials as t,i}<option value={i}>{t.jury}</option>{/each}</select></label>
 {#if simulation}<p role="status">{simulation.scores[0]} : {simulation.scores[1]} · {simulation.winner===null?'Pareggio':`Vince carta ${simulation.winner+1}`}</p>{#each [a,b] as id}{@const c=config.cards.find(c=>c.id===id)!}<p>{c.name}: {c.stats.map((n,i)=>`${n}×${config.weights[judge][i]}`).join(' + ')}</p>{/each}{/if}</details>
 <details><summary>Controllo del bilanciamento</summary><p>Carte con il punteggio massimo fra quelle assegnate ai ruoli attivi. Con queste regole una carta al massimo non perde contro le altre nello stesso scenario.</p>{#each balance as row}<p><strong>{row.judge} · {row.best} punti</strong><br/>{row.cards.join(' · ')}</p>{/each}</details>
</div>
<style>
 .editor{margin-top:28px}.editor label{display:grid;gap:8px;font-size:14px}.editor input,.editor select,.editor textarea{width:100%;min-width:0;padding:10px;border:1px solid #87968d;border-radius:6px;background:#fffef9;color:#193e35;box-sizing:border-box}.editor textarea{min-height:80px;resize:vertical}.columns,.axes,.assignments{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}.axes{grid-template-columns:repeat(4,1fr)}.assignments{grid-template-columns:repeat(3,1fr)}.card-editor{padding:18px;background:#fff;border:2px solid #287c76;border-radius:12px;display:grid;gap:14px}.editor .check{display:flex;align-items:center}.check input{width:20px;height:20px}.editor details{padding:12px 0;border-bottom:1px solid #bbc8b1}.editor summary{cursor:pointer;min-height:32px}.invalid{color:#9d2654}.editor p{line-height:1.6;overflow-wrap:anywhere}@media(max-width:600px){.columns,.assignments{grid-template-columns:1fr}.axes{grid-template-columns:1fr 1fr}}
</style>
