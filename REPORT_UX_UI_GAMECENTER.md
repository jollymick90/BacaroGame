# Redesign e review UX/UI — BacaroTech Game Center

Data: 20 ottobre 2026. Modifiche alle pagine reali del repository SvelteKit/Svelte 5, senza commit o deploy. Stato Git iniziale pulito; `.env`, credenziali, archivi Firebase e configurazione degli emulatori non modificati.

## Materiali e direzione

Esaminati `AGENTS.md`, `README.md`, `IMPLEMENTAZIONE.md`, route, componenti, regole dei giochi e `ANALISI_GAMECENTER_EVENTO.md`. Il vecchio report descriveva una disponibilità diversa: oggi sono implementati Bug Hunter, Merge Battle, Are You an AI? e Bacarodex. Quest'ultimo richiede configurazione server e membri consenzienti registrati; l'archivio locale risulta vuoto.

I riferimenti sono stati recuperati fuori dal repository:

- Prima proposta: `~/Downloads/stitch_bacarotech_arcade_redesign/{code.html,screen.png,DESIGN.md}`.
- Seconda proposta: `~/Downloads/stitch_bacarotech_arcade_social_club/{code.html,screen.png,DESIGN.md}`.
- Review: `~/Downloads/REVIEW_UX_UI_BACAROTECH.md`.

Non esistono nel progetto file chiamati `code(1).html` o `DESIGN(1).md`: la seconda alternativa è disponibile nella cartella indicata. Entrambi gli screenshot sono stati esaminati. Gli HTML sono stati usati come riferimenti della stessa home, senza importarli come nuove pagine, né aggiungere Tailwind/CDN. I DESIGN originali sono materiali esterni, non specifiche introdotte nel progetto: i contatori, tag e menu che prescrivono non sono stati adottati.

Piano applicato: semplificare la scelta in home, uniformare cornici e controlli delle esperienze esistenti, quindi provare il risultato nei browser e correggere i problemi emersi.

## Scelte visive e testi

- Fondo grafite `#15151B`, pannelli `#23232E`, testo `#F6F3EA`, testo secondario `#B8B8CA`. Accenti menta, lavanda, ambra e verde per i giochi; arancio per condivisione e focus. Token condivisi in `src/style.css`.
- Ripresi dalla prima proposta il retino/insetto, le carte con simboli dello scontro, il sorriso con Poké Ball e il robot giallo. Adattati in SVG locali, senza font di icone, richieste remote o immagini contenenti titoli. Logo ufficiale esistente riutilizzato.
- Titoli con Trebuchet MS già usato dal progetto, corpo con lo stack sans-serif esistente. Nessuna dipendenza o servizio font aggiunto. Pulsanti con ombra netta e pressione visibile; nessuna animazione decorativa continua.
- Home a due colonne su desktop, una su mobile; contenitore fino a 1120 px, copertine da 168/120 px. Testi non troncati, titoli non duplicati, un link principale per scheda. Titolo iniziale: «Scegli un gioco.»
- Tolti slogan e sottotitoli sovrapposti, giochi futuri, roadmap, badge/categorie, numeri ROM, pseudo-statistiche e navigazione decorativa. Nessuna promessa di GPS, cultura lagunare, classifiche o multiplayer online.
- Merge Battle: «Scegli la tua mossa e sfida il verdetto del maintainer», con una sola nota «Da solo o in due sullo stesso dispositivo». Azioni «Gioca in due» e «Gioca da solo» prima delle istruzioni dettagliate, disponibili in «Come si gioca». Criteri e pesi restano visibili durante la partita.
- Bacarodex: incontro con un membro e scelta del suo Pokémon, disponibilità letta dall'API esistente. Con archivio vuoto non appare «Gioca», ma «Apri Bacarodex» con spiegazione. Consenso, descrittore, conservazione locale, errori e limitazioni del riconoscimento rimangono leggibili.
- Are You an AI?: «Un robot non crede che tu sia umano». Mantenuti inganni, battute situazionali, tre prove casuali, indizi, reset, modalità senza scadenza e certificati. Il certificato resta un documento chiaro dentro la cornice scura; il PDF mantiene il formato esistente.
- Bug Hunter: «Corri, salta e riprendi i bug scappati», «Inizia», «Riprendi», «Riprova», «Fine della corsa». Controlli e perdita vite restano subito visibili; soglie delle abilità consultabili prima di iniziare. Scena 3D e regole non modificate.
- Un solo accesso «Invita» nella home. `/qr` raccoglie QR, copia, download e condivisione nativa se disponibile. URL ricavato dall'origine corrente e diretto a `/#/`; un indirizzo locale rimane locale. Nessun invio automatico.

## Pagine e file modificati

| Area | File principali | Intervento |
| --- | --- | --- |
| Home e navigazione hash | `src/lib/game-center/GameCenterHome.svelte`, `GameCenter.svelte`, nuovo `GameCover.svelte` | Schede, disponibilità Bacarodex, Invita, contenitore scuro e ritorno alla home |
| Fondamenta | `src/style.css`, `src/app.html` | Token, pulsanti condivisi, focus, tema browser; lingua italiana e zoom consentito preservati |
| Are You an AI? | `src/lib/games/are-you-an-ai/AreYouAnAI.svelte`, `Robot.svelte`, `CloseWindows.svelte`, `Loading99.svelte`, `MathTrap.svelte`, `SelectRobot.svelte` | Cornice, testo, contrasto, feedback, focus delle X; nessuna modifica alle soluzioni |
| Bacarodex | `src/lib/games/bacarodex/Bacarodex.svelte` | Tema limitato al gioco pubblico, navigazione, istruzioni; moduli e backend preservati |
| Bug Hunter | `src/lib/games/bug-hunter/BugHunter.svelte` | Intro, istruzioni espandibili, HUD, pausa e risultato |
| Merge Battle | `src/lib/games/merge-battle/MergeBattle.svelte`, `MoveCard.svelte`, `Fighter.svelte`, `BattleArena.svelte` | Intro più breve, comandi, leggibilità carte, figure e arena |
| Invito | `src/routes/qr/+page.svelte` | QR e condivisione nello stesso punto, errori distinti, conferma copia affidabile |
| Verifiche | nuovo `scripts/test-redesign-browser.mjs`; aggiornati `test-gameplay-and-qr-browser.mjs`, `test-face-preview-browser.mjs`, `test-bug-hunter-browser.mjs`, `test-bug-hunter-viewport.mjs`, `test-merge-battle-animation.mjs`, `test-merge-cards-browser.mjs` | Casi nuovi per rischi reali e selettori aggiornati ai nuovi nomi delle azioni |
| Documentazione | `README.md`, questo report | Indicazioni di navigazione e condivisione aggiornate |

## Problemi trovati e corretti nella review

La review ha incluso lettura del diff, una seconda revisione indipendente del codice e screenshot delle pagine reali.

1. **Colori ereditati dal nuovo tema:** testo chiaro su superfici chiare delle prove e facce dei personaggi. Impostato esplicitamente il colore scuro su questi oggetti; feedback esterni con testo secondario chiaro.
2. **Hover con contrasto insufficiente:** vecchie regole globali cambiavano lo sfondo dei pulsanti QR e delle schede di navigazione Bacarodex. Specificati insieme sfondo e testo per hover e selezione. Escluso l'avviso di configurazione dal colore generico dei paragrafi.
3. **Focus debole negli overlay scuri:** anello arancione su pausa e risultato di Bug Hunter. Focus visibile mantenuto anche sul robot, senza aggiungere bordi che suggeriscano la soluzione.
4. **X delle finestre e tastiera:** la sparizione temporanea del pulsante buttava il focus sul documento. Ora il focus va a una X ancora presente, o al desktop simulato se nessuna è disponibile. Conservate chiusura e riapertura dopo 400 ms, senza trasformare lo scherzo in un dialogo modale.
5. **Avvio Merge Battle troppo lontano:** opzioni di gioco spostate sopra le regole estese; le istruzioni sono espandibili senza perdere esempi, attributi o pesi.
6. **Grafica di sfondo Merge Battle:** i tracciati SVG ereditavano un riempimento che produceva grandi chiazze dietro al contenuto. Rimosso il riempimento, conservati i rami.
7. **Bordo chiaro in fondo alla pagina:** il margine dell'ultima sezione usciva dal contenitore scuro. Corretto il contenimento con `display: flow-root`.
8. **Conferma di copia non più valida:** un errore successivo a una copia riuscita poteva lasciare il messaggio precedente. Ora ogni tentativo azzera lo stato e conferma solo dopo `clipboard.writeText` riuscita. Cancellazione volontaria della condivisione silenziosa; errore effettivo con alternativa praticabile.
9. **Anteprima del volto:** corretto il contrasto del pulsante durante hover e dei valori numerici dell’embedding; verificato anche il rapporto di contrasto calcolato nel browser.
10. **Leggibilità su mobile:** ingrandite etichette e istruzioni dei giochi precedentemente da 8–11 px; testi lunghi lasciati andare a capo. Menu di Bug Hunter scorrevole nelle altezze ridotte; controlli di partita mantenuti nell'arena.

Nessun dialogo modale personalizzato aggiunto. Le finestre del rompicapo sono intenzionalmente non modali; il reset delle catture usa ancora la conferma nativa del browser, con gestione del focus propria della piattaforma.

## Verifiche

Risultati finali delle verifiche riportati a completamento dell'esecuzione.

## Limiti

- Browser desktop Chrome e viewport touch/emulati: non sostituiscono una prova fisica su iPhone/Android o un playtest con partecipanti al Dev Fest.
- Bacarodex locale senza membri reali: scansione, quiz e cattura sono verificati con fixture sintetiche nel browser, senza registrare persone nel database. Nessuna nuova verifica di accuratezza biometrica, fotocamera fisica o login Google cloud.
- La condivisione del sistema operativo viene verificata tramite API simulata per successo, errore e annullamento; non viene inviato alcun messaggio ad altre persone.
- Nessuna pubblicazione: la versione online non viene modificata da questo lavoro.
