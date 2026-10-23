# Aggiornamento: ruota trascinabile — 21 ottobre 2026

La ruota segue il dito o il mouse in entrambi i sensi, anche quando il gesto parte sopra un personaggio. Il ruolo più vicino alla freccia si colora durante il movimento; al rilascio la ruota si allinea al personaggio disponibile più vicino. Il ruolo già preso da Player 1 viene escluso. Un trascinamento non genera una selezione accidentale al rilascio; il semplice tocco continua a funzionare.

Restano il sorteggio, la conferma esplicita e i comandi da tastiera. Durante il trascinamento conferma e sorteggio sono disabilitati. L’annullamento del gesto ripristina la scelta precedente, anche interrompendo un’animazione. Nessuna modifica a regole, punteggi o modalità; il multiplayer rimane locale come confermato dall’utente.

Verifiche: `npm run check` senza errori o avvisi; 18 test di Merge Battle passati, inclusi continuità degli angoli e aggancio al ruolo disponibile; build completata. Restano gli avvisi di bundle/chunk del riconoscimento e tracing Vercel già presenti. `scripts/test-merge-wheel-drag.mjs` verifica trascinamento mouse e touch, entrambi i versi, selezione durante il gesto, rilascio, esclusione dei ruoli occupati e annullamento anche durante un’animazione. Touch verificato tramite emulazione Chrome, non su un telefono fisico. La revisione ha individuato e corretto il ripristino dell’angolo dopo l’annullamento.

Per ripetere il test con server locale: `TEST_ORIGIN=http://127.0.0.1:5187 node scripts/test-merge-wheel-drag.mjs`, impostando `PLAYWRIGHT_MODULE` se Playwright è esterno al progetto.

---

# Aggiornamento: tema condiviso, navigazione e ruota — 20 ottobre 2026

Merge Battle ora usa gli stessi token scuri del Game Center: sfondo `--arcade-bg`, pannelli `--arcade-panel`, testo `--arcade-text` e accento `--arcade-orange`. Il precedente sfondo crema era una scelta specifica del redesign a fumetti; è stato rimosso sia dalla cornice del router sia da ingresso, carte, scenario, arena e risultato. Le illustrazioni Polpodev e i contrasti dei riquadri gialli rimangono riconoscibili.

La navigazione del gioco ha una sola sede: barra superiore sticky con ritorno al Game Center e cambio modalità. Nel risultato compaiono nella stessa barra Rivincita e Cambia personaggi. Le azioni della partita (conferma personaggio, scelta della carta, passaggio di turno e reveal) rimangono accanto al contenuto su cui agiscono. Rimosso il duplicato del ritorno dalla cornice esterna; la pagina di errore configurazione conserva il proprio collegamento alla home.

`CharacterWheel.svelte` sostituisce la griglia: tutti i ruoli abilitati dall’admin sono disposti su una ruota, grigi finché non vengono scelti. Un personaggio selezionato ha colori originali, bordo e segno di spunta; un’anteprima centrale e il nome completo rendono leggibili i dettagli anche sul telefono. La scelta manuale o il pulsante Gira la ruota richiedono conferma. Il sorteggio esclude il personaggio già preso da Player 1. Durante i 2,2 secondi del giro le scelte sono bloccate; con movimento ridotto l’esito è immediato. Frecce/Home/End spostano il focus; Invio e Spazio usano i normali pulsanti. Il timer viene eliminato uscendo dal selettore.

Corrette due interferenze del CSS globale: dimensione intrinseca delle miniature dentro i pulsanti e trasformazione `button:active` che spostava il bersaglio durante il clic. Motore, scenari, mosse, catalogo e punteggi non sono cambiati.

## Multiplayer

La modalità esistente resta 1 vs computer o 1 vs 1 sullo stesso telefono, indicata esplicitamente nella schermata iniziale. Due telefoni sono tecnicamente fattibili, ma richiedono stanze, inviti, credenziali dei giocatori, stato autorevole lato server, mosse segrete e gestione delle disconnessioni. È stata chiesta una scelta separata di ambito; questa modifica UI non introduce né presenta come disponibile il multiplayer online. Nessuna nuova collezione, API di partita o scrittura Firebase.

## Verifica di questo aggiornamento

- `npm run check`: zero errori e zero avvisi.
- `npm run test:merge-battle`: 16 test passati.
- `npm run build`: completata; restano i warning preesistenti di tracing Vercel (`metadataResolver`, `supports-color`).
- Nuovo test `scripts/test-merge-wheel-browser.mjs`: tema, navigazione, selezione manuale/casuale, esclusione del ruolo occupato, conferma, scontro locale e larghezze 1280/390/320 px. Screenshot in `/tmp/merge-wheel-*.png`, controllati visivamente.
- Test della ruota passato anche con animazione normale, navigazione da tastiera, uscita durante il giro e movimento ridotto. La revisione indipendente ha individuato il focus fuori schermo in orizzontale: corretto con scrollIntoView e margini per la barra sticky, verificato a 844×390.
- Suite redesign mobile: 18 scontri completati, tutti gli otto scenari in solo/local, cataloghi ristretti, carte lunghe, 320 px, animazione e uscita durante lo scontro.
- Suite parametri admin passata: salvataggio/ricaricamento, snapshot anteprima, simulatore e 8 ulteriori scontri solo/local con uno, due e quattro parametri.
- Test del router: SSR, idratazione, configurazione condivisa, cronologia, refresh, link legacy e recupero dagli errori passati.
- I test browser esistenti sono stati adattati alla conferma esplicita del personaggio. Le prove non scrivono configurazioni di produzione. Il vecchio script admin che modifica gli emulatori è stato aggiornato ma non eseguito; la suite parametri usa fixture pubbliche e sessione locale protetta dal controllo emulatori.

Il report seguente descrive il redesign precedente; i riferimenti al tema crema e alla selezione a griglia sono storici.

---

# Merge Battle — Fumetto da Bacaro

## Aggiornamento: parametri selezionabili e confronto dei punti

Su richiesta successiva al redesign, il motore e la configurazione supportano ora `activeAxes`. Il default è `[0, 1]`: **Rapidità e Solidità**. Evidenza e Adattabilità sono assenti da pesi, carte, aiuto e confronto pubblico, e non influiscono sul totale o sui pareggi finché non vengono abilitate.

In **Admin → Merge Battle → Parametri dello scontro** le checkbox permettono da uno a quattro parametri. Il salvataggio pubblico conserva la selezione; anteprime e partite già iniziate mantengono la propria copia. Simulatore, confronto e controllo del bilanciamento usano gli stessi parametri attivi.

Le vecchie configurazioni v2 senza il campo ricevono il default a due in lettura, senza scritture automatiche. Valori e pesi degli esclusi restano salvati per la riattivazione. Il budget editoriale storico resta di 12 punti complessivi sui quattro valori: non vengono redistribuiti automaticamente. L’editor rende consultabili e modificabili gli esclusi in un dettaglio dedicato. Cambiare i parametri modifica gli esiti: il controllo del bilanciamento serve a valutare le carte con la nuova scelta.

`ScoreComparison.svelte` mostra le carte affiancate: per ogni parametro **valore × peso = punti**, vantaggio della riga e totale. Il totale decide il vincitore; vincere più righe non è una regola di spareggio. Il confronto compare durante la battaglia e si può riaprire nel risultato. I nomi delle mosse identificano entrambe le colonne.

Verifiche dell’aggiornamento: **16/16 test** del motore, validazione, snapshot e API; `npm run check` con **0 errori e 0 warning**; build completata con i soli avvisi Vercel già documentati sotto. La prova `scripts/test-merge-axes-browser.mjs` verifica l’admin (default legacy, minimo un parametro, salvataggio/ricarica, anteprima immutabile, simulatore) e **8 battaglie singolo/due giocatori** con selezioni `[0,1]`, `[1]`, `[1,3]`, `[0,1,2,3]`, a 390 e 320 px. Controllati assenza dei parametri esclusi, punteggi e nessun overflow/errore runtime. Screenshot ispezionati in `/tmp/merge-axes-moves.png`, `/tmp/merge-axes-comparison.png` e `/tmp/merge-axes-admin.png`.

La prova browser usa login solo sugli emulatori demo, con guardia esplicita, e intercetta la configurazione per evitare scritture Firebase. Il test API usa route, validazione, cache e gateway reali con il solo I/O Firebase sostituito in memoria: verifica migrazione senza scritture, roundtrip della selezione, invalidazione della cache, revisione obsoleta e input non autorizzati/invalidi. Nessuna modifica a dati cloud. Review indipendente completata; aggiunti i nomi delle carte nel confronto dopo la segnalazione della revisione. Restano i limiti di verifica su dispositivi fisici e screen reader indicati sotto.

Per ripetere il nuovo browser test con il server locale attivo: `TEST_ORIGIN=http://127.0.0.1:5187 node --experimental-strip-types scripts/test-merge-axes-browser.mjs`, impostando `PLAYWRIGHT_MODULE` se Playwright è disponibile fuori dal progetto.

Le sezioni seguenti documentano il redesign iniziale; l’affermazione storica di motore invariato è superata da questo aggiornamento richiesto.


Redesign implementato il 20 ottobre 2026 nell’applicazione reale. Nessun deploy eseguito.

## Risultato e perimetro

Merge Battle usa ora i dodici Polpodev illustrati, con palette crema, petrolio e arancione, contorni marcati, ombre nette e composizioni da vignetta. Gli avatar CSS generici e i grafi decorativi sono stati rimossi.

Il catalogo, gli ID dei dodici ruoli, le mosse, gli otto scenari, i punteggi, la macchina a stati e la configurazione admin non sono stati modificati: `catalog.ts`, `engine.ts`, `cards.ts` e `config.ts` hanno diff vuoto. Restano la selezione immediata, il bot che sceglie prima del giocatore, le carte segrete, il passaggio del telefono e la rivincita con rotazione dello scenario. Nessuna dipendenza aggiuntiva.

## Schermate e componenti

- **Ingresso:** copertina con due Polpodev, balloon, modalità singolo/1 vs 1 ben distinte e regole consultabili sotto “Come si gioca”.
- **Casting:** roster visivo a sei, quattro o due colonne; mascotte grandi, etichette brevi, nomi completi accessibili e personaggio già preso disabilitato e contrassegnato.
- **Scenario:** vignetta con sfidanti, problema e maintainer; pesi sempre leggibili prima della scelta. Si conserva il significato della moltiplicazione dei quattro attributi.
- **Mosse:** tre carte con nomi e valori confrontabili, indicatori visivi su desktop, versione compatta su mobile. Le descrizioni configurate dall’admin restano consultabili su richiesta.
- **Passaggio:** schermata autonoma e opaca senza carta, nome o ID della prima scelta nel contenuto renderizzato.
- **Scontro:** due illustrazioni intere, VS, carte coperte, countdown scenografico, reveal, breve movimento delle carte e punteggi. Il vincitore viene evidenziato senza deformare o specchiare le illustrazioni.
- **Risultato:** esito e punti, spiegazione breve, duo illustrato con il nome del merge, rivincita e cambio personaggi. “Perché questo risultato?” contiene gli otto calcoli attributo × peso e il totale delle due carte.

`MergeBattle.svelte` orchestra le schermate mantenendo gli eventi originali. `Fighter.svelte` rende immagini responsive; `MoveCard.svelte` gestisce la singola carta; `BattleArena.svelte` la scena; `ReviewWeights.svelte` presenta i pesi. `character-art.ts` centralizza la mappatura usata dal rendering. `GameCenter.svelte` applica lo sfondo del fumetto soltanto alla route Merge Battle.

Il merge finale mostra i due personaggi alleati: non viene simulata una tredicesima illustrazione ibrida. Il nome del merge continua a provenire dal motore.

## Art direction

Crema `#fff6e5`, inchiostro `#102f36`, petrolio `#164e58`, arancione `#ff901c`, giallo `#ffda66`, azzurro `#d8edf0`. Trebuchet MS pesante e inclinazioni controllate per i titoli, sans-serif di sistema per lettura e punteggi. Nessun font remoto, sfumatura generica o sfondo astratto. I testi estesi sono raccolti nei dettagli; le mascotte portano l’identità BacaroTech.

## Mappatura verificata visivamente

Sono stati esaminati tutti i dodici PNG originali in una tavola di contatto e confrontati con l’anteprima presente in `polpo/`. Le associazioni dipendono dagli accessori, non dall’ordine dei file. Nessuna immagine è risultata ambigua. Il manifest pubblico conserva anche queste prove visive.

| ID | WebP | Originale in `polpo/` | Indizio visivo |
|---|---|---|---|
| 0 | `frontend.webp` | `Immagine ChatGPT 20 ott 2026, 18_29_19-1.png` | Browser e componenti UI |
| 1 | `backend.webp` | `Immagine ChatGPT 20 ott 2026, 18_29_21-2.png` | Server, cavo e chiave inglese |
| 2 | `full-stack.webp` | `Immagine ChatGPT 20 ott 2026, 18_29_22-3.png` | Browser e database collegati |
| 3 | `platform.webp` | `Immagine ChatGPT 20 ott 2026, 18_32_06-2.png` | Container, Kubernetes e strumenti |
| 4 | `sre.webp` | `Immagine ChatGPT 20 ott 2026, 18_29_23-4.png` | Monitor, allarme e ricetrasmittente |
| 5 | `security.webp` | `Immagine ChatGPT 20 ott 2026, 18_29_24-5.png` | Scudo e lucchetto |
| 6 | `qa.webp` | `Immagine ChatGPT 20 ott 2026, 18_29_25-6.png` | Lente, bug e checklist |
| 7 | `database.webp` | `Immagine ChatGPT 20 ott 2026, 18_29_27-7.png` | Database e query SELECT |
| 8 | `data-engineer.webp` | `Immagine ChatGPT 20 ott 2026, 18_29_28-8.png` | Tubazione e flusso di blocchi dati |
| 9 | `data-scientist.webp` | `Immagine ChatGPT 20 ott 2026, 18_29_29-9.png` | Esperimenti, provetta e laptop |
| 10 | `ml-engineer.webp` | `Immagine ChatGPT 20 ott 2026, 18_32_04-1.png` | Rete neurale, server e cloud |
| 11 | `analytics.webp` | `Immagine ChatGPT 20 ott 2026, 18_32_07-3.png` | Dashboard e grafici |

I file derivati sono in `public/images/merge-battle/`; l’associazione documentale completa è in `manifest.json`. Gli originali e `polpo/preview.png` non sono stati modificati né eliminati.

## Asset e performance

24 WebP RGBA: versioni 640×640 e 320×320 per ciascun ruolo. Conversione con Pillow, filtro Lanczos, qualità WebP 85 e metodo 6. Trasparenza verificata su ogni file: canale alpha da 0 a 255. Totale **1.157.762 byte**, contro **14.566.807 byte** dei dodici PNG originali, includendo entrambe le risoluzioni.

`srcset`/`sizes` selezionano la risoluzione; dimensioni esplicite riservano lo spazio, il roster usa lazy loading, i protagonisti delle schermate eager loading, con decodifica asincrona. Nessun CDN o servizio grafico esterno.

## Accessibilità e revisione

- Pulsanti nativi azionabili da tastiera, ordine di tabulazione naturale, focus visibile petrolio/blu e focus del titolo al cambio schermata.
- Le immagini decorative hanno testo alternativo vuoto; i ruoli sono nominati nei pulsanti o accanto alle immagini.
- I valori delle carte sono collegati ai pulsanti con `aria-describedby`, così sono disponibili anche quando il focus è sulla scelta.
- `prefers-reduced-motion` disattiva gli effetti e abbrevia il reveal; nessun timer impone una scelta.
- Testi e dettagli lunghi possono andare a capo. Nessuna scelta nascosta viene renderizzata durante il passaggio.
- Tutti i timer di battaglia vengono ripuliti uscendo dalla fase o dal gioco.

Review indipendente del diff e delle schermate desktop, seguita da ispezione visiva di ingresso, roster, mosse, arena e risultato desktop/mobile. Correzioni effettuate: esposizione dei valori agli screen reader, precedenza CSS che riduceva il duo finale, larghezza minima della griglia di copertina che causava overflow mobile e focus del collegamento al Game Center. Nessun problema bloccante residuo nella revisione.

## Verifiche eseguite

| Verifica | Risultato |
|---|---|
| `npm run test:merge-battle` | 11/11 passati: motore, carte, configurazioni, simmetria, pareggi, privacy e turni |
| `npm run check` | 0 errori, 0 warning Svelte/TypeScript; audit collezioni passato |
| `npm run build` | Completata, exit 0 |
| `scripts/test-merge-redesign-browser.mjs` | 36 battaglie deterministiche completate, più una sequenza con animazioni normali |
| `scripts/test-merge-battle-animation.mjs` | Passato sulla configurazione servita dal server locale, senza fixture API |
| Audit WebP | Tutti i 24 file presenti, RGBA, dimensioni corrette e alpha preservato |
| `git diff --check` | Pulito |
| Diff motore/catalogo/configurazioni | Vuoto |

La suite browser usa Chrome a **1280×900**, **390×844** e **320×720**. Copre le due modalità su tutti gli otto scenari, vittorie e pareggi, numeri confrontati col motore, rivincita, reset, scelta con Enter, Tab alle carte, descrizioni accessibili, segretezza nel passaggio, movimento ridotto, reveal normale e uscita durante la battaglia. Include catalogo ristretto a Platform/ML, nome carta di 80 caratteri e descrizione lunga. Nessun overflow orizzontale nelle schermate controllate e nessun errore runtime.

La suite del redesign intercetta soltanto la risposta GET della configurazione per rendere riproducibili scenari e mosse; usa i componenti e il motore reali, senza scritture Firebase. Lo script separato delle animazioni legge invece la configurazione reale del server locale. Gli screenshot di verifica vengono generati in `/tmp/merge-redesign/`.

Gli script browser precedenti sono stati adeguati ai nuovi nomi delle azioni. Il vecchio test admin `test-merge-cards-browser.mjs`, che scrive sugli emulatori e richiede una configurazione dedicata in `.env`, non è stato rieseguito: questa modifica non interviene sull’editor o sul backend. Nessuna configurazione condivisa o di produzione è stata scritta.

### Ripetere le verifiche

```sh
npm run test:merge-battle
npm run check
npm run build
npm run dev -- --port 5187 --strictPort
```

Con il server avviato, in un altro terminale (Playwright e Chrome già disponibili):

```sh
TEST_ORIGIN=http://127.0.0.1:5187 node --experimental-strip-types scripts/test-merge-redesign-browser.mjs
TEST_ORIGIN=http://127.0.0.1:5187 node scripts/test-merge-battle-animation.mjs
```

Se Playwright non è installato nel progetto, impostare `PLAYWRIGHT_MODULE` al percorso di un modulo Playwright già disponibile. Nessuna dipendenza è stata aggiunta al progetto. La suite accetta anche `SCREENSHOT_DIR` e `TEST_DEVICE=mobile` o `desktop`.

Eseguire check/build e test browser in sequenza: `svelte-kit sync` e la build aggiornano file osservati dal server di sviluppo e possono ricaricare una pagina durante il test.

## Limiti

- Verifica mobile con viewport Chrome simulati, non su dispositivi fisici iOS/Android.
- Struttura accessibile, focus, descrizioni e movimento ridotto verificati; nessuna sessione manuale con VoiceOver/NVDA.
- La build conserva gli avvisi preesistenti di tracing Vercel per `google-gax/metadataResolver` e `supports-color`; nessun errore di build.
- Durata percepita, divertimento e comprensione al Dev Fest richiedono un playtest con persone.
- Modifiche locali: nessun deploy o commit eseguito.
