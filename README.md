# BacaroTech Game Center

Una raccolta di piccoli giochi nello stesso progetto SvelteKit + TypeScript + Vite. Home e giochi pubblici non richiedono account.

- **`/#/` — Game Center**: scegli Bacarodex, Are You an AI?, Merge Battle o Bug Hunter. Production Is on Fire resta “In arrivo”. La radice `/` apre la home.
- **`/#/bacarodex` — Bacarodex pubblico**: riconosci un membro consenziente e indovina il Pokémon. Le catture sono salvate sul dispositivo. Registrazione membri e confronto richiedono Firebase.
- **`/#/are-you-an-ai` — Are You an AI?**: parodia dei CAPTCHA con intro, tre rompicapi e certificato finale. Testi prefissati e stato in memoria: nessuna AI reale, API, fotocamera o persistenza del gioco. Funziona anche senza configurare Firebase.
- **`/#/merge-battle` — Merge Battle**: battaglie comiche single player o 1 vs 1 locale, senza backend.
- **`/#/bug-hunter` — Bug Hunter**: runner Three.js con quattro specie di insetti, ostacoli e retino, senza backend.
- **`/admin` — area membri Bacarodex**: solo gli account Google della lista autorizzata possono registrare se stessi, scegliere il Pokémon e ritirare la propria partecipazione. Include il QR scaricabile diretto a Bacarodex.

I giochi sono caricati dinamicamente. Human e i modelli facciali si caricano soltanto dopo una richiesta di elaborazione in Bacarodex o nell’area membri. Navigazione tramite hash, apertura diretta, refresh e indietro/avanti senza router aggiuntivi; hash sconosciuti ricondotti alla home. Tutti i giochi hanno “Torna al Game Center”. Le vecchie stampe QR dirette alla radice aprono ora la home.

## Are You an AI?

Seleziona “Non sono un robot” e premi “Verificami, allora”. Ogni prova offre due indizi immediati e “Ricomincia la prova”; dopo la soluzione leggi la battuta e premi “Continua”. Nessun timer, vite o game over.

1. **Chiudi tutte le finestre:** le X sostituiscono le tre finestre simulate, senza moltiplicarle. “Spegni” chiude il desktop e risolve la prova.
2. **Completa il caricamento:** trascina un punto qualsiasi della barra verso destra, oppure seleziona la barra e premi “100%”. Con tastiera: Freccia destra o Fine sulla barra; in alternativa Invio/Spazio per selezionarla, Tab e Invio su “100%”.
3. **Seleziona il robot:** scegli il robot assistente fuori dalla griglia. Gli oggetti sbagliati danno solo un commento e puoi riprovare.

Il certificato “UMANO PER INSUFFICIENZA DI PROVE” resta nell’interfaccia. “Riprova” riparte dall’intro; uscita o refresh ricominciano il gioco. Le catture di Bacarodex restano indipendenti. Non si aprono vere finestre o richieste di permesso e non si producono PDF o immagini del certificato.

## Bacarodex e Firebase

Il riferimento `../bacaro_interviste/svelte-firebase-bacarotechtech-interview` resta invariato. Richiede Node 22, versione 22.17 o successiva della stessa major, per l’app; gli emulatori girano in Docker.

## Avvio locale con Docker (consigliato)

```sh
npm ci
cp .env.emulator.example .env
npm run firebase:up
npm run dev
```

Apri http://localhost:5173 per il Game Center; per registrare membri apri http://localhost:5173/admin e crea un account **locale** dal login. Console Firebase locale: http://localhost:4000 (utenti Authentication e dati Firestore). Non servono credenziali Firebase, Java o Firebase CLI sul computer: sono nel container. Serve Docker con Compose v2.

```sh
npm run firebase:logs  # log del servizio
npm run firebase:down  # arresto con esportazione dei dati
npm run firebase:up    # riavvio con importazione dei dati salvati
```

Il servizio usa gli emulatori ufficiali Authentication (9099) e Firestore (8080), con CLI fissata a 15.34.0, Node 22 e Java 21. Il primo build scarica immagini, CLI e binari ufficiali; gli avvii successivi riutilizzano l'immagine. Le porte sono pubblicate solo su 127.0.0.1. L'app SvelteKit gira sull'host e usa gli indirizzi già presenti nella configurazione locale. Non avviare contemporaneamente gli emulatori nativi sulle stesse porte.

I dati vengono esportati in `.firebase/emulator-data/export` al normale arresto e reimportati all'avvio. La cartella è ignorata da Git e dal contesto Docker: può contenere dati biometrici dei volontari. Non cancellarla se vuoi conservare le registrazioni. Un arresto forzato (`kill -9`, crash o spegnimento) può perdere le modifiche successive all'ultima esportazione. Arresta con `npm run firebase:down`. Dopo il riavvio può essere necessario accedere di nuovo: gli account restano salvati, ma i vecchi token possono essere invalidati dall’emulatore.

Il progetto `demo-bacarodex` è locale e non contatta Firebase cloud. La modalità emulatori è abilitata solo in sviluppo. `.env` non viene incorporato nell'immagine Docker. Non usare fotografie di terzi senza consenso.

In alternativa, senza Docker: `npm run emulators` (richiede Node 22 e Java 21 sull'host) e `npm run dev` in un secondo terminale. Questa variante nativa resta senza esportazione automatica.

```sh
npm run check
npm run models
npm run build
npm run preview
```

La preview è una build di produzione: gli emulatori sono deliberatamente abilitati **solo in dev**. Per provare la preview autenticata serve la configurazione Firebase cloud seguente; senza credenziali mostra le istruzioni di configurazione.

## Firebase reale e Vercel

Il [registro delle collezioni Firebase](COLLEZIONI_FIREBASE.md) separa i nomi riservati alle interviste da quelli consentiti al Game Center. Il controllo `npm run check:collections` viene eseguito anche in build.

Per la procedura completa, con confronto al progetto interviste, configurazione delle variabili e collaudo, vedi [Guida al deploy Firebase e Vercel](GUIDA_DEPLOY_FIREBASE_VERCEL.md).

1. Abilita Google Authentication e Cloud Firestore nel progetto Firebase, aggiungi il dominio finale tra quelli autorizzati.
2. Copia `.env.example` in `.env` per configurare il cloud. Imposta i valori Web `PUBLIC_FIREBASE_API_KEY`, `PUBLIC_FIREBASE_AUTH_DOMAIN`, `PUBLIC_FIREBASE_PROJECT_ID`.
3. Sul server imposta `FIREBASE_ADMIN_KEY` (JSON service account su una riga), `BACARODEX_SUPERADMIN_EMAILS` (email dei superadmin permanenti) e, facoltativamente, `BACARODEX_ALLOWED_EMAILS` (lista iniziale dei membri) e **`BACARODEX_GAME_SECRET`**, segreto casuale di almeno 32 caratteri (`openssl rand -hex 32`). Non usare variabili PUBLIC per i segreti. Nessuna credenziale copiata dal riferimento.
4. Imposta `PUBLIC_FIREBASE_USE_EMULATORS=false`. La lista email riguarda **solo gli amministratori/membri**, non i giocatori.
5. Mantieni chiuso l’accesso Firestore diretto ai documenti `bacarodexMembers` con `firestore.rules`: passano tutti dal backend. Se il progetto ospita altre app, integra le regole senza sovrascriverle e senza wildcard permissive che rendano pubblico questo archivio.
6. Vercel: preset **SvelteKit**, Node **22**, build `npm run build`, output automatico `.vercel/output`. Configura le variabili del server anche su Vercel. Nessun deployment eseguito.

In `/admin`, il QR viene generato per `/#/bacarodex`, così apre direttamente Bacarodex. Il link generale del Game Center rimane la radice del sito. Per l’uso da telefono inserisci il vero indirizzo HTTPS raggiungibile dal telefono, non localhost. Puoi scaricare il PNG e stamparlo. Per giocare non serve conoscere il link dell’area membri.

## Superadmin

Configura `BACARODEX_SUPERADMIN_EMAILS` sul server (su Vercel nell’ambiente Production): email Google verificate separate da virgole. Questi account hanno accesso anche senza essere ripetuti in `BACARODEX_ALLOWED_EMAILS`, sono sempre superadmin e non possono essere declassati dall’interfaccia. Dopo aver cambiato le variabili su Vercel, esegui un nuovo deploy.

In `/admin`, apri **Bacarodex → Membri autorizzati e superadmin**. Inserisci l’email Google e premi **Autorizza membro**: da quel momento il membro può accedere e registrare se stesso, senza aggiornare Vercel. Puoi poi assegnargli separatamente il ruolo superadmin. Non vengono inviati inviti o creati account Google.

`BACARODEX_ALLOWED_EMAILS` è una lista iniziale: l’accesso effettivo unisce queste email alle aggiunte dell’interfaccia ed esclude quelle rimosse dall’interfaccia. Solo `BACARODEX_SUPERADMIN_EMAILS` dà accesso permanente e non revocabile dall’app. Le autorizzazioni e le nomine sono salvate nel documento `bacaroGameConfigurations/superadmins`, con i campi `allowedEmails`, `blockedEmails` ed `emails` (ruoli delegati). I documenti esistenti restano compatibili senza migrazione.

**Rimuovi accesso** blocca anche le sessioni già aperte alla richiesta successiva e rimuove l’eventuale ruolo delegato. Autorizzare di nuovo quell’email non ripristina automaticamente il ruolo superadmin. Le registrazioni dei Bacari restano nel gioco e possono essere gestite dagli altri superadmin. L’ultimo superadmin effettivo non può essere privato dell’accesso o del ruolo dall’interfaccia. Nessun utente viene nominato automaticamente. Il server ricontrolla la lista di accesso e i privilegi; un errore di lettura del database non concede accesso e non cancella un cookie di sessione valido.

Per aggiungere più persone, scegli **Un’altra persona** nel modulo di registrazione. Occorre informare la persona e raccogliere il suo consenso esplicito al riconoscimento nel gioco pubblico, poi confermarlo nel modulo. Le schede ricevono ID distinti; vengono registrati UID dell’operatore, modalità e data del consenso. La foto viene scartata come nel flusso personale. La persona senza account può chiedere a un superadmin di eliminare la sua scheda per ritirare la partecipazione. I superadmin possono eliminare tutte le registrazioni, comprese quelle dei membri; i membri normali conservano la gestione della propria. La revoca di un superadmin non elimina le persone che ha registrato.

Nessuna email viene promossa automaticamente: senza una lista permanente iniziale (o nomine già esistenti), non c’è un superadmin. I ruoli non sono assegnati al primo utente che accede.

Verifica dei ruoli e delle API: `npm run test:superadmins`. I test API usano le route reali e una persistenza in memoria al posto di Firebase; non modificano il database cloud.

## Registrazione dei membri e consenso

Per i membri normali, una registrazione per account autorizzato, documento `bacarodexMembers/{uid}`: nome, Pokémon scelto, descrittore MobileFace, versione del modello, data e versione del consenso. Due membri possono scegliere lo stesso Pokémon. Ogni membro normale elimina solo la propria registrazione; i superadmin possono aggiungere altre persone consenzienti ed eliminare qualsiasi registrazione. Il pubblico non può registrare/modificare/eliminare membri.

La registrazione richiede un volto solo e consenso esplicito all’uso nel **gioco pubblico senza login** (`public-game-v2`). Le registrazioni create col precedente consenso limitato agli amici **restano private e sono escluse dal gioco pubblico**: il membro deve eliminarle e registrarsi nuovamente. Nessun cambio di consenso o migrazione automatica.

I descrittori registrati restano sul server: **non esiste un endpoint pubblico per scaricarli**. Il browser del giocatore estrae il descrittore dalla nuova foto e lo invia, con consenso, per un confronto temporaneo sul server; non viene salvato né loggato. La fotografia non lascia il browser. I descrittori non sono dati anonimi. Il login del membro da solo non crea una registrazione biometrica.

Ritirare il consenso elimina la registrazione e impedisce nuove scansioni/risposte di quel tentativo. Le catture già salvate nei browser dei giocatori non possono essere richiamate dal server: il consenso lo dichiara.

## Flusso del giocatore

QR → pagina `/#/bacarodex` → nuova foto di un membro consenziente → estrazione locale con Human → confronto server → quattro Pokémon → risposta → cattura salvata sul dispositivo. Nessuna identità Firebase anonima o account viene creato per il giocatore.

Il server usa il modulo ufficiale `src/face/match.ts` di Human 3.3.6, incluso tramite alias Vite `human-match`, senza caricare TensorFlow nativo o modelli di inferenza sul server. Il confronto è quello di `human.match.similarity`. Soglia **0.60** e margine **0.08** in `src/lib/server/game.ts`, da calibrare con foto reali; [documentazione Human](https://github.com/vladmandic/human/wiki/Embedding). Similarità non significa probabilità certa.

Il quiz restituisce quattro opzioni e un token AES-256-GCM cifrato/autenticato, valido cinque minuti, che non rivela membro o soluzione. Nome e Pokémon associato sono restituiti solo alla risposta corretta; un tentativo viene rifiutato se il membro è eliminato o registrato di nuovo. Le risposte errate sono ripetibili. I distrattori vengono da PokéAPI, non dagli altri membri, quindi basta un membro.

Le catture sono uniche per ID del membro e salvate in `localStorage` (`bacarodex-guest-captures-v1`): sopravvivono al refresh, ma non si sincronizzano tra telefoni/browser. Pulsante per azzerarle. Non sono conservati foto o descrittori nella collezione. La precedente collezione legata all’account non viene importata nel gioco pubblico.

## Foto, asset e limiti

Foto temporanee in RAM, massimo 1024 px prima dell’inferenza. Camera con pulsante, solo video, frontale/posteriore, chiusura al cambio sezione/background; upload alternativo. HTTPS o localhost richiesti per la camera.

Human 3.3.6 lazy, BlazeFace + FaceMesh + MobileFace, stessa configurazione in registrazione e gioco. FaceRes/età/genere/emozioni disattivati. `npm run models` verifica manifest, pesi e SHA-256 in `public/models`; fonti e licenze adiacenti, asset inclusi nella build. PokéAPI e sprite richiedono rete per ciò che non è in cache. IndexedDB rimane per cache Pokémon; il vecchio database locale `bacarodex` non viene modificato né caricato sul server.

Demo volontaria, non autenticazione, anti-spoofing o sistema anti-cheat. Prima di un utilizzo pubblico effettivo restano calibrazione con volontari, prove sui telefoni, valutazione privacy e protezioni anti-abuso/costi sull’hosting. Il QR non è una password: il gioco è accessibile a chiunque conosca il link. Nessun analytics o log di payload biometrici.

Verifiche effettivamente eseguite e prove ancora necessarie in [IMPLEMENTAZIONE.md](IMPLEMENTAZIONE.md).

Per modifiche e verifiche del Game Center, vedi [IMPLEMENTAZIONE_GAMECENTER.md](IMPLEMENTAZIONE_GAMECENTER.md). Il report precedente di Bacarodex rimane separato.
