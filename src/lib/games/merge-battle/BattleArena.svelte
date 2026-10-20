<script lang="ts">
 import Fighter from './Fighter.svelte';
 import {characters,trials,resolve} from './engine';
 import type {MergeConfig} from './config';
 let {ids,moves,trial,stage,config}:{ids:number[];moves:string[];trial:number;stage:number;config:MergeConfig}=$props();
 let result=$derived(resolve(ids,moves,trial,config));
</script>
<div class="mb-arena" class:mb-action={stage>=5} class:mb-verdict={stage>=6} data-effect={result.effect} aria-label="Arena della battaglia">
 <svg class="arena-branches" viewBox="0 0 600 330" preserveAspectRatio="none" aria-hidden="true"><path d="M70 330V220Q70 170 170 170T300 90V0"/><path d="M530 330V220Q530 170 430 170T300 90"/><circle cx="300" cy="90" r="10"/></svg><div class="mb-backdrop" aria-hidden="true">{trials[trial].place}</div>
 <div class="mb-jury"><span aria-hidden="true">{trials[trial].icon}</span><b>{stage>=6?'«Ho deciso!»':stage>=5?'«Ma cosa…?!»':'«Vi osservo.»'}</b></div>
 {#each ids as id,i}
 <div class="mb-contender" class:mb-right={i===1} class:mb-winner={stage>=6&&result.winner===i}>
  <Fighter {id} emotion={stage>=6?(result.winner===null?'ready':result.winner===i?'win':'lose'):'ready'}/>
  <span class="mb-owner">{i===0?'P1':'P2'} · {characters[id].short}</span>
 </div>
 {/each}
 {#if stage>=4}
  {#each ids as id,i}<span class="mb-prop" data-move={moves[i]} class:mb-prop-right={i===1} aria-hidden="true">{config.cards.find(c=>c.id===moves[i])?.icon}</span>{/each}
 {/if}
 {#if stage>=5}<div class="mb-impact" aria-hidden="true">{result.winner===null?'DRAW':`${result.scores[0]} : ${result.scores[1]}`} </div>{/if}
 {#if stage<4}<div class="mb-count" aria-live="polite">{['3','2','1','MERGE BATTLE!'][stage]}</div>{/if}
</div>
<style>
 .arena-branches{position:absolute;inset:0;width:100%;height:100%;fill:none;stroke:#287c76;stroke-width:5;opacity:.5}.arena-branches path:nth-child(2){stroke:#7956af}.arena-branches circle{fill:#f6cb5e;stroke:#282038}.mb-action .arena-branches{stroke-dasharray:12 5;animation:branch-flow 1s linear infinite}@keyframes branch-flow{to{stroke-dashoffset:-34}}@media(prefers-reduced-motion:reduce){.mb-arena *{animation:none!important;transition:none!important}}

 .mb-arena{color:#282038;height:330px;background:#eadff7;border:2px solid #282038;border-radius:22px;position:relative;overflow:hidden;isolation:isolate;margin:18px 0}.mb-backdrop{position:absolute;inset:40px 0;text-align:center;font:700 18px monospace;opacity:.22;letter-spacing:3px}.mb-jury{position:absolute;top:12px;left:50%;transform:translateX(-50%);display:grid;justify-items:center;z-index:2}.mb-jury span{font-size:48px}.mb-jury b{font-size:12px;background:#fff5df;border:2px solid #282038;border-radius:12px;padding:5px 10px;white-space:nowrap}.mb-contender{position:absolute;bottom:20px;left:8%;display:grid;justify-items:center;z-index:2;transition:transform .7s}.mb-right{left:auto;right:8%}.mb-owner{font-size:13px;font-weight:800;background:#fff5df;border:1px solid #282038;border-radius:6px;padding:4px 7px;margin-top:9px}.mb-prop{position:absolute;left:20%;top:180px;font-size:50px;z-index:4;transition:all 1s}.mb-prop-right{left:auto;right:20%}.mb-action .mb-prop{left:42%;transform:rotate(25deg)}.mb-action .mb-prop-right{left:auto;right:42%;transform:rotate(-25deg)}.mb-impact{position:absolute;top:155px;left:50%;transform:translateX(-50%);font:700 22px monospace;white-space:nowrap;z-index:5;animation:mb-pop .7s both}.mb-count{position:absolute;inset:0;display:grid;place-items:center;background:#282038dd;color:#fff5df;font-size:clamp(30px,7vw,64px);font-weight:950;z-index:9;text-align:center}.mb-action .mb-contender{animation:mb-bump .8s}.mb-action .mb-right{animation:mb-bump .8s reverse}.mb-verdict .mb-winner{transform:translateY(-15px)}
 [data-effect='stack'].mb-action .mb-prop{transform:translateY(-50px) rotate(0)}[data-effect='stack'].mb-action .mb-prop-right{transform:translateY(8px) rotate(0)}
 [data-effect='unmask'].mb-action .mb-prop[data-move='1']{transform:translateY(-140px) rotate(220deg);opacity:.3}
 [data-effect='pillow'].mb-action .mb-prop{animation:mb-bounce 1.5s both}
 [data-effect='mirror'].mb-action .mb-prop{animation:mb-spin 1.5s both}
 [data-effect='stamp'] .mb-impact{font-size:18px;color:#9d2654;background:#fff5df;border:4px double #9d2654;padding:14px;top:170px;rotate:-12deg}
 [data-effect='snore'] .mb-impact{animation:mb-float 2s infinite alternate;color:#6742a6;font-weight:bold}
 @keyframes mb-pop{from{scale:.2;opacity:0}to{scale:1;opacity:1}}@keyframes mb-bump{50%{translate:22px 0;rotate:12deg}}@keyframes mb-bounce{50%{translate:0 -100px;rotate:80deg}100%{translate:0 -20px;rotate:160deg}}@keyframes mb-spin{to{rotate:360deg}}@keyframes mb-float{to{translate:0 -35px;scale:1.3}}
 @media(max-width:480px){.mb-contender{left:1%}.mb-right{left:auto;right:1%}.mb-arena{color:#282038;height:320px}.mb-backdrop{font-size:54px;letter-spacing:5px}}
</style>
