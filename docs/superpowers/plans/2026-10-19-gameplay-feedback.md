# BacaroGame: piano delle migliorie al gameplay

Stato: implementato il 20 ottobre 2026 su richiesta dell’utente, inclusi pool/trabocchetto e pagina pubblica `/qr`. Riscontri e limiti di verifica in `IMPLEMENTAZIONE_GAMECENTER.md`.
Data: 19 ottobre 2026.

## Obiettivo e ordine

Rendere Bug Hunter una caccia attiva e Are You an AI? più comprensibile, conservandone il tono comico. Due interventi indipendenti: prima le meccaniche fondamentali di Bug Hunter, poi le tre prove di Are You an AI?, infine abilità e contenuti extra. Implementazione sullo stack esistente Svelte 5, TypeScript e Three.js, Node 22.17+ nella major 22. Nessun backend necessario.

Tutti i numeri nuovi sotto sono proposte iniziali, non requisiti già approvati. Le soglie 25/50/30/40 sono quelle richieste. L’utente ha autorizzato l’implementazione il 20 ottobre 2026.

## Piano A — Bug Hunter

### Stato verificato

`src/lib/games/bug-hunter/mechanics.ts` contiene la simulazione e i test sono in `mechanics.test.ts`. La velocità sale già secondo `min(15, 8 + tempo * 0.055)`, raggiungendo il massimo dopo circa 127 secondi. Le righe distano 23 unità. Il bug è sempre sulla corsia libera; le catture accettano solo un'altezza del giocatore inferiore a 1.9. Un bug mancato non ha conseguenze. Le tre vite e due secondi di invulnerabilità dopo un urto esistono già.

La scena riutilizza otto righe e tre modelli di ostacolo per riga: introdurre tre ostacoli anche dello stesso tipo richiede aggiornare il rendering, che oggi li cerca per tipo. Non basta modificare lo spawn.

### A1 — Orientamento, ritmo e salto

File: `models.ts`, `mechanics.ts`, `mechanics.test.ts`, `scene.ts`, `BugHunter.svelte` nella cartella del gioco.

- [ ] Correggere l'orientamento del personaggio verso la direzione di corsa. Verificare testa, corpo, retino e animazioni insieme dalla camera reale.
- [ ] Sostituire la curva con `min(16, 8 + floor(tempoAttivo / 20) * 2)`: aumento ogni 20 secondi, massimo dopo 80 secondi. Avviso breve a ogni incremento. Il tempo avanza solo durante la partita attiva.
- [ ] Prime cinque righe introduttive; dalla sesta, una riga speciale ogni quattro. Alternare barriera bassa sulle tre corsie e bug alto. Niente barriere alte che rendano impossibile attraversare tutta la pista.
- [ ] Aggiungere altezza di cattura al modello della riga e condividere le stesse coordinate tra simulazione e scena. Nelle barriere complete, collocare il bug in aria in modo che salto, superamento e cattura siano compatibili.
- [ ] Verificare con test deterministici le soglie temporali, il tetto di velocità, lo spawn iniziale e la cattura durante il salto. Verificare la raggiungibilità delle righe speciali anche alla velocità massima, considerando durata del salto (0.85 s), collisioni e cambio corsia.

### A2 — Ogni bug conta

File: `mechanics.ts`, `mechanics.test.ts`, `scene.ts`, `BugHunter.svelte`, `content.ts`.

- [ ] Segnare ogni bug come risolto una sola volta: catturato oppure mancato. Perdita di una vita appena supera definitivamente la zona di cattura (`z > 1.4` con il modello attuale), prima del riciclo della riga.
- [ ] Distinguere evento di urto ed evento di bug perso, con messaggi e feedback dedicati. La partita termina subito a zero vite, senza elaborare ulteriori perdite nello stesso aggiornamento.
- [ ] Proposta di equità: massimo una vita persa per riga, anche se un urto fa mancare il bug della stessa riga. L'invulnerabilità da urto protegge dagli altri urti, non dai bug persi nelle righe successive.
- [ ] Spiegare la regola prima di iniziare; mantenere i bug catturati come risultato principale e i metri come dato secondario. Il runner resta infinito, ma con velocità limitata e pressione legata alle catture.
- [ ] Testare cattura senza penalità, perdita singola, riciclo, urto e mancata cattura nella stessa riga, righe successive durante invulnerabilità, ultima vita, pausa e nuova partita.

### A3 — Abilità automatiche

File: `mechanics.ts`, `mechanics.test.ts`, `content.ts`, `scene.ts`, `BugHunter.svelte`.

Proposta: contatori di carica separati dalle catture totali, una carica per insetto fisico. Al raggiungimento della soglia, consumare la carica e attivare automaticamente l'effetto. Nessun nuovo pulsante su mobile. Le quattro specie mantengono il loro ordine attuale: Heisenbug, Regression, Production, Feature.

| Specie | Soglia | Effetto proposto |
| --- | --- | --- |
| Regression | 25 | Recupera una vita, massimo 3. A vite piene conserva una cura pronta, applicata dopo la successiva perdita se rimane almeno una vita; non resuscita dopo game over. Nessun accumulo oltre una cura pronta. |
| Heisenbug | 50 | Attraversa gli ostacoli per 8 secondi. I bug mancati continuano a costare una vita. |
| Production | 30 | Velocità del mondo al 60% per 6 secondi; movimento laterale e salto restano reattivi. |
| Feature | 40 | Le catture valgono doppio per 10 secondi; non duplicano la carica delle abilità. |

- [ ] Separare catture fisiche, conteggio per specie, cariche e punteggio: il ×2 modifica solo il punteggio, dichiarato come tale nell'interfaccia.
- [ ] Implementare effetti contemporanei con timer in secondi di gioco attivo, indipendenti dal rallentamento del mondo. Una nuova attivazione dello stesso effetto rinnova la durata senza sommarla.
- [ ] Mostrare carica, attivazione, durata residua e cura pronta in una HUD leggibile anche da telefono; aggiornare descrizioni e istruzioni.
- [ ] Testare soglia esatta, consumo, cure a vite piene e a una vita, fine effetto, rinnovo, combinazioni, pausa e reset completo.

**Vincolo di bilanciamento:** oggi le specie si alternano rigidamente e c'è un bug per riga. A velocità 16 e distanza 23, anche catturando tutto, 50 Heisenbug richiedono circa 200 catture e diversi minuti. Prima di confermare le soglie misurare quando si ottiene la prima abilità: obiettivo proposto 45–90 secondi. Se le soglie richieste risultano troppo lontane, concordare soglie inferiori oppure più bug per sequenza; evitare di aumentare lo spawn senza verificare che ogni bug sia raggiungibile con la penalità sui mancati.

## Piano B — Are You an AI?

### Stato verificato

`src/lib/games/are-you-an-ai/AreYouAnAI.svelte` gestisce intro, indice fisso delle tre prove, indizi, reset e certificato. `CloseWindows.svelte` sostituisce subito il titolo; `Loading99.svelte` si risolve trascinando la barra o selezionandola e premendo 100%. `Robot.svelte` rende evidente il bersaglio tramite bordo tratteggiato. Il certificato è solo HTML.

### B1 — Migliorare le tre prove e il reset

- [ ] `CloseWindows.svelte`: al click sulla X rimuovere visivamente la finestra e riaprirla nello stesso slot dopo 400 ms, con titolo diverso. Bloccare click ripetuti sullo slot in attesa. “Spegni” rimane la soluzione. Cancellare tutti i timer a soluzione, reset e smontaggio; non aprire finestre reali del browser.
- [ ] `Loading99.svelte`: sostituire il trascinamento con cinque conferme a tempo. Barra iniziale 0%; un pulsante stabile cambia stato tra attesa e “ORA”, cinque successi da +20% portano al 100%. Finestra iniziale 1.2 s, attesa variabile 0.8–1.6 s. Un errore ripete il tentativo senza togliere progresso. Rimuovere il vecchio percorso che risolve immediatamente la prova.
- [ ] Rendere il pulsante utilizzabile con touch, Invio e Spazio; focus stabile, nessuna azione duplicata dalla ripetizione del tasto. Per chi preferisce tempi più distesi offrire una modalità senza scadenza, mantenendo le cinque conferme. L'esperienza resta senza game over.
- [ ] `Robot.svelte`: eliminare il bordo tratteggiato a riposo; conservare il focus visibile da tastiera e il nome accessibile. Il robot fuori griglia rimane selezionabile.
- [ ] `AreYouAnAI.svelte`: rinominare “Ricomincia la prova” in “Ricomincia dalla prima prova”. Azzerare indice, soluzione, indizi e stato locale dei livelli e tornare alla prima prova direttamente, senza intro. “Riprova” sul certificato continua a tornare all'intro.
- [ ] Aggiornare testi, battute e indizi del secondo livello. Verificare timer cancellati, avanzamento una sola volta, reset da ogni prova, uscita durante una riapertura e navigazione completa da tastiera.

### B2 — Certificato PDF con logo

File: `AreYouAnAI.svelte`; nuovo `certificate.ts` accanto al componente; asset ufficiale in `static/`; eventuale dipendenza dichiarata in `package.json` e lockfile.

- [ ] Recuperare un logo BacaroTech ufficiale dal materiale del progetto e verificare che sia quello desiderato; non è emerso un asset logo nella ricognizione delle cartelle `public`, `static` e `src` del gioco. Nessuna credenziale o configurazione Firebase serve per questa funzione.
- [ ] Aggiungere “Scarica certificato PDF”. Generare il documento nel browser con una libreria PDF caricata soltanto al click, mantenendo testo selezionabile, accenti, colori e logo. Scelta proposta: `pdf-lib`, con font incorporato solo se necessario per i caratteri usati; verificarne API e versione ufficiali prima di installare.
- [ ] PDF A4 su una pagina, testo “UMANO PER INSUFFICIENZA DI PROVE”, logo e tono grafico del certificato. Nessun dato personale richiesto. Nome `bacarotech-certificato-umanita.pdf`.
- [ ] Gestire caricamento ed errore recuperabile del download. Revocare eventuali URL temporanei senza interrompere il salvataggio.
- [ ] Aprire e renderizzare il PDF generato per verificare logo, accenti e assenza di tagli; provare download desktop e apertura/salvataggio su iOS e Android. L'esportazione non deve dipendere da Firebase.

### B3 — Evoluzione successiva: pool e trabocchetti

Da fare dopo il collaudo delle tre prove riviste.

- [ ] Estrarre in `trials.ts` un registro con ID stabile, titolo, istruzioni, indizi, risposta, componente ed esito. Usare ID invece dell'indice per stabilire contenuto e comportamento del robot.
- [ ] Estrarre tre prove senza duplicati a inizio partita; mantenere ordine e selezione per tutta la partita. “Ricomincia dalla prima prova” conserva la stessa selezione; “Riprova” genera un nuovo sorteggio.
- [ ] Aggiungere la prova matematica come contenuto comico, senza AI reale: risposta esatta → certificato robot e conclusione anticipata; risposta errata → esito umano e avanzamento. Input vuoto o non numerico richiede una risposta e non determina l'esito. Dichiarare il carattere scherzoso del risultato.
- [ ] Riutilizzare l'esportazione PDF con variante robot e nome file dedicato. Non persistere certificati o risposte sul server.
- [ ] Testare estrazione senza duplicati, reset con ordine stabile, nuova partita, indizi coerenti con l'ID, finale anticipato e corrispondenza tra esito e PDF.

## Verifica e consegna di ciascun piano

- [ ] Aggiungere prima test di comportamento significativi per simulazione e transizioni; usare clock e casualità controllati. Aggiungere uno script di test per le nuove logiche pure di Are You an AI?, che oggi non ne ha uno dedicato.
- [ ] Eseguire `npm run test:bug-hunter`, `npm run check` e `npm run build` con l'ambiente previsto; per Are You an AI? anche il nuovo script dedicato. Nessun test applicativo necessario per questo documento.
- [ ] Eseguire i controlli browser Bug Hunter in `scripts/test-bug-hunter-browser.mjs`, `scripts/test-bug-hunter-viewport.mjs` e `scripts/test-bug-hunter-lifecycle.mjs` secondo i prerequisiti degli script. Aggiornare le aspettative per le nuove meccaniche.
- [ ] Collaudare desktop e mobile: salto alla velocità massima, HUD abilità, pausa/background, reset, uscita/rientro, tastiera, focus, movimento ridotto e download PDF.
- [ ] Aggiornare `README.md` e `IMPLEMENTAZIONE_GAMECENTER.md` al comportamento effettivamente consegnato e riportare verifiche eseguite e limiti residui.

## Decisioni da revisionare prima dell'implementazione

1. Ritmo proposto: incremento ogni 20 s, massimo 16; runner ancora infinito.
2. Una sola penalità per riga e invulnerabilità che non protegge dai bug persi.
3. Abilità automatiche con durate fisse e Feature ×2 sul punteggio; soglie da verificare rispetto alla durata reale delle partite.
4. Seconda prova basata su cinque click a tempo, con alternativa senza scadenza.
5. Logo ufficiale da individuare; pool e certificato robot nella fase successiva.
