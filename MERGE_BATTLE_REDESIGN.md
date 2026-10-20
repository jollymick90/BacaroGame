# Merge Battle — Fumetto da Bacaro

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
- Durata percepita, divertimento e comprensione al Codemotion richiedono un playtest con persone.
- Modifiche locali: nessun deploy o commit eseguito.
