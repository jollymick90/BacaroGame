# Analisi del BacaroTech Game Center per l’evento

15 ottobre 2026. Valutazione di game design e conduzione dal vivo, sulla versione attuale.

**Metodo e limiti.** Letti sorgenti, README, `IMPLEMENTAZIONE.md` e `IMPLEMENTAZIONE_GAMECENTER.md`. Il server locale era già avviato: richieste HTTP senza cookie a `/` e `/admin` hanno restituito 200, con home e login presenti nell’HTML; `/api/bacarodex` ha restituito 401. `/api/play` ha restituito **`available: true, count: 0`**. Questo dato riguarda l’ambiente locale al momento dell’analisi, non il sito dell’evento.

Computer Use non ha trovato browser disponibili e il servizio nativo non si è avviato. Non ho quindi eseguito una partita interattiva, acquisito screenshot, verificato mobile/desktop renderizzati o creato un contesto browser vergine. Le richieste HTTP senza cookie non sostituiscono quella prova. I comportamenti sotto sono ricostruiti dal codice; quando anticipo una possibile reazione del pubblico la indico come ipotesi. Nessuna foto, registrazione biometrica o verifica dell’accuratezza del riconoscimento. Le verifiche nei report precedenti restano attribuite a quei report, non rieseguite qui.

## A. Diagnosi principale

Oggi abbiamo una raccolta di giochini, con una demo di riconoscimento che può diventare una scusa per incontrarsi.
Are You an AI? offre piccoli rovesciamenti, ma il robot raramente entra in un vero botta e risposta.
Bacarodex mette due persone una davanti all’altra, poi permette di superare il quiz senza conoscersi.
L’animatore può dare energia a entrambe le esperienze; il codice ne sostiene ancora poco l’interazione sociale.
La promessa di BacaroTech è più forte delle situazioni effettivamente costruite.
Non serve aumentare difficoltà o quantità: serve verificare se una singola azione provoca una risposta che qualcuno abbia voglia di raccontare o mostrare.

## B. Cosa preservare

- **La disponibilità immediata di Are You an AI?.** Nessun account, preparazione dei membri, fotocamera o API: è il candidato più semplice per un link aperto autonomamente. L’intro definisce subito un interlocutore e una piccola opposizione: “Non sono un robot” / “È esattamente quello che direbbe un robot”. È già una situazione, anche se poi viene sviluppata poco.
- **Gli errori senza umiliazione.** Indizi immediati, riavvio locale, nessun timer o game over e pulsante “Continua” lasciano spazio alla lettura e alla conversazione. Il partecipante può provare qualcosa senza dover dimostrare di essere competente. Vedi [AreYouAnAI.svelte](src/lib/games/are-you-an-ai/AreYouAnAI.svelte), righe 9–27 e 43–58.
- **La correttezza del trucco delle finestre.** Spegnere il desktop soddisfa davvero “Chiudi tutte le finestre”. La soluzione è visibile e semanticamente legata al problema. Non bisogna inventare un gesto segreto. Le X che sostituiscono le finestre offrono già un’azione alla quale il sistema può reagire.
- **Le alternative accessibili della barra e il robot raggiungibile.** Rendere evidente che un elemento si può usare non è un difetto da correggere nascondendolo. Il gioco deve restare piacevole anche quando la soluzione viene capita subito, o quando serve il secondo indizio. La sorpresa dovrebbe sopravvivere nella risposta del robot.
- **La scelta personale del Pokémon.** In Bacarodex qualcuno ha scelto quel personaggio: c’è una preferenza reale da scoprire. Questo è un appiglio sociale più interessante di una presunta somiglianza tra volto e Pokémon. Il sistema non deduce il Pokémon dall’aspetto e questa distinzione va preservata.
- **Nome e Pokémon nella cattura.** Non rimane soltanto uno sprite: la collezione contiene il nome della persona e la data. È un inizio di ricordo dell’incontro, anche se non conserva il motivo della scelta. Vedi [player.ts](src/lib/player.ts), righe 2–12, e [Bacarodex.svelte](src/lib/games/bacarodex/Bacarodex.svelte), riga 41.
- **L’assenza di un obbligo promozionale.** Si può giocare senza newsletter, follow o account del partecipante. BacaroTech può farsi conoscere attraverso il momento offerto. L’attività rimane separata dalle interviste e non deve richiedere di essere ripresi.

## C. Problemi prioritari

### 1. Bacarodex è accessibile pubblicamente, ma richiede una situazione preparata

**Fatti.** Il backend condiviso esiste già. La lista dei membri giocabili viene letta da Firebase, filtrando consenso `public-game-v2` e modello compatibile: [game.ts](src/lib/server/game.ts), righe 10–12. Il browser nuovo parte con una collezione vuota, ma non deve contenere registrazioni facciali locali: [player.ts](src/lib/player.ts), righe 3–7. Il login è riservato ai membri che si registrano.

Nell’ambiente locale analizzato il conteggio pubblico è zero. Il ramo corrispondente mostra “Nessun membro è ancora pronto per il gioco pubblico. Torna tra poco!” e “Aggiorna”; la scansione non viene mostrata. Vedi [Bacarodex.svelte](src/lib/games/bacarodex/Bacarodex.svelte), righe 35–40. Questo è un comportamento ricostruito dal codice e dalla risposta API, non osservato in un browser.

La home presenta comunque “Gioca a Bacarodex”. Inoltre il QR prodotto da [ShareQr.svelte](src/lib/ShareQr.svelte), righe 9 e 15, porta direttamente a Bacarodex, saltando la home e il gioco utilizzabile senza preparazione.

**Conseguenza operativa.** Un archivio locale vuoto non è il blocco. Servono almeno un membro realmente registrato con il consenso attuale, quel membro presente e disponibile, backend raggiungibile e condizioni adatte alla foto. Una vecchia registrazione con consenso precedente non basta. Avere una collezione già piena sul telefono non risolve l’assenza di membri disponibili sul server.

| Situazione | Esperienza possibile oggi |
|---|---|
| Telefono nuovo, membro pubblico registrato e presente | Il partecipante può giocare senza login; deve consentire la camera o fornire una foto, confermare il consenso al confronto e completare la scansione. La riuscita reale del riconoscimento resta da provare. |
| Telefono nuovo, nessun membro giocabile sul server | Bacarodex si ferma allo stato vuoto. Are You an AI? rimane indipendente da quel problema. |
| Telefono nuovo, membri registrati ma nessuno presente | Il sistema può essere disponibile tecnicamente, ma manca il soggetto consenziente da incontrare e fotografare. Il link da solo non crea l’attività. |
| Dispositivo condiviso preparato dal gruppo | Può ridurre i passaggi iniziali e facilitare l’accompagnamento. Richiede comunque membri registrati; la collezione appartiene al dispositivo e non distingue chi ha giocato. |

**Ipotesi da verificare.** Un visitatore senza spiegazioni potrebbe interpretare “Bacaro” come qualsiasi amico e scansionare una persona non registrata. Il testo non offre un modo concreto per trovare un membro disponibile. Non è noto da questa analisi come BacaroTech sarà riconoscibile o presente nello spazio dell’evento.

### 2. Dopo il riconoscimento, Bacarodex offre una risposta da trovare senza un motivo per sceglierla

**Fatti.** Il quiz mostra quattro Pokémon e domanda quale sia stato scelto dal membro. I tre distrattori sono estratti dal catalogo, non costruiti intorno alla persona: [game.ts](src/lib/server/game.ts), funzione `quizOptions`. Non viene fornito un indizio sulla preferenza del membro.

Una risposta sbagliata restituisce `correct: false`; il token resta utilizzabile e il client consente di riprovare. Non c’è limite ai tentativi nel quiz. Entro la validità del token e a registrazione invariata, si possono quindi premere tutte e quattro le opzioni senza conversare. Vedi [answer/+server.ts](src/routes/api/play/answer/+server.ts), righe 7–12, e [Bacarodex.svelte](src/lib/games/bacarodex/Bacarodex.svelte), righe 23–27 e 39. La scadenza tecnica del token non costituisce una sfida interessante.

| Elemento | Lettura del gioco attuale |
|---|---|
| Azione | Inquadrare una persona e scegliere fra quattro personaggi. |
| Aspettativa | “Il riconoscimento mi farà scoprire qualcosa di questa persona.” |
| Rovesciamento | Il volto apre un quiz sulla sua scelta personale, ma l’app non mette in relazione quella scelta con qualcosa che il giocatore abbia appreso. Non c’è un rovesciamento comico garantito. |
| Reazione possibile | “Mi ha riconosciuto!” oppure “Perché proprio quel Pokémon?”. La seconda domanda è promettente, ma oggi dipende dall’iniziativa delle persone. Un’altra possibilità è toccare opzioni fino alla cattura. Nessuna delle tre è stata osservata in un playtest. |
| Dimensione sociale | La persona fotografata è fisicamente coinvolta, ma può restare una semplice fonte di dati. Il codice non le assegna un ruolo nel quiz. Un accompagnatore può inventarlo, ma sta aggiungendo una parte importante dell’esperienza. |
| Identità | “Conosci un membro attraverso una scelta strana” potrebbe appartenere a BacaroTech. “Scansiona, indovina, colleziona” resta una formula trasferibile a molti eventi. La specificità risiede nelle persone reali, ancora poco utilizzate. |

Il riconoscimento può essere spettacolare e il quiz può comunque essere debole: sono due valutazioni separate. Non serve rendere punitivi i tentativi per correggere questa debolezza; serve dare una ragione per parlare e scegliere. Cercare un altro membro oggi aggiunge un elemento alla collezione, ma non promette un incontro diverso oltre al nome e al Pokémon.

### 3. Are You an AI? contiene tre idee leggibili, ma poca escalation fra giocatore e robot

La ricostruzione dei passaggi effettivi mostra potenziale e limiti diversi per ciascuna prova.

| Passaggio | Consegna, tentativi e scoperta | Reazione attuale del sistema | Valutazione e reazione possibile |
|---|---|---|---|
| Intro | Selezionare “Non sono un robot” abilita “Verificami, allora”. | “È esattamente quello che direbbe un robot.” Deselezionare e riselezionare ripete lo stesso scambio. | Premessa chiara: l’autorità è prevenuta. Potrebbe suscitare una piccola protesta scherzosa; non sappiamo se basti a creare interesse. |
| Finestre | Le X sostituiscono una finestra. Spegni risolve anche senza avere prima toccato una X. | Primo tentativo: “Ottimo. Una finestra in meno, una finestra in più.” Dai successivi: sempre la stessa frase sul ricambio d’aria. Alla soluzione: “Tecnicamente corretto. Umanamente preoccupante.” | L’aspettativa “la X chiude” viene contraddetta; spegnere ristabilisce una logica comprensibile. È il miglior embrione di conflitto: il sistema crea il proprio problema. Chi guarda potrebbe commentare la sua ostinazione. |
| Caricamento | Barra ferma al 99%. Le istruzioni già visibili dicono esattamente di trascinarla o selezionarla e premere 100%, includendo i comandi da tastiera. | Selezione: “Il 100% è a portata di mano.” Soluzione: “Quindi potevi farlo tu dall’inizio.” | Il passaggio da attesa passiva a intervento manuale è un buon rovesciamento, ma la scoperta è in gran parte anticipata. Può funzionare come gag immediata; non è necessario farlo durare. Manca però una sorpresa ulteriore nella risposta del robot. |
| Robot | Nove oggetti non robot; cliccare una casella dà una frase composta dal nome dell’oggetto e lo stesso commento. Il robot esterno è ora un pulsante con bordo tratteggiato e nome “Robot assistente”. | Clic sul robot: “Non era previsto che leggessi davvero la consegna.” | La consegna non limita la ricerca alla griglia: soluzione corretta, non arbitraria. L’affordance è generosa e va preservata. Chi riconosce il trucco subito non incontra però un secondo sviluppo comico. |
| Finale | Dopo tre “Continua” arriva il certificato; “Riprova” ripete la sequenza. | “Il sistema non è convinto, ma deve andare in pausa.” | Chiude il tema burocratico, ma è uguale qualunque cosa sia accaduta. Potrebbe strappare un sorriso; da solo non prova che si sia costruito un confronto memorabile. |

Fonti: [AreYouAnAI.svelte](src/lib/games/are-you-an-ai/AreYouAnAI.svelte), righe 9–27 e 35–64; [CloseWindows.svelte](src/lib/games/are-you-an-ai/CloseWindows.svelte), righe 3–25; [Loading99.svelte](src/lib/games/are-you-an-ai/Loading99.svelte), righe 8–43; [SelectRobot.svelte](src/lib/games/are-you-an-ai/SelectRobot.svelte), righe 2–13; [Robot.svelte](src/lib/games/are-you-an-ai/Robot.svelte), righe 8–12.

**Non sono esattamente lo stesso rompicapo.** Le finestre chiedono di agire sull’intero sistema, la barra rende manipolabile un indicatore, il robot allarga il campo della consegna. Il filo comune è mettere in discussione le convenzioni dell’interfaccia. È coerente e accessibile al contesto tech senza richiedere nozioni. La ripetizione riguarda soprattutto la struttura drammatica: trucco trovato, battuta, schermata successiva. Il robot non sembra imparare, tentare di coprirsi o peggiorare la situazione a causa di ciò che abbiamo fatto.

Le battute finali sono specifiche delle prove, quindi non sono tutte intercambiabili. Sono però poco legate al percorso del giocatore: il risultato non cambia se usa subito Spegni o prova molte X, se risolve da solo o legge due indizi. Non occorre giudicare questi percorsi; potrebbero diventare materiale per l’imbarazzo del robot.

**Aspetto di interazione da verificare.** La barra misura lo spostamento al rilascio e non aggiorna la sua posizione durante il trascinamento; lo stato `dragging` cambia il cursore. Dal codice non emerge una risposta visiva continua del gesto. Su touch potrebbe sembrare meno manipolabile di quanto le istruzioni promettano. Non l’ho provato e non lo considero un difetto di usabilità dimostrato.

**Dimensione sociale e identità.** Uno spettatore può capire una X che non risolve nulla o un robot che viene selezionato contro le sue intenzioni, purché riesca a vedere il telefono e leggere la risposta. La leggibilità a distanza non è verificata. Tolti i nomi BacaroTech, restano una parodia del CAPTCHA e un ufficio burocratico generico: il carattere del gruppo emerge nel tono, ma non ancora in un comportamento distintivo. La direzione “il sistema fa una figuraccia” è sostenuta soprattutto dalle finestre e dal robot selezionato; merita una prova, non un’assunzione di successo.

### 4. La home presenta un catalogo più chiaramente di un’occasione per partecipare

**Fatti.** Ci sono due schede attive e tre “In arrivo”. Il testo dice “Piccoli prototipi, grandi discussioni al bacaro”. Su mobile le schede sono in una colonna e Bacarodex precede Are You an AI?. Vedi [GameCenterHome.svelte](src/lib/game-center/GameCenterHome.svelte), righe 2–24 e media query finale. L’ordine è verificato nel codice, non la posizione esatta rispetto alla piega su un telefono.

“Una pausa. Due modi di perderla bene” è amichevole e non aggressivo. “Dimostra di essere umano a un robot che non ti crede” dà già una promessa riconoscibile. Invece “Trova un Bacaro” richiede di sapere chi sia e come trovarlo. Non è spiegato il rapporto fra il gioco, il gruppo e la presenza delle persone all’evento.

**Ipotesi.** Il visitatore potrebbe leggere il tutto come una vetrina di progetti simpatici da provare in solitudine. Tre titoli indisponibili possono sottrarre attenzione alle due cose presenti e rendere visibile la roadmap del gruppo, senza aggiungere un’occasione di gioco. Non sostengo che tre schede future causino necessariamente abbandono: il costo certo è spazio e attenzione; l’effetto sul pubblico va osservato.

Il nome BacaroTech compare, ma la promessa sociale è affidata soprattutto a “passa il telefono”. Non basta attribuire al pubblico l’azione che vorremmo: occorre offrirgli un momento che valga la pena passare.

### 5. La chiusura dà un esito personale, ma pochi motivi nuovi per il passaggio di mano

**Fatti.** Il certificato è identico e non persistente. “Riprova” riparte dalle stesse prove con le stesse soluzioni; non esiste una nuova possibilità da esplorare. La cattura di Bacarodex conserva nome, Pokémon e data, ma non il motivo della scelta. Non ci sono attività per due persone né una risposta del sistema destinata allo spettatore. Fonti: [AreYouAnAI.svelte](src/lib/games/are-you-an-ai/AreYouAnAI.svelte), righe 27 e 62–64, e [player.ts](src/lib/player.ts), riga 2.

**Ipotesi.** È più plausibile desiderare di vedere la prima reazione di un amico che ripetere personalmente una sequenza già risolta. Se l’amico ha assistito a tutto, però, conosce le soluzioni: “tocca a te” può diventare una semplice ripetizione. Questo non richiede automaticamente varianti o altri livelli. Prima bisogna capire se il piacere sta nello scoprire il trucco, nel discutere con il robot o nell’accompagnare qualcun altro.

### I due contesti, distinti

| Cosa valutare | A. Link aperto autonomamente | B. Momento dal vivo con un osservatore |
|---|---|---|
| Cosa attira | Pokémon e promessa di mettere alla prova un robot sono due agganci leggibili. Il significato di “Bacaro” resta meno chiaro per chi non conosce il gruppo. | Una persona che invita e un’altra che sta già reagendo possono attirare. È un potenziale della situazione, non una proprietà dimostrata dell’app. |
| Cosa si capisce subito | Are You an AI? richiede di convincere un robot. Bacarodex chiede una foto, ma non basta un soggetto qualsiasi: serve un membro preparato. | Il membro può spiegare in una frase “devi scoprire il Pokémon che ho scelto”. Se serve una lunga spiegazione, l’attività non è pronta per questo uso. |
| Prima di giocare | AI: scelta della scheda, checkbox e avvio. Bacarodex: trovare il membro, foto e consenso; primo caricamento dei modelli e rete possono aggiungere attesa, non misurata. | Un telefono già pronto può ridurre i passaggi; chi guarda può non toccare nulla. Registrazione dei membri e condizioni operative rimangono necessarie per Bacarodex. |
| Primo momento interessante | Nell’AI può essere già l’obiezione alla checkbox, poi la prima X che non chiude. In Bacarodex il primo effetto forte può arrivare al match, dopo i passaggi tecnici. | Può nascere prima del successo: una protesta verso il robot, o una domanda al membro. Oggi il conduttore deve spesso creare questo spazio. |
| Cosa rimane | Certificato temporaneo; oppure nome e Pokémon nella collezione del proprio telefono. Quanto venga ricordato BacaroTech è ignoto. | Può rimanere un piccolo episodio condiviso: “Hai visto cosa ha fatto?”. È l’esito desiderato, ancora da osservare. Sul telefono condiviso la cattura non diventa un ricordo digitale personale. |
| Motivo per coinvolgere altri | Mostrare il trucco o il certificato è possibile, ma il gioco non prepara un passaggio di ruolo. La collezione suggerisce un altro incontro senza ancora dargli un contenuto. | L’osservatore può tifare contro il sistema o chiedere il turno. Se spiega la soluzione in anticipo, può anche togliere il momento di scoperta. La conduzione conta. |

### Competizione e contenuti: valutazione delle possibilità

Un confronto leggero potrebbe nascere da “tu come gli risponderesti?” o “guarda che scusa si inventa”, senza punteggi. Il tempo non è oggi una misura utile: familiarità col trucco, visione della partita precedente, caricamenti e fotocamera renderebbero il confronto ambiguo. Non aggiungerei un cronometro prima di sapere se esiste una reazione che le persone vogliono condividere. Non è una misura dell’intelligenza o dell’umanità.

Foto e nickname del partecipante non risolvono i problemi osservati. Non servono per far funzionare il primo botta e risposta; non li includo negli interventi. Nessuna classifica, risultato fittizio o account necessario.

Un breve video potrebbe rendere comprensibile la scena “chiudo una finestra, il sistema ne apre un’altra e pretende di avere ragione”, oppure il membro che cerca di giustificare il proprio Pokémon. Sono ipotesi di momenti raccontabili: occorrono consegna e conseguenza leggibili, non soltanto una faccia che ride. Il gioco deve funzionare senza riprese; nessuna registrazione, intervista o condivisione automatica viene proposta.

## D. Tre interventi

### 1. Fare delle finestre un litigio breve con un sistema che si smentisce

**Problema ed evidenza.** È già la prova con il miglior rapporto causa-effetto, ma dal secondo tentativo ripete una frase generica e il finale non distingue ciò che è accaduto. `CloseWindows.svelte` ha già il conteggio delle sostituzioni; manca un suo uso drammatico, non un nuovo livello.

**Modifica concreta.** Mantenere tre finestre, le X e Spegni nella stessa posizione. Dare al robot una pretesa iniziale, due reazioni legate alle X e una conclusione che riconosca l’azione di spegnimento. Spegni rimane utilizzabile subito; gli indizi rimangono immediati. Nessuna sequenza di errori obbligatoria.

**Prima:** X → un’altra finestra e commento sul ricambio d’aria → Spegni → “Tecnicamente corretto. Umanamente preoccupante”.

**Dopo, esempio di scena proposto:**

| Azione del giocatore | Risposta visibile del gioco |
|---|---|
| Entra nella prova | Consegna invariata. Robot: “Chiudi tutte le finestre. Ho controllato personalmente che le X funzionino.” |
| Preme una X | La finestra viene sostituita da “Conferma di chiusura”. Robot: “Chiusa. Ti ho aperto una finestra per confermartelo.” |
| Preme un’altra X | Nuova sostituzione, sempre tre finestre. Robot: “Vedi? Il problema non sono le finestre. È che continui a chiuderle.” |
| Insiste ancora | Nessuna crescita o attesa. Il robot arriva a una sola replica stabile: “Procedura regolare. Situazione completamente fuori controllo.” La prova non premia la ripetizione. |
| Preme Spegni dopo avere usato le X | Desktop spento. Robot: “Hai spento il computer. Ora come faccio a dirti che non potevi?” Esito: “Finestre chiuse. Reclamo del robot respinto.” |
| Preme subito Spegni | Stesso successo. Replica alternativa: “Non mi hai neanche lasciato il tempo di complicare la procedura.” Nessuna penalità per aver capito subito. |

I due indizi possono restare quelli attuali. Il risultato resta leggibile fino a “Continua”; niente battute che spariscono a tempo. Il robot è il bersaglio: certifica una procedura assurda, la difende, poi perde la possibilità di avere l’ultima parola.

**Ruolo di chi guarda.** Può contestare la giustificazione del robot senza sapere la soluzione. Un membro BacaroTech può introdurre con “Lui è sicurissimo di sé” e poi lasciare spazio. Non deve indicare Spegni o spiegare il trucco. La scena deve reggere anche leggendo da soli le reazioni.

**Perché potrebbe funzionare.** La battuta deriva da una scelta appena compiuta. Anche un giocatore che riconosce subito la soluzione riceve una conseguenza specifica; chi prova le X assiste a un piccolo peggioramento della credibilità del sistema. È una possibilità di protesta scherzosa, non una garanzia di risate.

**Riutilizzo e costo: piccolo.** Stesso componente, stessi controlli, conteggio già presente e contenitore della battuta finale. Servono poche condizioni e testi locali, con feedback accessibile aggiornato. Non si riscrivono le altre prove o il certificato in questa iterazione. Il rischio da verificare è che aumentino soltanto le parole lette, senza rendere più interessante l’azione.

### 2. Curare la home come un invito concreto e togliere i giochi futuri dalla vetrina pubblica

**Problema ed evidenza.** La home mette davanti una raccolta di prototipi, tre dei quali indisponibili. Bacarodex viene prima pur richiedendo una persona preparata; il QR attuale lo apre direttamente. Fonti: `GameCenterHome.svelte` e `ShareQr.svelte`.

**Modifica concreta.** Presentare Are You an AI? come ingresso immediato; mantenere Bacarodex come proposta esplicitamente legata all’incontro con un membro. Togliere le tre schede “In arrivo” dalla home dell’evento, lasciando i concept nella documentazione del gruppo. Cambiare il QR destinato alla diffusione generale perché apra `/#/`; il collegamento diretto `/#/bacarodex` rimane utile quando un membro sta invitando qualcuno proprio a quell’attività. Non serve aggiungere un generatore con più modalità.

**Prima:** “Scegli un gioco, passa il telefono, sfida il buon senso” e cinque titoli.

**Dopo, esempio di invito:** “Fai fare una figuraccia a un robot.” Sotto: “Siamo BacaroTech. Questa è la nostra pausa giocata, aperta a tutti.” Azione principale: “Verificami, allora”. Seconda proposta: “Hai davanti uno di noi? Scopri il Pokémon che ha scelto”, con accesso a Bacarodex.

La promessa sul robot va sostenuta dalla prova, non soltanto dalla scritta: per questo non è la prima modifica consigliata. Per Bacarodex, prima di distribuirne l’invito dal vivo, si usano l’area membri e il consenso esistenti per preparare partecipanti reali e verificarne la disponibilità. Il dato locale `count: 0` non va mascherato con registrazioni o risultati inventati.

**Giocatore e risposta.** Chi apre da solo sceglie un’attività disponibile senza organizzarsi con altri. Chi è con un membro capisce perché scegliere Bacarodex. Il sistema non promette tre esperienze ancora inesistenti.

**Ruolo sociale e identità.** BacaroTech si presenta attraverso ciò che offre al visitatore, senza una barriera promozionale. Il membro può usare lo stesso invito in una frase, senza raccontare la roadmap o introdurre le interviste.

**Perché potrebbe funzionare.** Riduce l’incertezza fra “posso giocare ora” e “serve qualcuno”. Concentra l’attenzione sull’esperienza pronta. È un’ipotesi di orientamento migliore, non una prova che il nuovo titolo aumenti il coinvolgimento.

**Riutilizzo e costo: piccolo.** Taglio e riordino delle schede, riscrittura dell’invito e destinazione del QR. Nessun restyling generale, nuovo gioco o servizio. La preparazione dei membri è lavoro operativo sul flusso esistente, non un requisito per il gioco del robot.

### 3. Dare al membro Bacarodex una parte: una preferenza da raccontare prima della risposta

**Problema ed evidenza.** Il quiz non fornisce ragioni per scegliere e può essere completato provando le quattro opzioni. La preferenza personale del membro esiste già, ma non entra nel gioco.

**Modifica concreta.** Riscrivere la consegna dopo il match: “Prima di scegliere, chiedigli perché ha scelto il suo Pokémon. Deve risponderti senza dire il nome.” Il membro guarda le opzioni se gli serve e dà un indizio vero sulla propria scelta. Non si introducono campi, profili o indizi salvati sul server.

**Prima:** “Bacaro rilevato! Quale Pokémon ha scelto?” → quattro tentativi possibili → cattura.

**Dopo, esempio illustrativo di dialogo:** il giocatore chiede “Perché l’hai scelto?”; il membro risponde “Mi rappresenta: il suo piano è mangiare e tornare a dormire”, se questo è davvero coerente con il Pokémon scelto. Il giocatore formula un’ipotesi e seleziona. Risposta errata: “Non è lui. Chiedigli un indizio diverso.” Alla cattura: “Preso. Ora fatti raccontare il resto della storia.” Si conservano nome e Pokémon nell’esito.

**Giocatore e risposta.** La scelta nasce da qualcosa appena ascoltato. L’app continua ad accettare tentativi: il patto sociale è un invito, non un obbligo controllato. Si può ancora premere tutto; questa modifica non pretende di impedire il comportamento, ma offre un’alternativa più interessante. Se le persone ignorano l’invito, l’ipotesi è smentita.

**Ruolo sociale.** Il membro diventa complice con una sola frase, non un presentatore che deve inventare uno spettacolo. Chi guarda può proporre una lettura dell’indizio. Il Pokémon resta scelto dalla persona, mai dedotto dal viso. Il ricordo aggiuntivo è la storia ascoltata; non viene automaticamente conservato nella scheda digitale.

**Perché potrebbe funzionare.** L’incontro può diventare divertente già al primo membro, senza completare una collezione. Cercarne un altro significa incontrare un’altra scelta e un’altra spiegazione. È una proposta per un’attività con persone presenti: non rende Bacarodex giocabile da soli lontano dal gruppo.

**Riutilizzo e costo: piccolo nel codice, con preparazione dal vivo.** Testi del quiz e dell’esito, membri già registrati, opzioni e catture esistenti. Nessuna modifica al riconoscimento, al backend o agli archivi. Ogni membro deve avere voglia di sostenere questo scambio; se serve un copione lungo, la proposta ha fallito il requisito di semplicità.

## E. Prossima iterazione

**Sceglierei soltanto l’intervento 1: la scena delle finestre.** È già utilizzabile senza preparazione biometrica e permette di verificare l’ipotesi centrale: una reazione specifica all’azione rende il robot un interlocutore con cui viene voglia di discutere?

Confini: modificare la prima prova e la sua risposta finale; mantenere tre finestre, Spegni sempre disponibile, due indizi immediati, riavvio e “Continua”. Nessuna modifica a home, altre prove, certificato, Bacarodex, punteggi, timer o infrastruttura. Anche lo spegnimento immediato deve essere un percorso riuscito. Nessuna attesa obbligatoria per esporre le battute.

Il segnale principale è **un commento spontaneo rivolto al robot o all’osservatore, legato a ciò che il sistema ha appena fatto**. Si annotano le parole e l’azione che lo ha provocato. Segnali aggiuntivi: il giocatore mostra la conseguenza a qualcun altro, l’osservatore interviene senza dare subito la soluzione, oppure al termine viene ricordata la contraddizione del robot.

Un primo esito promettente sarebbe vedere questo comportamento in più di una persona e in entrambi i contesti, senza suggerirlo. Con 3–5 persone è un indizio qualitativo, non una validazione statistica. Se tutti leggono, cliccano e passano oltre, o ricordano soltanto “bisognava spegnere”, abbiamo aggiunto battute senza rafforzare la situazione. Se la nuova prosa aumenta le esitazioni, va accorciata.

La disponibilità dei membri per Bacarodex resta una precondizione operativa da risolvere prima di proporlo pubblicamente, separata da questa piccola iterazione creativa.

## F. Playtest breve con 3–5 persone

### Preparazione

Usare quattro persone, adattando il gruppo a tre o cinque. Non devono conoscere già le soluzioni. Non serve che siano tutti sviluppatori; chiedere solo quanto hanno familiarità con giochi e Pokémon, senza attribuire punteggi di competenza.

Aprire l’app in profili o contesti browser separati, con archivi vuoti, senza cancellare i dati personali esistenti. Provare almeno un telefono e un desktop; annotare dispositivo, eventuali problemi di rete e input usato. Nessuna telecamera necessaria: bastano note dell’osservatore. Non presentare il gioco come un test di intelligenza.

Per la parte Bacarodex, predisporre un membro reale e consenziente con registrazione pubblica valida e verificare il conteggio tramite il flusso esistente. Il partecipante non crea un account. Se il riconoscimento o la disponibilità falliscono, registrare il blocco e separarlo dal giudizio sul quiz; non fingere un match per far proseguire la prova.

Il protocollo può essere usato sulla versione attuale e poi sulla piccola revisione. Per valutare la sorpresa della revisione servono preferibilmente persone nuove: chi ha già visto il trucco non è un confronto equivalente.

### Prova autonoma

Far aprire il link generale a due persone, una alla volta e senza che vedano le altre partite. Dire soltanto: “Questo link è un’attività di BacaroTech durante l’evento. Esploralo come faresti in una pausa; puoi anche smettere.” Non suggerire quale gioco scegliere o quali elementi toccare.

Osservare la prima scelta, cosa pensano significhi “Bacaro”, se riconoscono ciò che è disponibile e quali prerequisiti si aspettano. Nel gioco del robot non spiegare le soluzioni; gli indizi dell’interfaccia restano disponibili. Se chiedono aiuto, annotare la richiesta prima di rispondere “Puoi usare gli aiuti che trovi nella schermata”. Se non vogliono continuare, fermarsi: l’abbandono è un dato, non un errore da correggere verbalmente.

Dopo l’esplorazione spontanea si possono chiedere prove di usabilità esplicite: trovare il ritorno alla home, ricominciare una prova, aprire entrambi gli indizi e ricaricare una route. Registrarle separatamente dalle azioni spontanee: non valgono come segni di coinvolgimento.

### Prova con un’altra persona che guarda

Con le altre due persone, dare il telefono a una e lasciare l’altra libera di osservare e commentare. Un membro BacaroTech introduce con una sola frase: “Qui c’è un robot convinto di saperne più di te”. Poi non anticipa soluzioni e non recita le risposte al posto dell’app.

Osservare se il giocatore orienta il telefono verso l’altro, legge qualcosa ad alta voce o gli rivolge una domanda. Annotare se l’osservatore capisce il nesso fra azione e reazione, resta escluso dalla lettura oppure svela subito il trucco. Dopo la partita lasciare un momento libero: verificare se il passaggio del telefono viene proposto spontaneamente. Solo dopo, offrire il turno a chi guardava, senza interpretare l’accettazione dell’invito come desiderio spontaneo di rigiocare.

La seconda persona conoscerà alcune soluzioni: usare il suo turno per osservare il piacere di interagire e accompagnarsi, non per confrontare velocità o capacità. Con tre partecipanti, fare una prova autonoma e una coppia; con cinque aggiungere un’altra prova autonoma.

Per Bacarodex, osservare un incontro col membro preparato. Prima lasciare agire l’interfaccia attuale: la domanda sul Pokémon nasce da qualcuno oppure vengono provate opzioni in sequenza? Se in futuro si prova l’intervento 3, annotare se basta la nuova consegna o se serve una spiegazione aggiuntiva del conduttore.

### Cosa registrare

| Osservazione | Evidenza da annotare |
|---|---|
| Esitazione o richiesta d’aiuto | Schermata, elemento cercato, frase esatta; distinguere problema di controllo, mancata comprensione e problema tecnico. |
| Sorpresa o indifferenza | Azione immediatamente precedente, commento o gesto osservabile. Un sorriso isolato non dimostra che il gioco sia riuscito. |
| Interazione sociale | Chi parla a chi, cosa mostra, chi propone di passare il telefono; distinguere iniziativa spontanea da suggerimento del conduttore. |
| Rapporto con il robot | Protesta o battuta sulla sua contraddizione, oppure semplice lettura di un testo. |
| Bacarodex | Ragione della risposta, conversazione col membro, eventuale serie di tentativi e cosa viene ricordato della persona. |
| Chiusura e ricordo | Cosa resta dopo aver chiuso la schermata e se viene attribuito a BacaroTech senza suggerire il nome. |

Tre domande finali, senza chiedere soltanto se piace:

1. **“Raccontami cosa è successo, come lo racconteresti a qualcuno che non era qui.”**
2. **“In quale momento hai dovuto fermarti a capire cosa fare, e che cosa pensavi sarebbe successo?”**
3. **“Che cosa ti è rimasto di chi proponeva questa attività?”**

Riportare anche silenzi, parti ignorate e “non ricordo”. “Carino” resta un giudizio generico finché non è collegato a un episodio e a un comportamento. Nessun risultato di questo playtest è stato inventato o anticipato come fatto.

---

Analisi conclusa. È stato scritto soltanto questo report; nessuna modifica all’applicazione, alle dipendenze, ai dati o ai report precedenti.
