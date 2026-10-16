# Merge Battle — POC giocabile

## Concept e modalità

Merge Battle è un party game di scelte comiche, senza domande di cultura, tempi di risposta, account o classifiche. Accesso dalla home del Game Center o da `/#/merge-battle`. Quattro branch: FEATURE/APERITIVO, HOTFIX/SONNELLINO, REFACTOR/BUROCRAZIA e RELEASE/GLITTER. Ogni branch ha aspetto, oggetti, carattere e tre mosse proprie: offerta gastronomica, travestimento, pausa assurda.

Tre prove, ruotate a ogni rivincita: convincere Nonna Pina ad aprire casa, inaugurare una discoteca nella biblioteca del ficus, far decollare il divano del piccione astronauta. Le scelte non hanno una risposta corretta: dipendono dalla mossa avversaria e dal contesto. Le lasagne battono il falso nipote dalla nonna, ma in biblioteca il travestimento trasforma il cibo proibito in un libro ammesso.

### Single player

Si sceglie il proprio branch e si affronta un rivale locale con personalità. Il rivale viene assegnato dal cast, sceglie prima della mossa umana, segue preferenze proprie e, nelle rivincite alternate, reagisce alla precedente scelta del giocatore. Il commento dopo la battaglia rende esplicita questa intenzione. Può vincere e perdere: nessuna lettura della mossa corrente, nessuna API o LLM. Cambiare personaggio consente di affrontare altri rivali.

### 1 vs 1 locale

1. Player 1 sceglie il branch; Player 2 sceglie un altro branch.
2. Entrambi leggono prova e giuria.
3. Player 2 guarda altrove mentre Player 1 seleziona la mossa.
4. Una schermata opaca «Passa il telefono al tuo avversario» sostituisce completamente le scelte.
5. Player 2 conferma di avere il dispositivo e sceglie; la prima mossa non compare nel DOM della schermata.
6. Countdown scenografico 3, 2, 1, MERGE BATTLE: non misura né premia i riflessi.
7. Le mosse vengono rivelate, gli oggetti si incontrano nell'arena, la giuria reagisce e spiega il verdetto.
8. Un pulsante mostra vincitore e personaggio ibrido. La rivincita conserva i branch e cambia prova; è possibile ricominciare il casting o cambiare modalità.

Sul computer vale la stessa alternanza: chi non sceglie guarda altrove. La segretezza è quella di un party game sul dispositivo condiviso, non una protezione contro DevTools. Il refresh azzera la partita; non salviamo scelte o profili.

## Motore e contenuti

`engine.ts` contiene cast, prove, 18 scene per coppie non ordinate di mosse, risoluzione e macchina a stati. Il risultato è deterministico: nessun sorteggio o punteggio nascosto. Le combinazioni differenti seguono rivalità circolari; la giuria cambia le conseguenze. A mosse uguali conta la personalità preferita dalla giuria. Un'interazione specifica permette alle lasagne esplosive di Glitter di vincere contro la pausa sul divano lunare. Sei nomi di merge combinano le coppie di personaggi, con un epilogo legato alla prova.

`Input` specifica tipo di evento, attore e scelta. `input(session, event)` valida fase e attore e produce un nuovo stato. `publicSession` nasconde le mosse prima della battaglia. Il rendering non stampa segreti prima della rivelazione. Un futuro adattatore di trasporto può fornire gli stessi eventi, ma autenticità dell'attore, autorità della stanza e protocollo di commit richiederanno un progetto separato. Non sono stati implementati socket, codici stanza, link di invito, persistenza o backend multiplayer.

`MergeBattle.svelte` gestisce le schermate e i tempi scenografici; `BattleArena.svelte` mette in scena torri gastronomiche, baffi che volano, rimbalzi sui cuscini, impostori incastrati, timbri e bolle di russamento. `Fighter.svelte` disegna i personaggi con espressioni, accessori e un corpo bicolore nel merge. Gli asset sono CSS e simboli di sistema: nessun download di immagini. Le forme delle emoji possono cambiare tra sistemi operativi.

Le scelte non scadono. La sequenza animata dura circa 8 secondi, poi si legge e si prosegue liberamente. Il target complessivo 60–90 secondi dipende da lettura, discussioni e passaggio del telefono: richiede playtest con persone, non è un tempo imposto. Con riduzione del movimento la sequenza si accorcia e le animazioni sono disattivate; testi e verdetto rimangono leggibili. I timer vengono eliminati quando si esce dalla battaglia.

## Integrazione

La home offre tre giochi e Merge Battle sostituisce il concept «Merge Conflict IRL» fra quelli in arrivo. Il modulo è caricato dinamicamente dal router hash. Bacarodex, riconoscimento, Firebase, admin e Docker non sono stati modificati. Aggiunto lo script `npm run test:merge-battle`, basato su `node:test` incluso in Node, senza nuove dipendenze. `allowImportingTsExtensions` abilita gli import TypeScript diretti dei test con Node 22.

## Verifiche

- Test del motore: tutte le 324 combinazioni fra personaggi diversi, prove e mosse; simmetria scambiando i giocatori; presenza di gag, effetto e motivazione.
- Caso narrativo: lasagne/falso nipote, esito opposto fra nonna e biblioteca.
- Flussi: selezione locale, passaggio obbligatorio, redazione dei segreti, rivelazione, verdetto, rivincita e pulizia delle scelte; selezione e risoluzione single player.
- Avversari: scelte valide, varietà, possibilità di vittoria e sconfitta per ciascuna personalità.
- Input errati: personaggi duplicati, attore sbagliato, mossa prima del passaggio vengono rifiutati.
- `npm run check`: zero errori e zero warning.
- `npm run build`: completato; restano gli avvisi preesistenti sui chunk grandi e sulle dipendenze opzionali tracciate dall'adapter Vercel (`google-gax`, `supports-color`).

### Browser e revisione finale

Verificato in Chrome headless, viewport desktop 1280×900 e mobile 390×844: 12 battaglie complete (tre prove × due modalità × due viewport), con rivincite, assenza della prima scelta nel testo delle schermate segrete, assenza di overflow orizzontale nella schermata finale e zero errori runtime. Verificata anche una battaglia con tempi e animazioni normali; la matrice di flussi usa la preferenza di movimento ridotto. Ispezionati gli screenshot di risultato mobile e desktop e dell'arena mobile.

La revisione indipendente ha segnalato che lo smascheramento animava sempre l'oggetto a destra. Un test browser ha riprodotto il problema scambiando le mosse; ora l'effetto segue il travestimento in entrambe le posizioni. Test di regressione passato dopo la correzione. Nessun altro problema bloccante rilevato dalla revisione.

Risultato finale dei test Node: **7/7**, inclusi 24 percorsi completi della macchina a stati (quattro personaggi × tre prove × due modalità), 324 risoluzioni e controllo che il bot non cambi scelta dopo aver visto l'input corrente.

Per ripetere:

```sh
npm run test:merge-battle
npm run check
npm run build
npm run dev -- --port 5173
# In un altro terminale, con Playwright già disponibile e Chrome installato:
node scripts/test-merge-battle-browser.mjs
node scripts/test-merge-battle-animation.mjs
```

I test browser accettano `PLAYWRIGHT_MODULE` come percorso del modulo Playwright già installato. In questa verifica è stato riutilizzato il modulo nella cache locale npm, senza installazioni né nuove dipendenze del progetto. Gli script browser non sono necessari per eseguire il gioco.

Limiti della verifica: viewport mobile simulato, non test su hardware iOS/Android; accessibilità verificata a livello di struttura, focus e movimento ridotto, senza sessione con screen reader. Divertimento, durata reale e desiderio di rivincita richiedono ancora un playtest con due persone.

