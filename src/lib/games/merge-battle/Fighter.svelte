<script lang="ts">
 import {characters} from './engine';
 let {id,emotion='ready',other=null}:{id:number;emotion?:string;other?:number|null}=$props();
 let c=$derived(characters[id]);
</script>
<div class="mb-puppet" class:mb-happy={emotion==='win'} class:mb-sad={emotion==='lose'} style:--coat={c.color} style:--other={other===null?c.color:characters[other].color} aria-hidden="true">
 <div class="mb-hat">{c.icon}{other!==null?characters[other].icon:''}</div>
 <div class="mb-face"><span>{emotion==='lose'?'× ×':id===1?'− −':'• •'}</span><b>{emotion==='win'?'◡':emotion==='lose'?'﹏':'▿'}</b></div>
 <div class="mb-body"><i></i><strong>{other===null?'⑂':'⑃'}</strong><i></i></div><div class="mb-feet">╰ ╯</div>
</div>
<style>
 .mb-puppet{width:120px;display:grid;justify-items:center;filter:drop-shadow(4px 5px 0 #26203922);transition:transform .4s}.mb-hat{font-size:38px;line-height:1.2;z-index:1;transform:rotate(-8deg)}.mb-face{color:#282038;width:72px;height:65px;border:3px solid #282038;border-radius:24px;background:#fff5df;display:grid;justify-items:center;align-content:center;margin-top:-6px}.mb-face span{font-size:24px;font-weight:900;white-space:pre;line-height:1}.mb-face b{font-size:25px;line-height:.7}.mb-body{color:#282038;display:flex;justify-content:space-between;align-items:center;width:86px;height:61px;border:3px solid #282038;border-radius:22px 22px 10px 10px;background:linear-gradient(90deg,var(--coat) 50%,var(--other) 50%)}.mb-body strong{font-size:34px}.mb-body i{width:14px;height:37px;background:#fff5df;border:3px solid #282038;border-radius:10px;transform:rotate(25deg);margin-left:-10px}.mb-body i:last-child{transform:rotate(-25deg);margin-left:0;margin-right:-10px}.mb-feet{font-size:30px;line-height:.8;font-weight:bold}.mb-happy{transform:rotate(-8deg) translateY(-8px)}.mb-sad{transform:rotate(12deg) translateY(10px)}
</style>
