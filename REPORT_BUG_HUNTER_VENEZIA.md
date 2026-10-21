# Bug Hunter — Venezia low-poly

Data: 21 ottobre 2026.

## Analisi e integrazione

La scena originale (`src/lib/games/bug-hunter/scene.ts`) usa Three.js 0.171, camera prospettica a `(0, 5.8, 9)` rivolta verso `(0, 1, -14)`, FOV 58° desktop / 68° portrait, hemisphere light e sole con shadow map 512². Il giocatore resta vicino all'origine e dieci segmenti di pista da 16 unità scorrono tramite `Runner.distance`. La superficie è larga 8 unità; i cordoli arrivano a ±4.55. Le decorazioni precedenti erano 18 edifici riciclati ogni 144 unità.

`Runner` gestisce corsie, salti, collisioni, righe, velocità e punteggio separatamente dalla scena. Questo codice non è stato modificato. Sono rimasti invariati anche input tastiera/touch, UI, quiz e modelli del giocatore, dei bug e degli ostacoli.

## Modifiche realizzate

- Laguna verde turchese opaca, sotto la pista a circa quota −1.1, con piccoli riflessi geometrici e oscillazione lenta. Nessuna texture, trasparenza o riflessione multipass.
- Pista inserita nella laguna come pontile: superficie e segnaletica conservate, cordoli in pietra chiara, giunti e sostegni lignei. Ingombri e riciclo originali invariati.
- Skyline composto intenzionalmente: Campanile con fusto in mattoni, cella campanaria, cuspide rame e punta dorata; Salute con tamburo ottagonale, cupola principale, cupola secondaria e torrette; palazzi stretti con finestre ad arco, tetti in terracotta e camini.
- Due livelli di architettura: rive vicine intorno a z −59 e monumenti/palazzi lontani tra z −76 e −99. Corridoio centrale libero; monumenti avvicinati all'asse per essere visibili in portrait. Campanile spostato rispetto al primo prototipo per ridurre la sovrapposizione con l'HUD.
- Bricole a tre pali inclinati, pali da ormeggio rossi/bianchi e blu/bianchi, gondole con scafo nero, sedili, remo e ferro di prua, lampioni senza luci aggiuntive. Pool di 24 oggetti con alternanza dei lati e variazioni contenute di altezza.
- Palette mattone, ocra, salmone, pietra e rame; luce ambientale coerente con la laguna e fog estesa a 55–155 per mantenere leggibile lo skyline.

## Decisioni tecniche

Il coordinatore `venice-environment.ts` compone i moduli `venice-water.ts`, `venice-skyline.ts`, `venice-props.ts` e `venice-boardwalk.ts`. `venice-primitives.ts` mantiene geometrie e materiali condivisi per singola partita e raggruppa le primitive in `InstancedMesh` per forma/materiale.

La parallasse usa la traslazione prospettica della camera già presente: ampiezza originale `engine.x * 0.08`, ora smorzata nel tempo. Non viene aggiunta una seconda traslazione allo skyline. Le decorazioni vicine rispondono maggiormente delle architetture lontane, senza cambiare le coordinate del giocatore.

Acqua e gondole usano il tempo visivo esistente: pausa e quiz ne congelano il movimento; `prefers-reduced-motion` disattiva le oscillazioni e lo spostamento laterale della camera. Nessun oggetto, materiale o vettore viene creato nell'aggiornamento dell'ambiente.

Cleanup centralizzato nella scena: deduplica di geometrie/materiali e rilascio esplicito degli attributi delle istanze tramite `InstancedMesh.dispose()`. Nessun nuovo listener o animation loop. Nessuna dipendenza o risorsa esterna aggiunta.

## Verifiche

Ambiente: Node 22.20.0, Chrome con WebGL SwiftShader, server Vite locale.

| Verifica | Risultato |
| --- | --- |
| `npm run test:bug-hunter` | 26 test passati |
| `npm run check` | 0 errori, 0 warning Svelte/TypeScript; gateway collezioni valido |
| `npm run build` | Completata con adapter Vercel |
| `scripts/test-bug-hunter-venice.mjs` | Riciclo, ingombri, reduced motion e stabilità risorse passati |
| `scripts/test-bug-hunter-lifecycle.mjs` | Pausa su background, rimozione listener e doppio dispose passati |
| `scripts/test-bug-hunter-viewport.mjs` | Controlli visibili a 375×667 e 667×375 |
| `scripts/test-bug-hunter-browser.mjs` | Desktop 1280×900 e mobile emulato 390×844: cattura, input, pausa, game over, restart, quattro unmount, nessun pageerror |
| `git diff --check` | Nessun problema di whitespace |

Il nuovo test ambiente simula 36.000 aggiornamenti, equivalenti a dieci minuti: numero e identità degli oggetti invariati, memoria renderer stabile a 6 geometrie / 0 texture, pool laterale limitato e riciclo esatto dopo 144 unità. Nella camera campione, **solo l'ambiente** richiede 102 draw call e 15.890 triangoli. La pista usa 5 batch per segmento, mantenendo il numero originale di mesh renderizzabili anche con i nuovi dettagli. Queste misure non rappresentano il costo totale della scena di gioco né un benchmark FPS.

Durante l'ottimizzazione, gli archi delle finestre sono stati separati dalle cupole: il primo test superava il budget di 30.000 triangoli (38.576); la geometria dedicata porta il campione a 15.890. Una prima esecuzione browser mobile ha fallito il controllo dei contesti rilasciati mentre erano in corso modifiche al codice; la successiva esecuzione completa a codice stabile è passata. Nessuna modifica al gameplay è stata necessaria.

Per ripetere i test browser, con Vite avviato:

```sh
PLAYWRIGHT_MODULE=/percorso/playwright/index.mjs node scripts/test-bug-hunter-venice.mjs
```

Gli altri script browser accettano le stesse variabili `PLAYWRIGHT_MODULE` e `TEST_ORIGIN` (default `http://127.0.0.1:5173`). Richiedono Chrome installato. Il test dell'ambiente importa i moduli TypeScript dal server di sviluppo.

## Verifica visiva e limiti

Ispezionate schermate desktop, portrait e landscape: monumenti riconoscibili, pista ad alto contrasto, props esterni alle corsie e controlli visibili. Screenshot della versione finale in `docs/bug-hunter-venice/`.

Resta da verificare la fluidità su smartphone fisici, in particolare dispositivi economici e Safari iOS. SwiftShader e viewport emulati validano rendering e integrazione, ma non dimostrano un determinato frame rate su hardware mobile. La build segnala dipendenze transitive non risolte nel tracing di `google-gax` (`build/package.json`) e `debug` (`supports-color`); termina comunque correttamente. Non sono state cambiate dipendenze o configurazione server.
