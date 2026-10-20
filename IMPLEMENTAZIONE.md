## Avvio locale automatico — 20 ottobre 2026

- Causa del blocco locale: flag emulatori abbinato a un project ID cloud, senza chiave Admin e segreto del gioco; Docker non avviato. Il `.env` conteneva anche righe JavaScript non valide per il parser di Docker Compose.
- `npm run dev` ora esegue `scripts/dev-local.mjs`: verifica Docker, avvia OrbStack/Docker Desktop su macOS se necessario, prepara Firebase con Compose e attende la salute del container. Vite riceve una configurazione demo completa tramite il solo ambiente del processo; il `.env` originale non viene modificato.
- `scripts/local-environment.mjs` forza progetto `demo-bacarodex`, host loopback dedicati Auth 9199/Firestore 8180/console 4100/websocket 9250 e account `dev@bacarotech.local` / `bacarodev123` come superadmin locale. Il provisioning dell'account usa soltanto Auth Emulator e non sovrascrive account già esistenti. Nessun seed di volti o import dal cloud.
- Comandi Compose con `--env-file .env.emulator.example`, così non interpretano il `.env` cloud. `npm run dev:cloud` conserva l'avvio Vite basato sul `.env`; build e deploy restano separati dal bootstrap locale.
- `npm run test:local`: verifica isolamento dalla configurazione cloud, account creato soltanto sul loopback e avvio ripetibile senza sovrascrivere utenti esistenti. Smoke locale con emulatori reali tramite `scripts/test-local-browser.mjs`: login, ruolo superadmin, registrazione abilitata e gioco disponibile. Verificate anche le porte pubblicate dalla console Firebase (9199/8180/9250), coerenti con client e server.

---

## Aggiornamento riconoscimento e anteprima — 20 ottobre 2026

Questa sezione aggiorna il comportamento descritto nel resoconto storico sottostante.

- Segnalazione: “Corrispondenza ambigua” nel gioco dopo una registrazione. Non sono stati letti né modificati documenti biometrici cloud per la diagnosi e non è stata acquisita la foto originale dell'utente.
- Difetto riprodotto nel matcher precedente con descrittori sintetici a 256 valori: `[1,0,…]` e `[0,1,…]` ottenevano entrambi similarità 1 rispetto al primo vettore, come il vettore identico. Il clamp della funzione generica nascondeva differenze reali.
- Correzione: similarità coseno in `src/lib/server/face-match.ts`, soglia 0.50 richiesta e margine 0.08 conservato. Vettori identici restano simili, vettori ortogonali non vengono più confusi, la scala positiva del descrittore non influenza il confronto. Le parità reali e le registrazioni duplicate continuano a essere rifiutate; messaggi distinti per foto sotto soglia e ambiguità. Punteggi numerici non equivalgono a probabilità o accuratezza.
- Nessuna modifica all'estrattore MobileFace, al formato dei 256 valori o alla versione del modello. Le registrazioni esistenti restano leggibili senza migrazioni. Eliminato l'alias Vite del vecchio matcher, ora inutilizzato. Inferenza esclusivamente nel browser, senza TensorFlow nativo lato server.
- Anteprima: `Photo.svelte` è condiviso da registrazione e gioco. Il nuovo `FaceInspector.svelte` espone un pulsante per il riquadro/landmark effettivi dello scatto e un dettaglio espandibile con i 256 valori. SVG allineato alle dimensioni effettive di inferenza e al contenimento della foto; nessun punto inventato.
- `face-analysis.ts` copia i risultati prima di rilasciare le reference dell'istanza Human e serializza le richieste al rilevatore condiviso. La pulizia avviene anche quando la rilevazione fallisce. Cambio/rimozione foto e smontaggio invalidano le anteprime in corso. Nessun nuovo endpoint, salvataggio o log dei dati di analisi.

### Verifiche e limiti

- `npm run test:recognition`: 8 test, incluse similarità, soglia 0.50, margine, input invalidi, copia delle coordinate, dimensioni di inferenza, serializzazione e pulizia dopo errore.
- `npm run test:superadmins`: 28 test su API reali e persistenza Firebase sostituita in memoria. Nuove regressioni: due vettori prima falsamente ambigui, match univoco a 0.55, rifiuto sotto soglia e rifiuto di duplicati autentici senza esporre identità.
- `scripts/test-face-preview-browser.mjs`: Chrome desktop e viewport mobile; registrazione e gioco con foto e rilevatore sintetici. Verificati overlay, 256 valori, nascondimento, rimozione durante l'analisi e payload che contengono solo i campi già previsti, senza foto o landmark.
- Modelli Human reali caricati nel browser e analisi ripetuta di un canvas senza volto: entrambe le richieste correttamente rifiutate, con possibilità di riprovare.
- `npm run check`: nessun errore o warning Svelte. `npm run build`: riuscita; solo i precedenti avvisi di tracing Vercel per metadataResolver/supports-color. Nessuna dipendenza TensorFlow nativa aggiunta al server.
- Rimane da provare il caso originale dell'utente con nuove foto volontarie sul dispositivo reale: i test sintetici dimostrano il difetto corretto, non garantiscono il riconoscimento di ogni fotografia. L'ambiguità può ancora essere corretta in presenza di registrazioni della stessa persona o di candidati realmente troppo vicini. Nessun deploy eseguito.

---

# Migrazione SvelteKit + Firebase — 15 ottobre 2026

## Realizzato

Ispezionato `../svelte-firebase-bacarotech-interview`: riutilizzato il modello client Firebase / sessione HTTP-only / Admin SDK server. Il progetto di riferimento non è stato modificato e non ne sono state copiate credenziali, dipendenze di notifiche, calendario, contatti Google o UI kit.

- SvelteKit 2, Svelte 5, TypeScript, adapter Vercel Node 22; sostituito il bootstrap Vite SPA con app.html e routes. Interfaccia Bacarodex, camera, modelli e quiz preservati.
- Login Google, allowlist server obbligatoria di email verificate, cookie dedicato `bacarodex_session` di 5 giorni con HttpOnly/SameSite=Lax/Secure in produzione. Token recenti verificati e revoca controllata; nessun token conservato in localStorage.
- Admin SDK lazy, configurazione mancante gestita nell'interfaccia, segreti esclusi dal bundle client. Nessun accesso Firestore diretto dal client; API private no-store e controllo origine delle mutazioni.
- API per lettura membri/catture, registrazione con consenso e validazione server, rimozione propria registrazione, cattura transazionale idempotente, reset personale. Nome validato e Pokémon canonico verificato sul server tramite PokéAPI.
- Documento `bacarodexMembers/{uid}`: una registrazione per account, embedding e versione modello/consenso. Catture in una mappa per giocatore sul membro, così la cancellazione non lascia catture orfane. Ogni giocatore vede solo le proprie catture nella risposta API. Nessuna cancellazione globale dei dati altrui.
- I descrittori necessari al confronto sono disponibili agli amici autorizzati; riconoscimento sempre nel browser, fotografie mai inviate al server. Consenso e informativa aggiornati.
- IndexedDB solo per cache Pokémon; dati della precedente versione locale lasciati intatti e non migrati automaticamente.
- File .env.example e .env.emulator.example, regole Firestore chiuse per Bacarodex, Firebase Emulator Suite avviabile con npm run emulators. Nessun servizio cloud modificato/deployato.
- Dipendenze aggiornate rispetto al riferimento: Admin 14 e adapter Vercel 6 compatibile con Kit 2. Override di cookie 0.7 e grpc-js 1.14 per correggere avvisi audit delle dipendenze transitive, senza passare a Kit 3.

## Verifiche eseguite

- `npm run check`: zero errori e zero warning Svelte/TypeScript.
- `npm run build`: build SSR/client e output Vercel riusciti. Modelli verificati tramite checksum e inclusi negli asset statici.
- `npm audit`: zero vulnerabilità dopo aggiornamento dipendenze.
- Avvio dev e preview. HTTP pagina login SSR, API senza sessione → 401, header no-store e origine estranea → 403. Preview di produzione senza credenziali mostra correttamente la configurazione mancante e non abilita il bypass degli emulatori. Manifest, pesi e licenze: HTTP 200, checksum corretti anche in .vercel/output/static/models.
- Emulatori ufficiali Authentication e Firestore locali, progetto fittizio `demo-bacarodex`: due account tecnici temporanei, sessioni HTTP-only create e verificate, lettura autenticata dell'archivio vuoto, consenso mancante e descrittore vuoto rifiutati, membro inesistente → 404, risposta Pokémon errata rifiutata.
- Fixture tecnica temporanea **senza nome, foto o descrittore** per verificare catture personali: catture di due utenti distinte, tentativo ripetuto idempotente, reset di un utente che preserva quello dell'altro, tentativo di cancellazione da non proprietario che non tocca il membro, cancellazione proprietario con rimozione delle catture, logout con scadenza del cookie. Fixture e account tecnici eliminati dopo la prova. Nessun embedding inventato o dato personale usato.
- Chiamata diretta a Firestore con token client autenticato → 403: regole locali efficaci.
- Ricerca nel bundle client: nessun riferimento a FIREBASE_ADMIN_KEY, BACARODEX_ALLOWED_EMAILS o firebase-admin.

Gli emulatori non costituiscono una prova del progetto cloud reale. Non sono stati eseguiti login Google reale, configurazione cloud, deployment o riconoscimento con fotografie autorizzate. La verifica browser della nuova UI non è stata completata; lo smoke SSR/API è stato eseguito via HTTP.

## Limiti e passi manuali

1. Configurare Firebase reale e lista amici da README; abilitare Google/Firestore, domini autorizzati e regole. Se il progetto è condiviso con altre app, integrare le regole senza sovrascriverle e senza wildcard che consentano l'accesso ai dati Bacarodex.
2. Accedere da due browser/account autorizzati. Registrare un volontario con nuovo consenso e foto reale; aggiornare la lista sull'altro dispositivo. Foto nuova → match → quiz → cattura → refresh e verifica persistenza.
3. Provare una persona non registrata e foto di gruppo; calibrare soglia e margine. Nessuna affidabilità biometrica dichiarata solo perché build/API passano.
4. Verificare camera su iOS/Android, permessi, rete assente, sessione scaduta, rimozione accesso dalla allowlist e cancellazioni. La lista è aggiornata su richiesta e prima delle scansioni, non realtime.

Nessuna migrazione automatica del vecchio IndexedDB, nessun backup, anti-spoofing o anti-cheat. Descrittori non anonimi condivisi con gli autorizzati e temporaneamente in RAM nei loro browser; la cancellazione dal server non può revocare copie già scaricate. Demo volontaria, non prodotto pronto per eventi pubblici. Gli emulatori accettano account locali solo in dev con progetto demo-; in produzione il bypass è disabilitato e serve la configurazione cloud.

La build segnala il chunk Human (~1.58 MB, import lazy) e due dipendenze opzionali nel tracing Vercel (fallback metadata google-gax, supports-color). Non impediscono la build locale; il deployment e l'esecuzione serverless restano da verificare nell'ambiente finale.

## Firebase locale con Docker

Aggiunti `compose.yaml`, Dockerfile ed entrypoint in `docker/firebase`, configurazione dedicata con binding interni al container e `.dockerignore` restrittivo (solo configurazione/regole, mai `.env`, sorgenti o dati). Immagini ufficiali Node 22 / Temurin Java 21, Firebase CLI 15.34.0; binari Firestore/UI scaricati al build. Comandi `firebase:up`, `firebase:down`, `firebase:logs` nel package.json.

L'app rimane sull'host. Porte pubblicate solo su loopback: UI 4000, Firestore 8080, Auth 9099, websocket Firestore 9150. Healthcheck usa l'hub interno. Esportazione al normale arresto e import automatico da `.firebase/emulator-data/export`, ignorato da Git. Esportati i dati degli emulatori nativi prima di fermarli e importarli nel container.

Verificati: `docker compose config --quiet`; build immagine su ARM64; avvio healthy; UI e configurazione UI HTTP 200; scrittura di un marcatore tecnico Firestore e rilettura dopo down/up; account Authentication mantenuto e nuovo login dopo down/up; cookie di sessione SvelteKit e API autenticate contro il servizio Docker (HTTP 200). Account/marcatore tecnici rimossi, senza foto o embedding inventati. `npm run check`: zero errori e avvisi.

I dati sono salvati al normale arresto, non in modo continuo: un crash/kill forzato può perdere modifiche recenti. I vecchi token dell'emulatore possono essere invalidati all'importazione: accedere nuovamente dopo il riavvio. Non eseguiti deploy o modifiche al progetto Firebase cloud. Il container è lasciato avviato per lo sviluppo locale.

## Area membri e gioco pubblico da QR

La configurazione attuale sostituisce il precedente accesso obbligatorio per tutti:

- `/` mostra direttamente il gioco, senza account o autenticazione Firebase del giocatore.
- `/admin` contiene login membri autorizzati, registrazione del proprio Pokémon/volto, rimozione propria registrazione e generatore QR PNG scaricabile del link pubblico. I controlli di proprietà/autorizzazione restano negli endpoint, non solo nell'interfaccia.
- Consenso `public-game-v2`: le vecchie registrazioni non sono modificate e non partecipano al gioco pubblico. Per aderire, il membro deve registrarsi nuovamente con il nuovo consenso.
- Estrazione embedding nel browser, confronto temporaneo sul server con il modulo ufficiale match di Human 3.3.6 (alias Vite al file distribuito nel pacchetto). Nessun TensorFlow nativo necessario; nessuna fotografia inviata e nessun descrittore del giocatore conservato. Il pubblico non riceve i descrittori registrati.
- API `/api/play`: solo disponibilità/conteggio. `/scan`: consenso e descrittore validati, confronto con soglia/margine, quattro opzioni e token cifrato/autenticato AES-GCM valido cinque minuti. `/answer`: verifica token, scelta, esistenza/consenso/versione della registrazione; solo dopo risposta corretta restituisce nome/Pokémon della cattura.
- Catture ospiti in localStorage del dispositivo, senza duplicati per membro, reset locale. Nessuna sincronizzazione o account ospite. Le vecchie catture Firestore non vengono migrate.
- Configurazione cloud aggiuntiva: BACARODEX_GAME_SECRET, almeno 32 caratteri casuali, solo server. Chiave fissa usata esclusivamente negli emulatori dev con progetto demo-. Corpo delle richieste limitato a 20 KB durante la lettura, API no-store e controllo origine. Nessun deployment.

Verificati: check Svelte/TypeScript con zero errori/avvisi; build SSR/client/Vercel riuscita; HTTP della pagina pubblica e login admin; API di gestione senza sessione → 401; API pubblica senza dati biometrici; rifiuto di consenso, descrittore, token non validi, origine esterna e corpo troppo grande. Verifica token cifrato/manomesso/scaduto, quattro opzioni distinte, generazione QR PNG, salvataggio locale idempotente/reset. Fixture tecnica temporanea senza foto o embedding per verificare risposta errata/corretta e rifiuto dopo ritiro del membro (410); fixture rimossa. Nessun descrittore inventato, nessun nuovo framework di test.

Non verificati con foto reali: estrazione nuova foto → match server di un volontario e rifiuto persona non registrata. Queste prove restano necessarie; il passaggio build/API non certifica il riconoscimento. Non eseguita una prova fisica di lettura QR da telefono o del nuovo flusso completo in browser. Prima di un evento pubblico effettivo servono valutazione privacy, calibrazione e protezioni anti-abuso/costi. Le catture già scaricate da un giocatore non possono essere revocate remotamente, come dichiarato nel consenso.
