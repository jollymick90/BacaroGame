# Pubblicare il BacaroTech Game Center con Firebase e Vercel

Questa guida pubblica la POC **BacaroGame**, usando come riferimento il progetto delle interviste in `/Users/jollymick/SProject/Bacarotech/bacaro_interviste/svelte-firebase-bacarotechtech-interview`.

Il risultato è un indirizzo HTTPS del Game Center con quattro giochi e un'area `/admin` per registrare i membri di Bacarodex. La configurazione necessaria è già nel codice: occorre preparare Firebase, impostare le variabili su Vercel e pubblicare.

## 1. Capire dove gira ogni parte

```text
Browser
  ├─ Home, Are You an AI?, Merge Battle, Bug Hunter
  │    └─ file e giochi serviti da Vercel, logica nel browser
  ├─ Login Google nell'area /admin
  │    └─ Firebase Authentication → token → /api/session su Vercel
  └─ Bacarodex e area membri
       └─ API SvelteKit su Vercel
            └─ Firebase Admin SDK → Cloud Firestore
```

**Il backend applicativo gira su Vercel.** Firebase fornisce identità e database. Non serve un secondo server, né distribuire Cloud Functions o Firebase Hosting. Docker e gli emulatori servono soltanto allo sviluppo locale.

| Funzione | Servizi necessari |
| --- | --- |
| Home e tre giochi Are You an AI?, Merge Battle, Bug Hunter | Vercel |
| Login e registrazione membri Bacarodex | Vercel, Firebase Authentication, Firestore |
| Riconoscimento e quiz pubblico Bacarodex | API su Vercel e membri registrati in Firestore |
| Foto e modelli di riconoscimento | Foto elaborate nel browser; modelli serviti dal sito |
| Collezione catture del giocatore | `localStorage` del suo browser |

Le foto non vengono archiviate su Firebase Storage. Il database contiene invece i descrittori facciali dei membri consenzienti. Pokémon e sprite richiedono anche accesso a PokéAPI e ai relativi asset.

## 2. Cosa riprendere dal progetto delle interviste

Entrambi i progetti utilizzano SvelteKit, `@sveltejs/adapter-vercel`, Firebase Web SDK e Firebase Admin SDK. Nel Game Center questi file sono già pronti:

- [svelte.config.js](svelte.config.js): adapter Vercel, runtime Node 22, cartella asset `public`.
- [firebase-admin.server.ts](src/lib/firebase/firebase-admin.server.ts): credenziali private e accesso server a Firebase.
- [firebase.client.ts](src/lib/firebase/firebase.client.ts): login Google nel browser.
- [.env.example](.env.example): nomi delle variabili da configurare.
- [firestore.rules](firestore.rules): protezione dell'archivio Bacarodex.

**Non copiare tutto il `.env` delle interviste.** La corrispondenza utile è questa:

| Progetto interviste | Game Center | Significato |
| --- | --- | --- |
| `PUBLIC_FIREBASE_ADMIN_KEY` | `PUBLIC_FIREBASE_API_KEY` | Chiave Web pubblica `apiKey`, NON credenziale Admin |
| `PUBLIC_FIREBASE_AUTH_DOMAIN` | Stesso nome | Dominio Firebase Authentication |
| `PUBLIC_FIREBASE_PROJECT_ID` | Stesso nome | ID progetto Firebase |
| `FIREBASE_ADMIN_KEY` | Stesso nome | Intero JSON privato del service account |
| `ADMIN_EMAILS_LIST` | `BACARODEX_ALLOWED_EMAILS` | Elenco email autorizzate, configurato separatamente |
| Nessun equivalente richiesto | `BACARODEX_GAME_SECRET` | Segreto per cifrare i tentativi del quiz |

Le variabili Messaging, Storage, Analytics, `ADMIN_PASSWORD` e `PUBLIC_BASE_URL` delle interviste non servono al Game Center. Non trasferire il service worker delle notifiche o gli scope Google aggiuntivi: qui basta il login Google già implementato.

## 3. Preparare il progetto Firebase

La destinazione scelta è il Firebase già usato dalle interviste:

```text
PUBLIC_FIREBASE_PROJECT_ID=bacarotech-interview
PUBLIC_FIREBASE_AUTH_DOMAIN=bacarotech-interview.firebaseapp.com
PUBLIC_FIREBASE_USE_EMULATORS=false
```

Questi identificatori pubblici sono stati verificati nella configurazione locale delle interviste. `PUBLIC_FIREBASE_API_KEY` deve contenere la `apiKey` Web dello stesso progetto (nel riferimento ha il nome storico `PUBLIC_FIREBASE_ADMIN_KEY`). Mantieni il service account nella configurazione privata Vercel e definisci separatamente la lista membri Bacarodex.

Il [registro delle collezioni condivise](COLLEZIONI_FIREBASE.md) elenca i sei nomi riservati forniti nello screenshot e la sola collezione consentita a BacaroGame. La build controlla gli accessi ai percorsi registrati.

Il codice delle interviste usa, fra le altre, le collezioni `slots`, `speakers`, `change_requests` e `fcm_tokens`; il Game Center usa `bacarodexMembers`. Le collezioni non si sovrappongono, ma progetto, utenti Authentication e quote sono condivisi. Nel repository delle interviste non sono presenti file di regole Firestore: le regole effettive devono essere verificate in console prima della pubblicazione. Non eseguire un deploy completo del solo `firestore.rules` del Game Center sul progetto condiviso: sostituirebbe il ruleset attivo. Integra soltanto la protezione di `bacarodexMembers` preservando gli accessi necessari alle interviste, come descritto sotto.

### Creare l'app Web

1. Apri la console Firebase e seleziona il progetto.
2. In **Impostazioni progetto → Generali → Le tue app**, registra un'app **Web** se manca, ad esempio `BacaroTech Game Center`.
3. Dalla configurazione Web annota `apiKey`, `authDomain` e `projectId`.
4. Mantieni `authDomain` come fornito da Firebase, normalmente `PROJECT_ID.firebaseapp.com`: il dominio Vercel verrà autorizzato separatamente.

Tutti i valori client e il service account devono riferirsi allo stesso progetto Firebase. `demo-bacarodex` è il progetto degli emulatori: non usarlo per il cloud.

### Abilitare login Google

In **Authentication → Sign-in method**, abilita **Google**, scegli l'email di supporto e salva. Non serve abilitare Email/Password per questa versione cloud: il modulo email/password è riservato agli emulatori.

Dopo il deploy aggiungerai l'hostname effettivo del sito ai domini autorizzati. Il flusso attuale usa `signInWithPopup`. [Documentazione Firebase Google Sign-In](https://firebase.google.com/docs/auth/web/google-signin).

### Creare Firestore

In **Firestore Database**, crea il database **Standard**, ID **`(default)`**, scegliendo la modalità di produzione e la regione adatta al pubblico dell'evento. Il codice usa `getFirestore(app)` senza specificare un database alternativo: un database con un altro nome non verrà usato. Se il database esiste già, mantienilo.

Non devi creare documenti a mano: la registrazione da `/admin` crea `bacarodexMembers/{uid}`. [Avvio Firestore](https://firebase.google.com/docs/firestore/quickstart).

### Impostare le regole

Per un progetto dedicato alla POC, pubblica il contenuto di [firestore.rules](firestore.rules) dalla scheda **Rules** di Firestore. Il blocco specifico è:

```text
match /bacarodexMembers/{document=**} {
  allow read, write: if false;
}
```

I browser non leggono direttamente questa collezione. Le API autorizzano le richieste e accedono tramite Admin SDK: i client server usano IAM e bypassano le Firestore Security Rules. Quindi questo blocco non impedisce al backend di funzionare. [Regole Firestore e accessi server](https://firebase.google.com/docs/firestore/security/get-started).

**Se riusi Firebase delle interviste:** integra il blocco nelle regole già esistenti, dentro `match /databases/{database}/documents`, senza sostituire l'intero file di produzione. Controlla anche eventuali regole generali: un `allow` permissivo su un percorso sovrapposto può autorizzare l'accesso a `bacarodexMembers` nonostante il blocco sopra. L'accesso diretto del browser a questa collezione deve risultare negato anche a utenti autenticati.

### Ottenere la credenziale server

In **Impostazioni progetto → Account di servizio → Firebase Admin SDK**, genera e scarica una chiave privata per il progetto scelto. Il file JSON è il valore di `FIREBASE_ADMIN_KEY`. Conserva il file fuori dalla cartella del repository e non inserirlo in una variabile `PUBLIC_`. Questa è la modalità supportata dall'implementazione attuale per autenticare il server esterno a Firebase. [Configurazione Admin SDK](https://firebase.google.com/docs/admin/setup).

Sul Mac puoi copiare negli appunti il JSON compatto, senza mostrarlo nel terminale; sostituisci il percorso con quello del file scaricato:

```sh
python3 -c 'import json,sys; print(json.dumps(json.load(sys.stdin), separators=(",",":")))' \
  < "$HOME/Downloads/service-account.json" | pbcopy
```

Incollalo nel campo **Value** della variabile Vercel. Deve iniziare con `{` e finire con `}`: non aggiungere `FIREBASE_ADMIN_KEY=`, apici esterni, backtick o virgolette tipografiche. La stringa `private_key` deve conservare gli escape JSON `\n`; non modificarla manualmente. Il Game Center usa `JSON.parse` direttamente, senza la normalizzazione delle virgolette presente nel progetto interviste.

## 4. Preparare le sette variabili Vercel

In Vercel configura questi valori nell'ambiente **Production** del nuovo progetto:

| Nome esatto | Valore da inserire | Esposizione |
| --- | --- | --- |
| `PUBLIC_FIREBASE_API_KEY` | `apiKey` della configurazione Web | Pubblica |
| `PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` della configurazione Web | Pubblica |
| `PUBLIC_FIREBASE_PROJECT_ID` | ID del progetto cloud | Pubblica |
| `PUBLIC_FIREBASE_USE_EMULATORS` | `false` | Pubblica |
| `FIREBASE_ADMIN_KEY` | JSON compatto del service account | Privata server |
| `BACARODEX_ALLOWED_EMAILS` | Es. `tu@example.com,collega@example.com` | Privata server |
| `BACARODEX_GAME_SECRET` | Segreto casuale, almeno 32 caratteri | Privata server |

Genera il segreto del quiz e copialo nel suo campo:

```sh
openssl rand -hex 32 | pbcopy
```

Questo produce 64 caratteri esadecimali. Generane uno e mantienilo tra i deploy; cambiarlo invalida i tentativi del quiz ancora aperti, non le registrazioni.

La lista email autorizza i **membri che accedono a `/admin`**, non i giocatori pubblici. Inserisci gli indirizzi degli account Google che userete davvero; il server richiede email verificate. La lista vuota lascia l'accesso cloud non configurato.

Su Vercel non impostare `FIREBASE_AUTH_EMULATOR_HOST` o `FIRESTORE_EMULATOR_HOST`. Se esistono da una configurazione precedente, rimuovile: il backend rifiuta gli host emulatori in modalità cloud.

Per le **Preview** configura un ambiente di prova separato, oppure lascia Firebase non configurato e prova solo i tre giochi locali. Una preview collegata allo stesso Firebase di produzione legge e modifica gli stessi dati. Dopo ogni modifica delle variabili avvia un nuovo deploy: il deployment già esistente non viene aggiornato automaticamente. [Variabili Vercel](https://vercel.com/docs/environment-variables), [applicazione delle modifiche](https://examples.vercel.com/kb/guide/how-to-add-vercel-environment-variables).

## 5. Pubblicare su Vercel

Il percorso scelto è **caricamento su GitHub e creazione di un nuovo progetto Vercel**, mantenendo Firebase `bacarotech-interview`.

Il caricamento su GitHub da solo non configura Vercel: al primo avvio importa il repository con **Add New → Project**, autorizza Vercel ad accedervi e configura le sette variabili. Dopo il collegamento, i push sul branch di produzione selezionato in Vercel (tipicamente `main`) avviano automaticamente nuovi deployment. Le altre branch possono generare preview, che hanno variabili e autorizzazioni di dominio proprie.

Sequenza per questa POC:

1. Carica il codice su GitHub, escludendo `.env`, dati emulatori e chiavi private. Includi `package-lock.json`, `.nvmrc`, `.vercelignore`, `scripts/` e gli asset dell'app.
2. Crea un **nuovo** progetto Vercel importando quel repository.
3. Seleziona la directory del Game Center, preset **SvelteKit**, Node **22.x**, installazione `npm ci`, build `npm run build`, output automatico.
4. Inserisci in **Production** le sette variabili del capitolo 4, con il Firebase condiviso scelto. Non importare in blocco le variabili dell'app interviste.
5. Esegui il primo deploy e aggiungi il nuovo hostname ai domini autorizzati Firebase Authentication.
6. Verifica le regole Firestore condivise e completa il collaudo del capitolo 7 prima di distribuire il link.
7. Per gli aggiornamenti successivi, invia le modifiche al branch di produzione. Se cambi soltanto variabili nella dashboard, avvia un redeploy.


### Controlli locali

Dalla cartella del Game Center:

```sh
cd /Users/jollymick/SProject/Bacarotech/BacaroGame
npm ci
npm run check
npm run test:merge-battle
npm run test:bug-hunter
npm run build
```

Non serve modificare il `.env` locale per preparare le variabili cloud su Vercel. Non sovrascrivere la configurazione emulatori se vuoi continuare a usarla sul computer.

Il build esegue già `npm run models`: verifica e, quando necessario, recupera i modelli facciali in `public/models`. Devono essere disponibili anche online. Non cambiare il comando in `vite build` da solo.

### Percorso A tramite repository Git

1. Metti il Game Center in un repository Git accessibile al tuo account Vercel. Il repository può essere privato.
2. In Vercel seleziona **Add New → Project** e importa quel repository.
3. Imposta **Root Directory** sulla cartella che contiene `package.json` e `svelte.config.js` del Game Center. Se il repository contiene soltanto questo progetto, è la radice; se contiene tutto Bacarotech, scegli `BacaroGame`.
4. Configura i campi sotto e aggiungi le sette variabili prima del deploy.
5. Premi **Deploy**.

| Impostazione | Valore |
| --- | --- |
| Framework Preset | **SvelteKit**, non Vite |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | Lascia il valore automatico del preset, senza override |
| Node.js | **22.x**, coerente con `runtime: 'nodejs22.x'` nel codice |

**Node è già allineato:** [package.json](package.json) dichiara `^22.17.0`, l'adapter usa `nodejs22.x` e `.nvmrc` indica `22`. Mantieni **22.x** anche nella dashboard Vercel. Il campo `engines` può prevalere sulla versione impostata nella dashboard. [Selezione della versione Node su Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

L'adapter esistente genera `.vercel/output` e include le API nel runtime Node. Non scegliere `public` o `dist` come sito statico e non aggiungere una rewrite generale verso `index.html`. L'integrazione full-stack è quella documentata da [Vercel per SvelteKit](https://vercel.com/docs/frameworks/full-stack/sveltekit).

Assicurati che il repository contenga sorgenti, lockfile, configurazioni, script e asset richiesti; escludi `.env`, chiavi private e `.firebase/`. Il `.gitignore` attuale esclude `.env` e i dati emulatori; `.vercelignore` esclude inoltre questi file dall’upload CLI, insieme a Docker e test browser, ma un JSON credenziali salvato con un nome arbitrario potrebbe non essere escluso: tienilo fuori dal progetto.

### Percorso B tramite CLI senza collegare Git

Puoi pubblicare anche dalla cartella locale. Questi comandi sono istruzioni da eseguire quando sei pronto a creare il progetto/deployment:

```sh
cd /Users/jollymick/SProject/Bacarotech/BacaroGame
npx vercel login
npx vercel link
```

Durante il collegamento crea un progetto Vercel per il Game Center, nello scope/account corretto. Aprilo poi nella dashboard e imposta preset, Node e variabili come sopra. Infine:

```sh
npx vercel --prod
```

La [procedura CLI ufficiale](https://vercel.com/docs/projects/deploy-from-cli) descrive collegamento e pubblicazione. Il percorso Git automatizza i deploy successivi; con CLI ripeti il comando dalla versione locale che intendi pubblicare. In entrambi i casi distribuisci la stessa applicazione SvelteKit.

## 6. Autorizzare il dominio e provare il login

Dopo il deploy avrai un dominio, per esempio `bacarotech-game-center.vercel.app`.

1. In Firebase apri **Authentication → Settings → Authorized domains**.
2. Aggiungi l'hostname esatto, senza `https://` e senza percorsi: `bacarotech-game-center.vercel.app`.
3. Se configuri un dominio personalizzato su Vercel, aggiungi anche quello.
4. Mantieni `PUBLIC_FIREBASE_AUTH_DOMAIN` al valore Firebase annotato prima.
5. Apri `https://TUO-DOMINIO/admin` e accedi con un account della lista.

Per i test usa un hostname stabile: gli URL temporanei delle preview possono cambiare e richiedere autorizzazioni aggiuntive. Se vuoi provare il login cloud anche in locale, controlla `localhost` tra i domini autorizzati: nei progetti Firebase nuovi non è sempre presente automaticamente. [Nota Firebase su localhost](https://firebase.google.com/docs/auth/faq-and-troubleshooting).

Apri il sito pubblico anche in una finestra privata: se appare un login **Vercel** prima della home, controlla **Deployment Protection** del progetto. Il dominio da condividere all'evento deve essere accessibile al pubblico; `/admin` resta protetto dal login applicativo e dalla lista email. [Protezione dei deployment Vercel](https://vercel.com/docs/deployment-protection).

## 7. Verificare il collegamento completo

Prima verifica il backend con:

```sh
curl -sS https://TUO-DOMINIO/api/play
```

Su un database vuoto ma configurato correttamente è atteso:

```json
{"available":true,"count":0}
```

`available: false` indica che mancano requisiti di configurazione: controlla tutte le variabili, lista email e lunghezza del segreto. Una risposta di errore HTTP va distinta da `available: false`: può indicare JSON Admin non valido, credenziali, permessi o database non disponibile.

Poi completa questa prova:

1. Apri la home e prova `/#/are-you-an-ai`, `/#/merge-battle`, `/#/bug-hunter`, anche entrando direttamente nell'URL.
2. Accedi a `/admin` con una delle email ammesse.
3. Registra volontariamente il tuo volto, scegli nome e Pokémon, conferma il consenso al gioco pubblico.
4. In Firestore verifica la presenza di un documento `bacarodexMembers/{uid}`. Non pubblicare schermate contenenti il descrittore.
5. Ripeti `/api/play`: dopo una registrazione valida il conteggio deve salire. Vengono contati solo i membri con modello compatibile e consenso pubblico corrente.
6. Da un telefono, senza login, apri `/#/bacarodex`, scatta una nuova foto del membro consenziente e completa il quiz.
7. Verifica che la cattura resti dopo il refresh e che la camera funzioni via HTTPS.
8. Esci dall'area membri e controlla che non sia più possibile gestire la registrazione senza accedere di nuovo.
9. Genera il QR dall'area membri usando il dominio HTTPS finale: deve aprire `/#/bacarodex`.

Gli account e le registrazioni degli emulatori **non passano automaticamente** a Firebase cloud. Per la POC registratevi nuovamente dall'URL pubblico; non caricare l'export Docker come se fosse una migrazione già predisposta.

## 8. Problemi frequenti

| Sintomo | Controllo o intervento |
| --- | --- |
| `auth/unauthorized-domain` | Autorizza in Firebase l'hostname esatto da cui stai facendo login. |
| Accesso negato dopo Google | Controlla email effettiva, verifica dell'email e `BACARODEX_ALLOWED_EMAILS` nel deployment attuale. |
| Firebase non configurato | Verifica nomi, valori e ambiente Production; ricorda il redeploy. Non usare `PUBLIC_FIREBASE_ADMIN_KEY` delle interviste. |
| Configurazione Admin non valida | Il valore deve essere JSON valido completo, senza apici esterni; controlla progetto e validità della chiave. |
| Errore creando la sessione | Controlla credenziale Admin e permessi Firebase Authentication del service account; usa lo stesso progetto del client. |
| Errore Firestore / permessi insufficienti | Verifica database `(default)`, progetto e permessi IAM del service account. Non rendere pubblica la collezione per aggirarlo. |
| Host emulatori non ammessi | Rimuovi le due variabili `*_EMULATOR_HOST` e imposta `PUBLIC_FIREBASE_USE_EMULATORS=false`. |
| Home funzionante, nessun membro riconoscibile | Controlla `/api/play`; con `count:0` registra almeno un membro da `/admin`. |
| Fotocamera indisponibile | Usa HTTPS e controlla i permessi del browser; resta disponibile l'upload. |
| Errore di download modelli in build | Controlla il log di `npm run models`, accesso alle fonti e checksum; non saltare il controllo. |
| API 404 sul sito | Controlla Root Directory, preset SvelteKit, adapter Vercel e assenza di override statici. |
| Il collega vede la schermata di login Vercel | Controlla il dominio condiviso e Deployment Protection. |

Per errori server guarda i log del deployment Vercel. L'app restituisce volutamente messaggi generici per molti errori: non aggiungere log di token, foto, JSON Admin o descrittori per diagnosticare la configurazione.

La POC usa endpoint pubblici di lettura/confronto per Bacarodex: controlla utilizzo e quote di Firestore e Vercel durante l'evento. La scansione considera al massimo 200 membri compatibili. Una pubblicazione per un pubblico più ampio richiede valutare limiti anti-abuso e calibrazione del riconoscimento.

## Stato della consegna

Questa guida descrive la configurazione ricavata dai sorgenti dei due progetti e dalla documentazione ufficiale collegata. Sono stati allineati Node e lockfile e aggiunti `.nvmrc` e `.vercelignore`. Dalla configurazione delle interviste sono stati letti solo gli identificatori pubblici del progetto e del dominio Firebase; nessuna credenziale privata è stata copiata. Non sono stati modificati servizi cloud o eseguiti deployment. La cartella locale non è ancora un repository Git e non contiene un collegamento `.vercel/project.json`: per pubblicarla occorre completare uno dei due percorsi del capitolo 5. Il collaudo Firebase/Vercel va completato sul dominio e sulle credenziali scelti con i passaggi sopra.


## Superadmin permanenti e nomine dall’interfaccia

Aggiungi su Vercel, nell’ambiente usato dal deploy, la variabile privata `BACARODEX_SUPERADMIN_EMAILS`: email Google verificate separate da virgole. Questi account possono accedere senza essere ripetuti in `BACARODEX_ALLOWED_EMAILS` e non possono essere declassati dall’app. Esegui un nuovo deploy dopo le modifiche alla configurazione.

In `/admin` apri Bacarodex e usa **Gestione superadmin** per nominare o revocare altri membri già presenti in `BACARODEX_ALLOWED_EMAILS`. Le nomine sono nel documento `bacaroGameConfigurations/superadmins`, senza nuove collezioni. Le regole client di questa collezione devono restare chiuse; l’Admin SDK verifica i permessi sul server. Non sovrascrivere le regole delle altre app nel progetto condiviso.

I superadmin possono registrare più persone scegliendo **Un’altra persona**, dopo aver raccolto il consenso esplicito descritto nel modulo; possono inoltre eliminare qualsiasi registrazione. La cancellazione permette di ritirare la partecipazione anche alle persone senza account. La modalità personale mantiene il documento con UID e il limite di una registrazione per account. Il limite complessivo resta di 200 Bacari.
