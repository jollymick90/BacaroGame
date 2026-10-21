# Merge Battle online anonimo

Richiesta approvata: due dispositivi, turni, nessuna registrazione, room con link/codice,
refresh senza perdita del posto, attesa massima 180 s e partita massima 180 s dal join.

1. Aggiungere un dominio puro `online.ts`: scadenza, due posti, transizioni tramite il
   motore esistente, revisioni per concorrenza e vista senza identità/carte nascoste.
   Test: confini temporali, join ripetuto, terzo giocatore, mosse fuori turno,
   doppia mossa e segretezza.
2. Persistenza server tramite gateway dedicato `bacaroGameMergeRooms`; cookie casuale
   HttpOnly, digest nel DB, same-origin, limiti payload e creazioni per indirizzo.
   Una transazione per lettura/mutazione. Timestamp expiresAt per TTL Firestore;
   cancellazione opportunistica alla prima richiesta scaduta. TTL cloud richiede
   configurazione di deploy, non viene attivato su produzione automaticamente.
3. UI online separata sulla route del gioco: creazione/join, polling ogni 3 s,
   ripristino dal link, countdown, ruoli/carte e risultato; riuso componenti esistenti.
   Un round per stanza. Il timer non si rinnova dopo risultato o refresh.
4. Controlli Svelte, test dominio/gateway, build e API su emulatori isolati se disponibili.
   Documentare attivazione TTL, regole da integrare e costo polling. Nessun deploy cloud.

Il nome collezione è nuovo e specifico; prima del deploy confrontare l'inventario cloud
con il registro locale. Non sostituire il ruleset del progetto condiviso.
