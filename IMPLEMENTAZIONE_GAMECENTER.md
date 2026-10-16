# BacaroTech Game Center — 15 ottobre 2026

## Obiettivo e base preservata

Aggiunto il Game Center al progetto SvelteKit 2 / Svelte 5 / TypeScript / Vite esistente. Il punto di partenza comprendeva già gioco Bacarodex pubblico, area membri `/admin`, Firebase e relativi emulatori Docker. Non è stato ripristinato il vecchio flusso con login obbligatorio per giocare.

Nessun nuovo progetto, router, store globale, dipendenza o framework di test. Nessun deploy, modifica cloud, migrazione di dati o cambiamento di consenso. La directory di lavoro non contiene una repository Git: nessun commit o worktree creato. Esecuzione del piano approvato in chat; backup tecnico dei sorgenti prima delle modifiche in una directory temporanea esterna al progetto.

## Modifiche

- `src/routes/+page.svelte`: monta il contenitore pubblico `src/lib/game-center/GameCenter.svelte`.
- `src/lib/game-center/GameCenterHome.svelte`: home mobile-first con cinque schede. Bacarodex e Are You an AI? giocabili; Production Is on Fire, Merge Conflict IRL e Bug Hunter presentano soltanto “In arrivo”. Nessun account, premio, classifica o progressione comune.
- Hash route `#/`, `#/bacarodex`, `#/are-you-an-ai`. Lettura iniziale e listener `hashchange`, normalizzazione dei percorsi sconosciuti con `replaceState`, compatibilità prevista con refresh, link diretti e cronologia. Gli hash non vengono letti durante SSR. Componenti dei giochi importati dinamicamente, con messaggio di caricamento, errore recuperabile e protezione contro import risolti dopo una navigazione successiva. Focus sull’intestazione dopo il cambio gioco. Link “Torna al Game Center” fuori dal componente del gioco, disponibile anche durante caricamento o errore.
- `src/lib/Play.svelte` spostato in `src/lib/games/bacarodex/Bacarodex.svelte`. Interfaccia e funzionamento del gioco pubblico conservati. Uscita: smontaggio camera, annullamento delle richieste tramite AbortController, eliminazione dello stato temporaneo e controllo dei risultati tardivi. Se l’estrazione è già in esecuzione, la libreria può terminarla: il risultato viene ignorato e non parte una successiva richiesta di scansione. Una richiesta già ricevuta dal server prima dell’annullamento può terminare sul server; nessuna risposta tardiva salva catture nel browser.
- `src/lib/player.ts`: parametro opzionale AbortSignal per le richieste, senza cambiare chiave o formato delle catture.
- `src/lib/Photo.svelte`: controlli del token di generazione anche dopo `video.play()` e decodifica dell’upload. Un’operazione terminata dopo chiusura/smontaggio non riattiva la camera o ripristina la foto.
- `src/App.svelte`: il collegamento dall’area membri apre `/#/bacarodex`. Login/logout continuano a tornare a `/admin`.
- `src/lib/ShareQr.svelte`: il QR mantiene la destinazione Bacarodex usando `/#/bacarodex`; gli URL inseriti vengono normalizzati a questa destinazione. Vecchi QR diretti a `/` aprono la home. Il PNG QR esistente rimane disponibile nell’area membri.
- README aggiornato mantenendo avvio, Docker, Firebase cloud, Vercel, dati e consenso di Bacarodex. `IMPLEMENTAZIONE.md` preservato.

### Are You an AI?

Componenti locali in `src/lib/games/are-you-an-ai/`: `AreYouAnAI.svelte`, `Robot.svelte`, `CloseWindows.svelte`, `Loading99.svelte`, `SelectRobot.svelte`.

- Intro: checkbox grande “Non sono un robot”, replica prefissata e “Verificami, allora”.
- Finestre: tre finestre sovrapposte; ogni X sostituisce una finestra senza aumentare il numero. Pulsante “Spegni” sempre nell’area del desktop simulato. Nessuna finestra reale o richiesta di permesso.
- Caricamento: 99% senza timer. Intera barra sensibile ai Pointer Events, cattura del puntatore e soglia tollerante verso destra (15% della larghezza, massimo 45 px). Selezione + pulsante 100%, Freccia destra/Fine e attivazione nativa dei pulsanti da tastiera. Annullamento del gesto gestito senza penalità; scorrimento verticale touch consentito.
- Robot: griglia 3×3 di oggetti, feedback non punitivo e assistente esterno selezionabile vicino alla consegna. Layout compatto sui telefoni, senza bersagli mobili.
- Ogni prova: avanzamento, due indizi progressivi senza attese, riavvio che ricrea soltanto la prova corrente. Soluzione: battuta prefissata e “Continua”, senza avanzamenti automatici. Focus sull’esito e sulla consegna successiva.
- Certificato “UMANO PER INSUFFICIENZA DI PROVE”, sottotitolo richiesto, “Riprova” e ritorno alla home. Nessuna esportazione, generazione immagini o condivisione del certificato.
- Stato in memoria, nessuna API o persistenza del nuovo gioco. Uscita/refresh ripartono dall’intro. Controlli nativi, focus visibile, feedback con role=status e immagini decorative locali/CSS/emoji. Nessun audio, animazione necessaria, timer, vite o game over.

## Confini conservati

Confrontati con il backup iniziale e invariati: package.json e lockfile, compose.yaml e docker/firebase, configurazione SvelteKit/Vite/Vercel, hooks, moduli Firebase, riconoscimento, backend/API, soglie e margine, consenso e database/cache. La chiave delle catture rimane `bacarodex-guest-captures-v1`; nessuna pulizia dell’archivio legacy IndexedDB o dei dati degli emulatori. I descrittori registrati continuano a rimanere sul server; nessun nuovo endpoint pubblico.

## Verifiche eseguite

- Prima delle modifiche, `npm run check`: zero errori e zero avvisi.
- Dopo le modifiche, `npm run check`: zero errori e zero avvisi.
- `npm run build`: riuscita, inclusi SSR/client, verifica checksum dei modelli e output Vercel. Durante lo sviluppo corretto un errore di posizionamento di svelte:head e dichiarate reattive le reference alle intestazioni condizionali.
- Restano gli avvisi già documentati per il chunk Human (~1,58 MB) e per il tracing Vercel delle dipendenze opzionali metadataResolver/supports-color. Nessuna modifica per silenziare tali avvisi.
- Smoke HTTP sul dev server esistente: `/` e `/admin` rispondono 200 con no-store; home SSR contiene tutte le cinque schede e i link dei due giochi; area membri mostra il login; `/api/play` risponde 200 senza mutazioni.
- Manifest della build: giochi in chunk dinamici separati. Il grafo degli import statici della home e del nuovo gioco non include il modulo recognition né il chunk Human. Human rimane un import dinamico del modulo recognition. Questa è una verifica del bundle, non una misura delle richieste di rete in un browser.
- Preview di produzione su porta locale dedicata: `/`, `/admin` e `/api/play` HTTP 200; API riservata `/api/bacarodex` HTTP 401 senza sessione; header no-store. Chunk pubblici di root e dei due giochi HTTP 200.
- Confronto dei file preservati con backup e controllo assenza di riferimenti residui a Play.svelte.
- Revisione indipendente: individuata e corretta una collisione con la classe globale `.desktop`, che in Bacarodex è nascosta sui telefoni. Il desktop simulato usa ora `.simulated-desktop`, senza modificare il CSS preesistente. Nessun altro difetto concreto segnalato dalla revisione dei sorgenti; interazioni e layout reali non valutabili senza browser. Typecheck e build rieseguiti dopo la correzione, entrambi riusciti.

## Limiti della verifica

Il collegamento Computer Use non ha trovato browser utilizzabili (in-app browser e Chrome non disponibili; avvio del servizio nativo fallito). Non eseguiti walkthrough interattivo, screenshot, prove touch/mouse/tastiera reali, verifica fisica del QR o osservazione della rete dal browser. Le relative voci sotto rimangono da provare. Nessuna suite automatica o dipendenza di testing aggiunta, come richiesto.

Non dichiarato nuovamente verificato il riconoscimento: non usate foto, embedding inventati o nuove registrazioni. Prove con volontari reali, login Google cloud ed esecuzione su Vercel restano quelle da completare indicate nel precedente report.

## Checklist per la prova con gli amici

- [ ] Aprire `/`: due giochi disponibili e tre schede “In arrivo” prive di pulsanti.
- [ ] Aprire direttamente e ricaricare ciascuna hash route; provare indietro/avanti e un hash sconosciuto.
- [ ] Con cache disabilitata, entrare in home e Are You an AI?: nessuna richiesta a Human, `/models/` o `/api/play` in assenza di una precedente scansione avviata.
- [ ] Checkbox intro → tre prove → certificato; leggere ogni battuta prima di “Continua”.
- [ ] Ogni prova: entrambi gli indizi immediati, riavvio pulito, errore non punitivo e nessun avanzamento senza soluzione.
- [ ] Finestre: ripetere le X, verificare che restino tre; spegnere il desktop.
- [ ] Barra: drag ampio da punti diversi, mouse e touch, selezione + 100%, Freccia destra/Fine e percorso Tab/Invio. Provare anche gesto annullato e scorrimento verticale.
- [ ] Robot: caselle sbagliate ripetibili e assistente fuori dalla griglia subito visibile e selezionabile su telefono.
- [ ] Certificato → Riprova → intro; certificato → home; uscita a metà gioco → rientro dall’intro.
- [ ] Tastiera: focus sempre visibile e ordine sensato, feedback leggibile senza audio o animazioni.
- [ ] Bacarodex: collezione esistente presente dopo andata/ritorno e refresh sulla stessa origine.
- [ ] Camera: uscire durante apertura, anteprima e analisi; verificare spegnimento camera, nessuna nuova richiesta post-estrazione e nessun salvataggio tardivo.
- [ ] `/admin`: login, registrazione reale consenziente, ritiro e collegamento “Apri il gioco”; QR scaricato apre Bacarodex direttamente.
- [ ] Volontario: nuova foto → riconoscimento server → quiz → cattura, poi ritorno home e collezione preservata. Provare non registrato/foto di gruppo separatamente per la calibrazione.

Nessun deployment eseguito. Per provare localmente usare il dev server (`npm run dev`); Firebase Docker serve per Bacarodex, non per Are You an AI?.
