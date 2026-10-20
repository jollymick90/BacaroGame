# Registro delle collezioni Firebase condivise

Progetto Firebase: `bacarotech-interview`.

Il confronto fra lo screenshot fornito e gli accessi Firestore nei sorgenti di BacaroGame non rileva nomi in comune. **Non occorre rinominare o migrare collezioni.** Nessun dato cloud è stato modificato durante questo controllo.

## Nomi riservati all'app esistente

Inventario ricavato dallo screenshot, da aggiornare se vengono aggiunte altre collezioni nel progetto condiviso:

| Collezione | Uso consentito a BacaroGame |
| --- | --- |
| `change_requests` | Nessuno: riservata |
| `fcm_tokens` | Nessuno: riservata |
| `invites` | Nessuno: riservata |
| `slots` | Nessuno: riservata |
| `speakers` | Nessuno: riservata |
| `users` | Nessuno: riservata |

## Lista consentita a BacaroGame

| Collezione | Documenti e contenuto | Operazioni previste |
| --- | --- | --- |
| `bacarodexMembers` | `{uid}` per la registrazione personale oppure ID generato per altre persone; nome, Pokémon, descrittore facciale, modello, consenso e date; eventuali catture del vecchio flusso come campo del documento | Registrazione personale o di altre persone da parte di superadmin; lettura per confronto, ritiro del consenso e gestione dei dati autorizzati |

| `bacaroGameConfigurations` | `merge-battle` per il catalogo del gioco; `bug-hunter` per le domande dei cuori; `members-version` per invalidare la cache dei membri, `superadmins` con `emails` delegate, `allowedEmails` aggiunte, `blockedEmails` rimosse e data ultima modifica | Gestione configurazioni tramite API autorizzate; accessi e ruoli modificabili solo da superadmin |

Le registrazioni aggiunte dai superadmin includono `createdBy`, `consentRecordedBy` (UID dell’operatore), `consentMode` e `consentAt`. La revoca del ruolo non cancella le registrazioni. Le email permanenti restano nella configurazione server, non nel documento dei ruoli.

Le vecchie route `captures` e `data` operano anch'esse dentro `bacarodexMembers`; non creano collezioni `captures`, `data` o `users`. Il login crea/usa identità Firebase Authentication, non documenti Firestore `users`. Are You an AI? e le partite di Bug Hunter non scrivono su Firestore. Il catalogo di Merge Battle e le domande dei cuori di Bug Hunter usano documenti di configurazione dedicati. `bacaroGameConfigurations/bug-hunter` contiene `{ config: { questions }, revision, updatedAt, updatedBy }`: lettura pubblica tramite `GET /api/bug-hunter/config`, modifica riservata ai membri autenticati tramite `PUT`, controllo della revisione per evitare sovrascritture concorrenti. Il client riceve solo configurazione, revisione e indicatore di persistenza. Senza documento vengono restituite le 20 domande predefinite. Le catture del Bacarodex pubblico restano nel localStorage del giocatore.

`bacaroGameConfigurations/merge-battle` conserva ora `config.activeAxes`, lista di indici unici fra 0 e 3 (almeno uno). Nello schema v2 il campo mancante viene normalizzato a `[0, 1]`: Rapidità e Solidità. I vettori di quattro valori/pesi rimangono integri; il calcolo usa solo gli indici attivi. La normalizzazione in lettura non scrive dati: la scelta viene persistita al successivo salvataggio autorizzato, con gli stessi controlli di revisione. Nessuna nuova collezione.

Firestore parla di *collezioni*, non tabelle. Riutilizzare lo stesso database non cancella le altre collezioni; il rischio riguarda accessi, aggiornamenti e cancellazioni su percorsi già usati. BacaroGame mantiene tutte le proprie operazioni nel percorso dedicato. Le normali modifiche alla registrazione di un membro possono aggiornare il suo documento `bacarodexMembers/{uid}`: questa è la persistenza prevista dal gioco.

## Protezioni nel codice

- [collections.ts](src/lib/firebase/collections.ts) è il registro centrale: `RESERVED_COLLECTIONS` contiene i sei nomi esistenti; `GAME_COLLECTIONS` è la lista esplicita dei nomi autorizzati.
- [game-collections.server.ts](src/lib/firebase/game-collections.server.ts) è il punto di apertura delle collezioni. Il controllo rifiuta nomi riservati, nomi non registrati e percorsi annidati prima di accedere a Firebase.
- `membersCollection()` usa questo punto di accesso e il nome registrato, conservando `bacarodexMembers`.
- `npm run check:collections` verifica il registro e analizza i sorgenti TypeScript/JavaScript e gli script Svelte in `src/` e `scripts/`. Intercetta chiamate dirette a `collection`/`collectionGroup` fuori dal modulo previsto, riferimenti `doc` fuori dal percorso membri, inizializzazioni dirette `getFirestore` e import del client Firestore non previsti. Verifica inoltre che i nomi consentiti abbiano un blocco nel file locale delle regole.
- Il controllo viene eseguito automaticamente sia da `npm run check` sia da `npm run build`, anche durante il deploy Vercel. I test sono eseguibili con `npm run test:collections`.

Questa è una protezione applicativa e una verifica contro regressioni accidentali, non un isolamento IAM del database. Un altro programma con credenziali Admin o codice che aggiri deliberatamente il punto di accesso può ancora accedere alle altre collezioni. Il controllo statico copre le forme di accesso documentate sopra, non interpreta ogni possibile costruzione dinamica JavaScript o chiamata REST.

## Procedura per aggiungere una collezione

1. Controlla in console l'inventario aggiornato del database condiviso e aggiorna i nomi riservati.
2. Scegli un nome specifico del Game Center, ad esempio con prefisso `bacaroGame`, evitando nomi generici come `users` o `events`.
3. Aggiungi il nuovo nome a `GAME_COLLECTIONS` e documentane qui contenuto, proprietario e operazioni.
4. Usa `gameCollection` per aprirla. Se servono nuovi punti di accesso ai documenti, estendi esplicitamente il controllo statico e i test, senza disattivare il controllo generale.
5. Aggiorna le regole locali per quel percorso e integra le sole modifiche necessarie nel ruleset cloud esistente.
6. Esegui `npm run test:collections`, `npm run check` e `npm run build` prima del deploy.

Non rinominare una collezione già popolata modificando soltanto la costante: serve una migrazione esplicita. Il registro non esegue migrazioni, creazioni o cancellazioni automatiche.

## Regole del progetto condiviso

Non pubblicare il solo `firestore.rules` del Game Center sostituendo il ruleset delle interviste. Conserva le regole delle collezioni riservate e verifica che eventuali wildcard permissive non concedano accesso browser a `bacarodexMembers`. Admin SDK usa autorizzazioni server: le regole Firestore del client non sostituiscono la lista applicativa.

L'inventario deriva dallo screenshot e dal codice locale; le regole attive e l'eventuale presenza di ulteriori collezioni in cloud non sono state interrogate.

Il documento `bacaroGameConfigurations/members-version` contiene una versione opaca casuale. Viene scritto atomicamente con ogni modifica a `bacarodexMembers`, comprese le route legacy. Non contiene dati personali. Le letture del marker precedono ogni riuso della cache membri; le letture e le scritture usano il gateway approvato. Gli script esterni che modificano i membri devono aggiornare questo marker nella stessa transazione o batch per invalidare subito la cache.

### Configurazioni condivise del Game Center (20 ottobre 2026)

`GET /api/game-center/config` legge soltanto i documenti `merge-battle` e `bug-hunter` attraverso gli stessi gateway approvati. Restituisce le impostazioni pubbliche e il flag di disponibilità della configurazione Bacarodex, senza UID degli editor, sessioni, membri o descrittori. Nessun nuovo documento o collezione. Le cache server durano 60 secondi per istanza e vengono aggiornate dal rispettivo PUT; non vi sono scritture durante la lettura. Il layout SvelteKit conserva la risposta durante la navigazione tra giochi. Le cache dei membri e i controlli del consenso non cambiano.
