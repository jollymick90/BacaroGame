<script lang="ts">
  let { onsolve }: { onsolve: () => void } = $props();
  let selected = $state(false);
  let dragging = $state(false);
  let startX = 0;
  let pointerId: number | null = null;
  let ignoreClick = false;
  function start(event: PointerEvent) {
    if (!event.isPrimary || event.button !== 0) return;
    const target = event.currentTarget as HTMLButtonElement;
    pointerId = event.pointerId; startX = event.clientX; dragging = true; ignoreClick = false;
    selected = true;
    target.setPointerCapture(event.pointerId);
  }
  function finish(event: PointerEvent) {
    if (!dragging || event.pointerId !== pointerId) return;
    const target = event.currentTarget as HTMLButtonElement;
    const distance = event.clientX - startX;
    const threshold = Math.min(45, target.clientWidth * 0.15);
    dragging = false; pointerId = null;
    ignoreClick = Math.abs(distance) > 8;
    if (distance >= threshold) onsolve();
  }
  function cancel() { dragging = false; pointerId = null; ignoreClick = true; }
  function select() { if (!ignoreClick) selected = true; ignoreClick = false; }
  function keyboard(event: KeyboardEvent) {
    if (event.key === 'ArrowRight' || event.key === 'End') { event.preventDefault(); onsolve(); }
  }
</script>

<div class="loading-box">
  <div class="download-icon" aria-hidden="true">⇣</div><p class="filename">humanity_final_final_v3.zip</p>
  <div class="loading-label"><strong>99%</strong><span>È praticamente fatta.</span></div>
  <button class="loading-bar" class:selected class:dragging={dragging} aria-label="Barra di caricamento al 99%" aria-pressed={selected} aria-describedby="loading-instructions" onpointerdown={start} onpointerup={finish} onpointercancel={cancel} onlostpointercapture={cancel} onclick={select} onkeydown={keyboard}><span class="bar-fill"></span><span class="bar-caption">99% <span aria-hidden="true">⇢</span></span></button>
  <p class="remaining">Tempo rimanente: sì.</p>
  <div class="finish-row"><p role="status">{selected ? 'Barra selezionata. Il 100% è a portata di mano.' : 'Il caricamento attende una tua iniziativa.'}</p><button class="finish-button" disabled={!selected} onclick={onsolve}>100%</button></div>
  <p id="loading-instructions" class="instructions">Trascina la barra verso destra, oppure selezionala e tocca 100%. Da tastiera: Invio per selezionare, poi Tab e Invio su 100%; oppure premi Freccia destra sulla barra.</p>
</div>

<style>
  .loading-box{border:2px solid #193e35;border-radius:13px;background:#fffef9;padding:24px}.download-icon{font-size:49px;text-align:center;line-height:1.2;color:#6742a6}.filename{text-align:center;font-size:12px;color:#536559;overflow-wrap:anywhere;margin:7px 0 26px}.loading-label{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:12px}.loading-label strong{font-size:33px;letter-spacing:-1.4px;line-height:1}.loading-label>span{font-size:12px;color:#536559}.loading-bar{width:100%;height:70px;display:block;position:relative;overflow:hidden;padding:0;background:#ede6f6;color:#193e35;border:2px solid #193e35;border-radius:9px;touch-action:pan-y;user-select:none;cursor:grab}.loading-bar:hover:not(:disabled){background:#ede6f6}.loading-bar.selected{outline:3px solid #6742a6;outline-offset:3px}.loading-bar.dragging{cursor:grabbing}.bar-fill{position:absolute;inset:0 1% 0 0;background:repeating-linear-gradient(115deg,#f5cf68 0 17px,#f9dfa0 17px 34px);border-right:2px solid #193e35}.bar-caption{position:relative;display:flex;justify-content:space-between;align-items:center;padding:0 18px;font-size:20px;font-weight:800}.bar-caption>span{font-size:31px}.remaining{font-size:13px;margin:14px 0 20px;color:#536559}.finish-row{display:flex;gap:18px;align-items:center;justify-content:space-between}.finish-row p{font-size:13px;max-width:28ch;margin:0}.finish-button{min-width:84px;background:#6742a6;border-color:#6742a6}.finish-button:hover:not(:disabled){background:#53328c}.instructions{border-top:1px solid #ded6e7;margin:20px 0 0;padding-top:14px;font-size:12px;color:#536559;line-height:1.5}
  @media(max-width:420px){.loading-box{padding:18px 16px}.loading-label>span{font-size:11px}.filename{margin-bottom:20px}}
</style>
