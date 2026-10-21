# Bug Hunter guided tutorial implementation plan

**Goal:** aggiungere “Come si gioca” con narrazione e dimostrazioni nella scena reale.
**Architecture:** controller tutorial separato, che prepara otto righe deterministiche del Runner esistente; una sola scena, stesso pool, collisioni e quiz reali. Nessuna modifica alle regole della partita normale.
**Tech stack:** Svelte 5, TypeScript, Three.js; nessuna dipendenza nuova.

- [x] Testare bug mancato, ostacolo, tre Production con potere, quiz senza doppie cure, replay e ripartenza pulita.
- [x] Implementare tutorial.ts e integrare start/next/replay/exit in scene.ts e Snapshot.
- [x] Aggiungere TutorialGuide.svelte, ingresso dall'intro, narrazione richiesta e quiz reale.
- [x] Verificare desktop/mobile, background, quiz e cleanup; check, suite Bug Hunter e build.

Scelte: tutorial guidato con dimostrazioni automatiche; input di movimento bloccati durante le clip per renderle ripetibili; uscita sempre disponibile. Il potere della demo è Production (3 catture, soglia già reale). Il cuore va risolto correttamente per mostrare il recupero: errore non penalizza e consente di riprovare. All'uscita o avvio partita si eliminano progressi e poteri della demo.

## Estensione richiesta durante il lavoro

- Polipo Bacaro arancione con occhiali e hoodie, basato sulle carte Merge Battle, diventa il personaggio 3D giocabile.
- Finale con due obiettivi consecutivi: default 1000m, poi 20 bug aggiuntivi; limiti/configurazione nel documento Bug Hunter esistente e admin.
- Review finale su vittoria e vite esaurite, con catture, errori, poteri e recuperi reali. Tutorial e stress test sono gli unici contesti senza obiettivi.
