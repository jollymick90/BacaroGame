# BacaroTech Game Center

Una raccolta di piccoli giochi nello stesso progetto SvelteKit + TypeScript + Vite. Home e giochi pubblici non richiedono account.

- **`/` — Game Center**: scegli Bug Hunter, Merge Battle, Bacarodex o Are You an AI?. Bacarodex mostra la disponibilità dei membri registrati; gli altri giochi non richiedono la registrazione. La radice `/` apre la home.
- **`/bacarodex` — Bacarodex pubblico**: riconosci un membro consenziente e indovina il Pokémon. Le catture sono salvate sul dispositivo. Registrazione membri e confronto richiedono Firebase.
- **`/are-you-an-ai` — Are You an AI?**: parodia dei CAPTCHA con intro, tre rompicapi e certificato finale. Testi prefissati e stato in memoria: nessuna AI reale, API, fotocamera o persistenza del gioco. Funziona anche senza configurare Firebase.
- **`/merge-battle` — Merge Battle**: battaglie illustrate single player o 1 vs 1 locale. Di default contano solo Rapidità e Solidità. In Admin → Merge Battle → Parametri dello scontro puoi attivare da uno a quattro parametri; quelli esclusi sono nascosti e non danno punti. Il confronto mostra valore × peso e totale delle due carte.
- **`/bug-hunter` — Bug Hunter**: runner Three.js con quattro specie di insetti, ostacoli, retino e cuori con quiz. Giocabile senza account; domande configurabili in admin.
- **`/admin` — area membri Bacarodex**: solo gli account Google della lista autorizzata possono registrare se stessi, scegliere il Pokémon e ritirare la propria partecipazione. Include il QR scaricabile diretto a Bacarodex.

I giochi sono caricati dinamicamente. Human e i modelli facciali si caricano soltanto dopo una richiesta di elaborazione in Bacarodex o nell’area membri. Navigazione nativa SvelteKit: pagine separate, rendering iniziale sul server, apertura diretta, refresh e indietro/avanti. I vecchi link `/#/nome-gioco` vengono convertiti al percorso corrispondente; gli hash legacy sconosciuti tornano alla home. Tutti i giochi hanno “Torna al Game Center”. Le vecchie stampe QR dirette alla radice aprono ora la home.

## Are You an AI?

Seleziona “Non sono un robot” e premi “Verificami, allora”. Ogni partita estrae tre prove distinte da una pool di quattro. Due indizi aiutano in ogni prova; “Ricomincia dalla prima prova” azzera il percorso mantenendo le stesse tre prove. Dopo una soluzione, leggi la battuta e premi “Continua”.

- **Chiudi tutte le finestre:** ogni X chiude visibilmente una finestra, che riappare dopo 400 ms. “Spegni” risolve il desktop simulato, senza aprire o chiudere vere finestre del browser.
- **Completa il caricamento:** cinque conferme quando appare “ORA”, da 20% ciascuna. Gli errori non cancellano progresso. Touch, Invio e Spazio; opzione senza scadenza per confermare con calma.
- **Seleziona il robot:** scegli l'assistente fuori griglia. Nessun bordo tratteggiato suggerisce la soluzione; il focus da tastiera resta visibile.
- **Un calcolo semplicissimo:** rispondere esattamente dà un certificato robot e termina anticipatamente; un errore valido permette di proseguire come umano. Input vuoto o non numerico non conta come risposta. È un trabocchetto comico, non un test reale.

Il certificato umano o robot si può scaricare come PDF A4 con il logo ufficiale BacaroTech, generato sul dispositivo. Nessun dato personale richiesto. “Riprova” torna all'intro e la partita successiva effettua un nuovo sorteggio. Nessuna AI reale, API o persistenza del gioco.

## Bug Hunter

Tre vite: ogni bug mancato o urto costa una vita, con un massimo di una penalità per riga. Dopo un urto, due secondi di protezione dagli altri ostacoli; i bug persi nelle righe successive continuano a costare vite. Corri verso gli insetti, cambia corsia e salta quelli in aria o le barriere che occupano tutte le corsie. La velocità aumenta ogni 20 secondi attivi di 2 a partire da 8, senza limite massimo; pausa, quiz e background congelano la simulazione. Oltre velocità 16 le nuove righe sono più distanziate per mantenere leggibile il percorso.

Un cuore lampeggiante compare dopo le prime quattro righe e poi ogni sei righe, senza ostacoli. Se hai meno di tre vite, raccoglierlo mette in pausa la corsa e apre una domanda semplice a tre risposte, senza timer. Una risposta corretta recupera una vita (massimo tre); errore, salto della domanda o cuore ignorato non tolgono vite. La corsa riparte solo premendo Continua; Escape lascia in pausa. A vite piene il cuore non interrompe il gioco. Il lampeggio lento rispetta la preferenza di movimento ridotto.

In **Admin → Bug Hunter** puoi modificare le 20 domande iniziali, aggiungerne altre (massimo 100), scegliere la risposta corretta e la spiegazione, oppure rimuoverle (ne deve restare almeno una). Premi **Salva domande** per pubblicare. Le modifiche vengono caricate alla prossima apertura del gioco; in caso di rete assente o configurazione non disponibile il gioco usa le 20 domande integrate. Le domande vengono estratte senza ripetizioni fino a esaurimento del gruppo.

Le abilità si attivano automaticamente: 50 Heisenbug attraversano gli ostacoli per 8 s, 25 Regression recuperano una vita (massimo 3, oppure una cura pronta), 30 Production rallentano il mondo al 60% per 6 s, 40 Feature danno punti doppi per 10 s. Le catture fisiche e le cariche non vengono raddoppiate. Le soglie premiano le partite lunghe: con una specie ogni quattro righe, il primo bonus richiede diversi minuti. Nessun account necessario per giocare.

## Invita a giocare con il QR

Dalla home scegli **“Invita”**, oppure apri **`/qr`** sul sito pubblicato. La pagina raccoglie un grande QR in bianco e nero, la condivisione nativa quando supportata, la copia del link e il download PNG. La copia viene confermata solo quando riesce; annullare la condivisione non mostra un errore. Il codice apre la home pubblica del Game Center sullo stesso dominio e non richiede login. L'indirizzo deriva dal sito aperto, senza includere query, credenziali o percorsi amministrativi: per invitare altri dispositivi aprire la pagina sull'indirizzo HTTPS pubblico o su un indirizzo di rete raggiungibile, non su localhost.

## Bacarodex e Firebase

Il riferimento `../bacaro_interviste/svelte-firebase-bacarotechtech-interview` resta invariato. Richiede Node 22, versione 22.17 o successiva della stessa major, per l’app; gli emulatori girano in Docker.

## Avvio locale con Docker (consigliato)

```sh
npm ci
npm run dev
```

`npm run dev` (oppure `npm run dev:local`) prepara gli emulatori Firebase Docker, attende che siano pronti, crea un account locale se non esiste e avvia Vite con il progetto isolato `demo-bacarodex`. Su macOS avvia OrbStack o Docker Desktop se installato. Il primo avvio può richiedere qualche minuto per scaricare le immagini; quelli successivi riutilizzano la cache.

Apri l'indirizzo mostrato da Vite, normalmente **http://127.0.0.1:5173**, e poi **`/admin`**. Account già predisposto:

- Email: **`dev@bacarotech.local`**
- Password: **`bacarodev123`**
- Ruolo: **superadmin locale**

Se cambi la password dell’account nella console emulatori, usa quella nuova: lo script conserva gli account esistenti e non reimposta le password.

Premi **Accedi agli emulatori**, scegli Bacarodex e registra la tua foto e il Pokémon. Il database locale è indipendente dal sito pubblico: le registrazioni cloud non vengono importate. Il gioco mostra “Nessun membro…” finché non registri qualcuno in locale. Puoi anche creare altri account dal modulo di sviluppo; solo l'account predisposto ha il ruolo superadmin permanente locale.

Non serve copiare o modificare `.env`: lo script imposta le variabili demo soltanto per il processo di sviluppo e ignora le credenziali cloud. Docker Compose legge esplicitamente `.env.emulator.example`, quindi un `.env` cloud non interferisce con l'avvio. Serve Docker con Compose v2; Java e Firebase CLI sono nel container. Le porte Auth/Firestore/UI sono pubblicate solo su 127.0.0.1. Porte dedicate: Auth **9199**, Firestore **8180**, console **4100**, websocket **9250**, per convivere con emulatori di altri progetti. Console Firebase locale: **http://127.0.0.1:4100**.

```sh
npm run firebase:logs  # log del servizio
npm run firebase:down  # arresto con esportazione dei dati
npm run firebase:up    # riavvio con importazione dei dati salvati
npm run dev:cloud      # Vite con le impostazioni .env, senza avvio automatico degli emulatori
```

Chiudere Vite lascia gli emulatori attivi. I dati vengono esportati in `.firebase/emulator-data/export` all'arresto con `npm run firebase:down` e reimportati all'avvio. La cartella è ignorata da Git e dal contesto Docker: non cancellarla se vuoi conservare le registrazioni. Un arresto forzato può perdere le ultime modifiche. Dopo il riavvio può essere necessario accedere di nuovo.

`npm run dev:cloud` è il comando esplicito per lavorare sul Firebase reale configurato nel `.env` (con `PUBLIC_FIREBASE_USE_EMULATORS=false`, credenziali Admin e segreto del gioco). Build e deploy continuano a usare le proprie variabili cloud; la configurazione demo e il relativo account non vengono abilitati in produzione.

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

In `/admin`, il QR viene generato per `/bacarodex`, così apre direttamente Bacarodex. Il link generale del Game Center rimane la radice del sito. Per l’uso da telefono inserisci il vero indirizzo HTTPS raggiungibile dal telefono, non localhost. Puoi scaricare il PNG e stamparlo. Per giocare non serve conoscere il link dell’area membri.

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

QR → pagina `/bacarodex` → nuova foto di un membro consenziente → estrazione locale con Human → confronto server → quattro Pokémon → risposta → cattura salvata sul dispositivo. Nessuna identità Firebase anonima o account viene creato per il giocatore.

Il server confronta i descrittori MobileFace a 256 valori tramite similarità coseno, indipendente dalla loro ampiezza, in `src/lib/server/face-match.ts`. La soglia è **0.50** e il margine minimo tra i primi due candidati è **0.08**. Questo evita la falsa parità introdotta dalla normalizzazione predefinita di `human.match.similarity` su vettori di scala diversa: in un test riproducibile restituiva 1 sia per vettori identici sia per vettori ortogonali. Due registrazioni realmente troppo vicine restano ambigue; il messaggio mostra il distacco senza rivelarne l'identità. Soglia e margine vanno calibrati con foto reali: il punteggio non è una probabilità di identità né una percentuale di accuratezza. Non serve registrarsi nuovamente: i descrittori esistenti restano compatibili.

Il quiz restituisce quattro opzioni e un token AES-256-GCM cifrato/autenticato, valido cinque minuti, che non rivela membro o soluzione. Nome e Pokémon associato sono restituiti solo alla risposta corretta; un tentativo viene rifiutato se il membro è eliminato o registrato di nuovo. Le risposte errate sono ripetibili. I distrattori vengono da PokéAPI, non dagli altri membri, quindi basta un membro.

Le catture sono uniche per ID del membro e salvate in `localStorage` (`bacarodex-guest-captures-v1`): sopravvivono al refresh, ma non si sincronizzano tra telefoni/browser. Pulsante per azzerarle. Non sono conservati foto o descrittori nella collezione. La precedente collezione legata all’account non viene importata nel gioco pubblico.

## Foto, asset e limiti

Dopo aver scattato o caricato una foto, **Mostra punti del volto** visualizza il riquadro e i landmark FaceMesh effettivamente rilevati. La funzione è disponibile sia nella registrazione sia nel gioco. **Vedi embedding del volto (256 valori)** espande il descrittore numerico dello scatto: i punti mostrano la geometria, mentre il descrittore riassume le caratteristiche usate nel confronto. L'analisi si avvia su richiesta, resta sul dispositivo e non aggiunge punti o fotografie alle richieste al server. Nascondere i punti, rimuovere/cambiare la foto o uscire elimina l'anteprima.

Foto temporanee in RAM, massimo 1024 px prima dell’inferenza. Camera con pulsante, solo video, frontale/posteriore, chiusura al cambio sezione/background; upload alternativo. HTTPS o localhost richiesti per la camera.

Human 3.3.6 lazy, BlazeFace + FaceMesh + MobileFace, stessa configurazione in registrazione e gioco. FaceRes/età/genere/emozioni disattivati. `npm run models` verifica manifest, pesi e SHA-256 in `public/models`; fonti e licenze adiacenti, asset inclusi nella build. PokéAPI e sprite richiedono rete per ciò che non è in cache. IndexedDB rimane per cache Pokémon; il vecchio database locale `bacarodex` non viene modificato né caricato sul server.

Demo volontaria, non autenticazione, anti-spoofing o sistema anti-cheat. Prima di un utilizzo pubblico effettivo restano calibrazione con volontari, prove sui telefoni, valutazione privacy e protezioni anti-abuso/costi sull’hosting. Il QR non è una password: il gioco è accessibile a chiunque conosca il link. Nessun analytics o log di payload biometrici.

Verifiche effettivamente eseguite e prove ancora necessarie in [IMPLEMENTAZIONE.md](IMPLEMENTAZIONE.md).

Per modifiche e verifiche del Game Center, vedi [IMPLEMENTAZIONE_GAMECENTER.md](IMPLEMENTAZIONE_GAMECENTER.md). Il report precedente di Bacarodex rimane separato.

## Cache e letture Firebase

Il layout `src/routes/(game-center)/+layout.ts` carica insieme le impostazioni pubbliche tramite `GET /api/game-center/config`. La prima apertura le include nell’HTML SSR; l’idratazione non ripete la richiesta. Durante la navigazione fra home e giochi, SvelteKit riusa il layout e i suoi dati. Entrando da `/admin` o `/qr` viene eseguita una sola richiesta condivisa. I giochi mantengono chunk separati; Three.js e Human restano lazy.

Merge Battle e Bug Hunter condividono cache server da 60 secondi per istanza, aggiornate dopo un salvataggio autorizzato. Gli editor invalidano anche eventuali pre-caricamenti del router. Una lettura bloccata scade dopo tre secondi: Merge Battle mostra un errore recuperabile; Bug Hunter conserva le domande predefinite. Il GET dell’editor Bug Hunter legge la revisione corrente senza cache.

Il riuso segue il [ciclo di caricamento dei layout SvelteKit](https://svelte.dev/docs/kit/load#Rerunning-load-functions).

I dati del layout restano uno snapshot finché si rimane nel Game Center: per acquisire modifiche fatte da un’altra scheda occorre ricaricare oppure uscire e rientrare. Un refresh completo ricrea il browser e rilegge attraverso la cache server; non conserva la partita in corso. Su istanze server diverse un salvataggio può essere visibile solo alla scadenza dei 60 secondi. Non è una cache distribuita né una persistenza offline. Disponibilità membri (`/api/play`), riconoscimento e dati privati mantengono flussi separati.

Il conteggio di `GET /api/play` usa un’aggregazione Firestore ed è conservato per 60 secondi. Anche `GET /api/merge-battle/config` usa una cache di 60 secondi, aggiornata sull’istanza che salva il catalogo. Richieste simultanee condividono la lettura in corso; gli errori non vengono conservati. Le risposte HTTP restano `private, no-store`.

L’elenco membri è condiviso sul server tra scansioni e area membri per 60 secondi. Ogni utilizzo legge prima `bacaroGameConfigurations/members-version`: registrazioni, cancellazioni e modifiche alle catture legacy aggiornano questo documento nella stessa transazione dei membri. Un cambio di versione forza il caricamento anche sulle altre istanze Vercel. Nei database esistenti, l’assenza del documento rappresenta la versione iniziale; il primo cambiamento tramite l’app crea il documento automaticamente. Non serve una migrazione preventiva.

La cache contiene i documenti dei membri, inclusi i descrittori registrati, esclusivamente in memoria sul server. I descrittori inviati dai giocatori non vengono conservati. Prima di creare un tentativo il server rilegge il membro riconosciuto e verifica partecipazione, modello e data di registrazione; ogni risposta al quiz verifica ancora il documento attuale. Le modifiche fatte direttamente da console o da altri script devono aggiornare anche la versione per invalidare subito l’elenco; altrimenti l’elenco si rinnova alla scadenza. La verifica puntuale blocca comunque un membro eliminato o con consenso ritirato.

I controlli dei permessi condividono una lettura per richiesta HTTP; ogni nuova richiesta li rilegge. Le transazioni verificano sempre i permessi nel database. Le API pubbliche del gioco, incluse le configurazioni condivise, non verificano la sessione amministrativa. Firebase Authentication usa chiamate proprie e non alimenta il contatore delle letture Firestore.

Su Vercel la memoria resta per singola istanza: riavvii, scadenze e versioni nuove causano un nuovo caricamento. La verifica della versione è condivisa tramite Firestore, non la memoria della cache. Non vengono serviti dati se la verifica della versione fallisce. Il conteggio può restare indietro di 60 secondi; la configurazione Merge Battle può fare altrettanto sulle altre istanze.

### Inventario delle letture (18 ottobre 2026)

`N` indica i membri letti (massimo 201 per l’elenco amministrativo, con limite applicativo di 200 registrazioni). I numeri descrivono le operazioni applicative; retry delle transazioni, nuove istanze e quote delle aggregazioni vanno considerati separatamente.

| Percorso | Prima | Dopo |
| --- | --- | --- |
| `GET /api/play` | Fino a 200 documenti a ogni scadenza della cache | Un’aggregazione alla scadenza, nessuna lettura durante i 60 secondi |
| `POST /api/play/scan` | Fino a 200 documenti a ogni scansione | Cache valida: 1 versione + 1 membro riconosciuto; cache assente/scaduta/modificata: anche N documenti |
| `GET /api/bacarodex` | N documenti + controlli permessi duplicati | 1 versione + N solo se cache da ricaricare; 1 lettura permessi per richiesta |
| `POST /api/bacarodex/members` | Documento candidato + fino a 200 documenti per il limite + permessi | Documento candidato + aggregazione transazionale per il limite + permessi; 1 scrittura aggiuntiva della versione |
| `DELETE /api/bacarodex/members` | Controlli permessi | Controlli permessi; 1 scrittura aggiuntiva della versione |
| `POST /api/play/answer` | 1 documento per risposta | 1 documento attuale per verificare ritiro o nuova registrazione |
| `GET /api/merge-battle/config` | Già in cache 60 secondi | Cache confermata; eliminato il controllo sessione sulle richieste pubbliche |
| `PUT /api/merge-battle/config` | Lettura transazionale della revisione | Lettura attuale per prevenire salvataggi concorrenti |
| `GET /api/bacarodex/superadmins` | Hook e route leggono entrambi i permessi | Una lettura condivisa nella richiesta |
| `PATCH /api/bacarodex/superadmins`, `/access` | Lettura dei permessi nella transazione | Lettura transazionale mantenuta, oltre al controllo di accesso della richiesta |
| `POST /api/bacarodex/captures` (legacy) | 1 membro nella transazione | Come prima, con aggiornamento atomico della versione se cambia |
| `DELETE /api/bacarodex/data` (legacy) | Fino a 201 documenti nella transazione | Come prima: serve individuare e cancellare tutte le catture dell’utente; aggiorna la versione |
| Login e hook delle pagine private | Verifica Auth e permessi | Verifica Auth e permessi, con deduplicazione dei permessi nella richiesta |

Non risultano polling Firestore o listener realtime nel client di BacaroGame. Le letture partono dall’ingresso nei giochi/pannelli, dalle scansioni e dalle azioni dell’utente. Test cache: `node --experimental-strip-types --test src/lib/server/ttl-cache.test.ts src/lib/server/versioned-cache.test.ts`. Test API e revoche: `npm run test:superadmins`.

La revisione grafica e le verifiche del 20 ottobre 2026 sono documentate in [REPORT_UX_UI_GAMECENTER.md](REPORT_UX_UI_GAMECENTER.md).
