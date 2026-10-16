<script lang="ts">
  const objects = [
    { icon: '☕', label: 'Tazza' }, { icon: '🍕', label: 'Pizza' }, { icon: '🪴', label: 'Pianta' },
    { icon: '👟', label: 'Scarpa' }, { icon: '🍌', label: 'Banana' }, { icon: '🧦', label: 'Calzini' },
    { icon: '🧀', label: 'Formaggio' }, { icon: '🦆', label: 'Papera' }, { icon: '🪑', label: 'Sedia' },
  ];
  let selected = $state('');
</script>

<div class="captcha-grid" role="group" aria-label="Griglia di oggetti">
  {#each objects as object}<button class:chosen={selected === object.label} aria-pressed={selected === object.label} onclick={() => selected = object.label}><span aria-hidden="true">{object.icon}</span><span>{object.label}</span></button>{/each}
</div>
<p class="object-feedback" role="status">{selected ? `${selected}? Nessun circuito rilevato. Il robot sembra divertito.` : 'Nove oggetti. Un robot molto sicuro di sé.'}</p>

<style>
  .captcha-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:450px;margin:auto}.captcha-grid button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:92px;border:2px solid #c8c0d1;border-radius:9px;background:#fffef9;color:#193e35;padding:8px;font-size:12px}.captcha-grid button>span:first-child{font-size:32px;line-height:1.2}.captcha-grid button:hover:not(:disabled){background:#f3ecfb;border-color:#6742a6}.captcha-grid button.chosen{border-color:#6742a6;background:#eee5f8}.object-feedback{font-size:13px;min-height:40px;margin:12px 0 0;color:#536559}
  @media(max-height:750px) and (max-width:650px){.captcha-grid button{min-height:72px;gap:3px}.captcha-grid button>span:first-child{font-size:27px}}
</style>
