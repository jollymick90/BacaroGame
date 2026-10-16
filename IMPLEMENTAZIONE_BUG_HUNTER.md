# Bug Hunter — vertical slice Three.js

## Obiettivo e decisioni

Runner 3D arcade a tre corsie, per desktop e telefono. Il retino cattura automaticamente insetti tridimensionali; tre errori terminano la corsa. Nessun backend, account, archivio o servizio remoto. L'URL diretto è `/#/bug-hunter`, coerente con il router hash del Game Center.

Palette indipendente dalla home: cielo azzurro `#9fe5ed`, pista pesca `#ffd6b1`, dettagli viola `#46328b`, retino corallo, pulsanti gialli. Primitive low-poly, luce emisferica, una luce direzionale con ombra leggera, nebbia prospettica. Intro sopra la scena, HUD essenziale durante la corsa, controlli touch sempre visibili.

## Recupero da gift-secret-santa

Repository individuato: `/Users/jollymick/SProject/gift-secret-santa/gift-secret-santa`.

Analizzati i file `src/games/starship-run/`:

| File sorgente | Recupero e adattamento |
| --- | --- |
| `ui-utils.ts` | Funzione `sinusoid` estratta, `createGroup` e `createBox` adattati e tipizzati in `primitives.ts`. |
| `character.ts` | Gerarchia di testa, busto, braccia e gambe, pivot superiore di `createLimb`, fasi sinusoidali opposte nella corsa. Dimensioni convertite in metri, colori e proporzioni nuovi, aggiunti cappello, barattolo e retino. Salto sinusoidale conservato; stato temporale trasferito alla simulazione. |
| `game.ts` | Architettura runner fermo / mondo che avanza lungo Z, camera prospettica in terza persona, renderer WebGL e luce emisferica. Sostituiti incremento per frame, riferimenti DOM globali, bind ripetuti e loop senza cancellazione con delta time, controlli locali e distruttore esplicito. |
| `tree.ts`, `game.model.ts` | Collisioni fra intervalli sugli assi adattate a hitbox permissive senza dipendenza grafica. |
| `groundsegment.ts`, `constant.ts` | Idea del percorso segmentato conservata; segmenti riciclati senza buchi e con una corsia sempre libera. |

Esaminato anche `src/games/boxy-run/boxy-run-original.ts` per confermare la parentela del runner. Conservato il credito a Wan Fung Chui presente nella base originale. Nessun file del progetto sorgente è stato modificato.

La dipendenza originale è `three ^0.171.0`: qui fissata alla stessa versione `0.171.0`, con `@types/three 0.171.0`. Non sono stati importati MediaPipe, TensorFlow, webcam, riconoscimento facciale, texture o applicazione originale. L'adattamento ricostruisce soltanto contenuti e lifecycle necessari al nuovo gioco sopra le formule e la struttura riutilizzate.

## Architettura

- `mechanics.ts`: simulazione indipendente da browser/Three.js; corsie, salto, velocità, generazione, collisioni, catture, salute e stati.
- `primitives.ts`: costruttori e sinusoidale recuperati.
- `models.ts`: personaggio articolato, retino/barattolo, quattro insetti, tre ostacoli, animazioni procedurali e cartello 500 generato localmente su canvas.
- `content.ts`: nomi, colori, battute e descrizioni della collezione.
- `scene.ts`: scena, pool grafici, rendering, animazioni di cattura, input, resize e rilascio risorse.
- `BugHunter.svelte`: intro, HUD, pausa, risultati e collezione. Import dinamico della scena dentro `onMount`; nessun renderer durante SSR.
- `mechanics.test.ts`: test con `node:test`, senza framework aggiuntivi.

Integrazione lazy nel Game Center, card giocabile e rimozione di «Bug Hunter — In arrivo». Non modificati i sorgenti di Bacarodex, Are You an AI? e Merge Battle.

## Meccaniche

- Tre corsie larghe 2,5 unità, interpolazione laterale, salto sinusoidale di 0,85 secondi e altezza 2,65. Possibile cambiare corsia durante il salto.
- Velocità da 8 a massimo 15 unità/s, crescita lenta e indipendente dal frame rate normale. Delta limitato a 50 ms per evitare salti ingiusti dopo rallentamenti.
- Otto file riciclate, intervallo di 23 unità. Massimo due corsie bloccate; bug nella corsia libera. La distanza minima fra file lascia oltre 1,5 secondi anche alla velocità massima, sufficiente a cambiare due corsie. Prime due file senza ostacoli.
- Ostacoli: tazza gigante, monitor «500», tastiera. Forme distinguibili, segnaletica corallo a terra e hitbox interne al modello. Tutti superabili anche con salto ben anticipato.
- Tre errori, invulnerabilità di due secondi dopo un impatto; oscillazione comica del personaggio. Il terzo porta al game over.
- Heisenbug semitrasparente ma sempre catturabile; Regression Bug con frammenti lasciati dietro; Production Bug rosso e con anello d'allarme; Feature Bug multicolore con corona.
- Cattura automatica per prossimità, senza premere un tasto: braccio e retino si muovono, insetto ruota e si restringe verso il barattolo HUD, particelle e battuta accompagnano il gesto senza fermare la corsa. La collezione conta ogni specie.
- Frecce/A/D per corsie, freccia su/W/spazio per salto; P/Escape/freccia giù/S per pausa. Swipe orizzontali e verso l'alto; pulsanti touch come alternativa.
- Pausa automatica quando la scheda diventa nascosta, ripresa esplicita. Riavvio azzera mondo, salute, distanza e collezione senza ricreare il renderer.

## Risorse e accessibilità

Pool di otto file, mesh delle specie e ostacoli precreate e riusate, dodici particelle riusate, terreno e decorazioni riciclati. Nessun modello o asset remoto. Aggiornamento HUD limitato a circa 10 Hz. DPR massimo 1,5; ombra 512×512; nessun postprocessing.

Cleanup: cancellazione RAF, disconnessione ResizeObserver, rimozione listener tastiera/pointer/visibilità/resize/preferenza movimento/WebGL, disposal deduplicato di geometrie, materiali e texture; rilascio shadow map e renderer, perdita esplicita del contesto e rimozione canvas.

La preferenza di movimento ridotto elimina particelle, sobbalzo e movimento laterale della camera; la corsa necessaria al gameplay resta presente. Pulsanti con etichette, focus dell'arena all'avvio e dopo i controlli, messaggi di stato. Il gioco resta prevalentemente visivo e non pretende equivalenza per un giocatore non vedente.

## Verifica e limiti

- `npm run test:bug-hunter`: **7/7 passati**. Collisione AABB, salto, cattura una sola volta per ciascuna specie, danno effettivo una volta per ostacolo e invulnerabilità, tre errori, reset, pausa e movimento. Verificate 1.000 configurazioni generate; simulazione di dieci minuti a velocità crescente fino al limite, seguendo le corsie libere, con tre vite conservate, oltre 200 catture e pool sempre di otto file.
- `npm run test:merge-battle`: **7/7 passati**, per regressione del gioco precedente.
- `npm run check`: **zero errori e zero warning**.
- `npm run build`: **riuscita**. Rimangono gli avvisi di bundle grandi (incluso Three.js, caricato solo all'apertura del gioco) e quelli già presenti sulle dipendenze opzionali dell'adapter Vercel (`google-gax`, `supports-color`).
- Browser Chrome headless con WebGL software: ciclo intro → corsa → cattura → input → pausa → tre collisioni → game over → restart su 1280×900 e 390×844. Tastiera desktop e pulsanti touch provati, collezione di Heisenbug verificata, zero errori runtime.
- Quattro mount/unmount per viewport: nessun canvas o RAF pendente dopo l'uscita; tutti i contesti WebGL creati risultano persi/rilasciati.
- Test lifecycle isolato: intercettate aggiunte/rimozioni listener di tutti gli EventTarget durante il mount; zero listener residui dopo dispose. Doppia chiamata a dispose sicura. Evento di visibilità simulato: pausa quando nascosto e permanenza in pausa quando torna visibile.
- Revisione indipendente: individuati controlli fuori viewport in landscape a causa dell'altezza minima. Test riprodotto in rosso (pulsanti a 523px in uno schermo alto 375px), poi corretto. Verifica positiva a 375×667 e 667×375. Arena alta quanto lo spazio disponibile, controlli laterali in landscape, risultati con scorrimento interno e touch abilitato nei menu.
- Ispezionati screenshot della intro desktop, corsa desktop/mobile, risultati mobile e landscape. Swipe implementato; la verifica automatica mobile del ciclo usa i pulsanti touch.

Script browser ripetibili, con server sulla porta 5173:

```sh
node scripts/test-bug-hunter-browser.mjs
node scripts/test-bug-hunter-viewport.mjs
node scripts/test-bug-hunter-lifecycle.mjs
```

Richiedono Chrome e un modulo Playwright disponibile: `PLAYWRIGHT_MODULE` può indicarne il percorso. È stato riutilizzato quello già presente nella cache npm, senza aggiungere framework al progetto. I test usano un generatore casuale deterministico solo nel browser di verifica, senza scorciatoie o hook nel gioco distribuito.

Le verifiche mobile sono su viewport emulato, non su dispositivi fisici. Non sono benchmark GPU/FPS: il renderer software del test conferma la funzionalità, non le prestazioni reali.

La durata 60–120 secondi è un obiettivo di playtest, non un limite o una promessa: il gioco continua finché restano possibilità. La grafica usa primitive e animazioni procedurali; niente audio o modelli esterni. Le performance su hardware mobile reale e il bilanciamento richiedono sessioni con persone. La simulazione rallenta anziché saltare collisioni se il dispositivo scende molto sotto 20 fps.

## Avvio

```sh
npm install
npm run dev
# Aprire http://localhost:5173/#/bug-hunter
npm run test:bug-hunter
npm run check
npm run build
```

## Possibili sviluppi successivi (fuori POC)

Audio opzionale, ulteriori ambienti e ostacoli, tutorial adattivo, playtest del bilanciamento, profilo prestazioni su iOS/Android e rendering instanziato per decorazioni più ricche. Nessuna dipendenza da backend prevista per questi miglioramenti.
