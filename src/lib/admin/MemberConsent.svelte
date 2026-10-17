<script lang="ts">
  let { mode }: { mode: 'self' | 'other' } = $props();
</script>

{#if mode === 'other'}
  Confermo di aver informato la persona ritratta e raccolto il suo consenso esplicito a elaborare
  la foto e salvare su Firebase il suo nome, il Pokémon scelto e il descrittore facciale per il
  riconoscimento nel gioco pubblico Bacarodex, accessibile a chiunque tramite link o QR senza login.
  La persona sa che il descrittore <strong>non è un dato anonimo</strong>, resta sul server e viene
  confrontato con i descrittori inviati temporaneamente dai giocatori, che vedono nome e Pokémon
  dopo la cattura. La fotografia viene scartata dopo il salvataggio. La persona può chiedere a un
  superadmin di eliminare la sua registrazione e ritirare la partecipazione. Le catture già salvate
  sui dispositivi dei giocatori non possono essere richiamate.
{:else}
  Sono il membro ritratto e acconsento esplicitamente a elaborare la foto e salvare su Firebase
  il mio nome, il Pokémon scelto e il descrittore facciale per la demo Bacarodex, per consentire
  il riconoscimento durante il gioco pubblico, accessibile a chiunque tramite link o QR senza login.
  Il descrittore registrato resta sul server; i giocatori inviano temporaneamente quello dello scatto
  per il confronto e vedono il mio nome e Pokémon dopo la cattura.
  So che <strong>non è un dato anonimo</strong> e posso eliminare qui la mia registrazione condivisa.
  La fotografia viene scartata dopo il salvataggio. Posso ritirare la partecipazione eliminando
  la registrazione; le catture già salvate sui dispositivi dei giocatori non possono essere richiamate.
{/if}
