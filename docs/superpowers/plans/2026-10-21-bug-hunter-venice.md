# Bug Hunter — Venice implementation plan

**Goal:** realizzare il brief Venezia low-poly fornito, senza modificare gameplay e UI.
**Architecture:** ambiente Three.js separato dalla simulazione; primitive condivise e instancing per materiale. Skyline su due profondità, acqua opaca sotto la pista, props riciclati tramite distanza del runner. La camera esistente fornisce parallasse naturale.
**Tech stack:** TypeScript, Three.js 0.171, Node 22; nessuna dipendenza aggiuntiva.

- [x] Creare primitive istanziate condivise, acqua e moduli skyline/props/environment.
- [x] Integrare ambiente, palette e dettagli pontile in scene.ts; preservare Runner, input e UI.
- [x] Verificare riciclo, pausa, reduced motion e risorse; eseguire test Bug Hunter, check e build.
- [x] Verificare browser desktop/mobile e scrivere REPORT_BUG_HUNTER_VENEZIA.md con limiti reali.

Review: monumenti leggibili in portrait; decorazioni fuori dalle corsie; niente doppia parallasse; nessuna allocazione per frame; cleanup delle risorse istanziate.
