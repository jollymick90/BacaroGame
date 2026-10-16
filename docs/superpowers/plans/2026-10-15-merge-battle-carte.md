# Merge Battle: mosse configurabili come carte

Proposta del 15 ottobre 2026. Stato: implementato. Il catalogo viene configurato in Admin → Merge Battle e salvato su Firebase.

## Obiettivo

L’admin crea mosse e ne imposta i valori. Ogni nuova carta può combattere contro tutte le altre senza scrivere un esito per ogni coppia. Si mantengono scelta segreta, passaggio del telefono, lancio simultaneo, giudice e merge visivo. Non sono previsti mazzi da collezionare, acquisti, rarità o account giocatore.

## Modello di gioco proposto

Quattro caratteristiche comuni a dev e data science:

- Rapidità: quanto velocemente la mossa produce un risultato utilizzabile.
- Solidità: quanto il risultato regge errori e condizioni avverse.
- Evidenza: quanto la scelta è sostenuta da verifiche e dati.
- Adattabilità: quanto la soluzione si presta a cambiamenti e riuso.

Ogni carta distribuisce esattamente 12 punti, con interi da 0 a 6 per caratteristica. Le caratteristiche sono assi di gioco, non misure scientifiche della qualità delle pratiche reali. I valori iniziali sono scelte editoriali da provare e correggere.

Esempi, in ordine Rapidità / Solidità / Evidenza / Adattabilità:

| Carta | Valori |
|---|---|
| Hotfix | 6 / 2 / 1 / 3 |
| Test di regressione | 2 / 4 / 5 / 1 |
| Pipeline riproducibile | 1 / 4 / 3 / 4 |

Il giudice assegna pesi interi da 1 a 3 ai quattro assi. Il punteggio è la somma dei valori della carta moltiplicati per i pesi. Vince il punteggio maggiore; a parità si ha un pareggio, con merge comunque disponibile. Nessuno spareggio nascosto per ruolo e nessuna casualità nel verdetto.

Esempio incidente: pesi 3 / 2 / 1 / 1. Hotfix = 26; Test di regressione = 20. Esempio review: pesi 1 / 2 / 3 / 1. Hotfix = 16; Test di regressione = 26. La stessa coppia può quindi avere esiti diversi per ragioni visibili.

Il giudice e i pesi sono mostrati prima della scelta. Il risultato mostra entrambi i calcoli, evidenzia gli assi decisivi e distingue il verdetto di gioco da una raccomandazione tecnica reale. Il budget fisso impedisce carte superiori su tutti gli assi; non garantisce da solo il bilanciamento. L’admin vede le carte che vincono sempre per ciascun giudice e può modificare valori o assegnazioni.

## Configurazione delle mosse

Ogni carta contiene ID stabile, nome, descrizione libera, icona da insieme consentito, quattro valori e stato attivo. I contenuti non vengono riscritti da AI. I personaggi hanno una lista di carte assegnabili: nella prima versione ogni personaggio attivo deve avere esattamente tre carte attive distinte, così il turno resta breve. Una carta può appartenere a più personaggi.

L’admin può creare, duplicare, modificare e disattivare carte; assegnarle ai personaggi; modificare pesi e stato dei giudici; simulare due carte con un giudice; vedere calcoli e pareggi. Niente formule o codice inseribile dall’admin.

I merge restano associati alla coppia di personaggi e avvengono anche in pareggio. La configurabilità degli effetti dei merge non fa parte di questa iterazione.

## Persistenza e compatibilità

Estendere il documento `bacaroGameConfigurations/merge-battle` con uno schema versione 2: catalogo carte, associazioni ruolo-carte, pesi dei giudici, personaggi e giudici abilitati. Conservare il controllo revisioni e i controlli di sessione e origine delle richieste già esistenti. Pubblicare tutto in una transazione unica: nessun riferimento a carte mancanti o disabilitate.

Validare sul server: ID unici, testi entro limiti espliciti (nome 80, descrizione 500 caratteri), massimo 100 carte, valori interi 0–6 con totale 12, pesi interi 1–3, almeno due ruoli e un giudice, tre carte distinte e valide per ruolo attivo. Verificare la dimensione serializzata prima di salvare. Adeguare il limite HTTP attuale di 20 KB con un limite dedicato di 128 KB, senza cambiare quello dei flussi Bacarodex.

Migrare in lettura le configurazioni precedenti preservando personaggi e giudici abilitati. Convertire le mosse attuali in carte con ID stabili e valori editoriali iniziali espliciti. La migrazione viene persistita al successivo salvataggio autorizzato. Non scrivere sul database all’apertura del gioco pubblico.

Ogni partita conserva una copia della configurazione validata con cui è iniziata: pubblicare o disattivare una carta non cambia uno scontro in corso. Il bot sceglie soltanto fra le carte assegnate al proprio ruolo, senza conoscere la scelta corrente dell’avversario.

## Sequenza di implementazione

1. **Modello e regole pure** — creare `cards.ts` con tipi, validazione e risoluzione a punteggio; testare inversione dei giocatori, pesi, pareggi, budget e rifiuto di numeri non finiti. Estendere `config.ts` e i test della migrazione.
2. **Sessioni e motore** — sostituire indici di categorie con ID carte; risolvere i turni sulla copia della configurazione. Estendere `engine.test.ts` per bot, segretezza, rivincite, pareggio e disattivazioni durante una partita. Rimuovere priorità e spareggi legacy.
3. **Editor e Firebase** — estrarre un editor carte da `MergeBattleCatalog.svelte`; aggiungere assegnazioni, pesi e simulatore. Estendere `/api/merge-battle/config` per validazione, payload e salvataggio atomico. Verificare accesso anonimo negato, conflitto 409, riferimenti invalidi rifiutati e rilettura del documento salvato.
4. **Interfaccia di gioco** — trasformare le tre mosse in carte leggibili con quattro valori, mantenere scelta nascosta e mostrare il confronto numerico dopo il lancio. Gestire il pareggio in `MergeBattle.svelte` e `BattleArena.svelte`, senza proclamare un vincitore. Conservare il gitgraph e le alternative a movimento ridotto.
5. **Verifica giocabile** — controlli Svelte, test del motore e delle configurazioni, build; prova browser desktop/mobile di salvataggio admin, nuova apertura pubblica, due giocatori, bot, pareggio e rivincita. Valutare con persone reali se è comprensibile scegliere e se esiste una carta sistematicamente dominante.

## Decisione di design approvata

La proposta usa quattro assi fissi, budget 12 e giudici con pesi: è una prima base deliberatamente semplice. L’utente ha autorizzato l’implementazione di questi assi e della regola di risoluzione. La modifica esplicativa di SRE è indipendente ed è già applicata.

## Verifiche eseguite

- 11 test del motore, carte e configurazione; 6 test delle collezioni; 7 test Bug Hunter.
- Svelte/TypeScript senza errori o warning; build Vite completata (restano i precedenti avvisi di packaging Vercel per dipendenze opzionali).
- Browser Chrome desktop e mobile: creazione carta dal backoffice, assegnazione, salvataggio/rilettura su emulatori Firebase, catalogo ristretto, passaggio segreto, verdetto numerico, pareggio e merge. Nessun overflow nelle schermate del risultato.
- API sugli emulatori: anonimo 401, origine diversa 403, configurazione invalida 400, revisione superata 409, payload eccessivo 413 e configurazione oltre 20 KB accettata.
- Animazione gitgraph e lancio delle carte provati senza movimento ridotto.
- Nessun deploy o salvataggio sul Firebase di produzione. Il test browser ripristina i valori della configurazione locale al termine.

Comando browser: `PLAYWRIGHT_MODULE=<percorso/playwright/index.mjs> node scripts/test-merge-cards-browser.mjs`, con server locale sulla porta 5173 ed emulatori demo attivi.
