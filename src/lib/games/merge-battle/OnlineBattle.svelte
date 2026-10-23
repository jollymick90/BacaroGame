<script lang="ts">
  import SiteHeader from "$lib/game-center/SiteHeader.svelte";
  import { normalizeRoomCode, ROOM_CODE_MAX_LENGTH } from "./room-code";
  import OnlineResult from "./OnlineResult.svelte";
  import CharacterWheel from "./CharacterWheel.svelte";
  import MaintainerBrief from "./MaintainerBrief.svelte";
  import MergeTutorial from "./MergeTutorial.svelte";
  import { DEFAULT_CONFIG } from "./config";
  import { onMount, tick } from "svelte";
  import { characters, trials, resolve, roleCards } from "./engine";
  import type { RoomCommand, RoomView } from "./online";
  import MoveCard from "./MoveCard.svelte";

  type View = RoomView & { code: string };
  let tutorialOpen = $state(false);
  let view = $state<View | null>(null);
  let code = $state("");
  let invite = $state("");
  let busy = $state(false);
  let failure = $state("");
  let expired = $state(false);
  let clock = $state(Date.now());
  let deadline = $state(0);
  let active = true;
  let refreshing = false;
  let latestRequest = 0;
  let mounted = $state(false);
  const rematchRequested = $derived(Boolean(view?.rematchReady?.includes(view.actor)));
  const remaining = $derived(Math.max(0, Math.ceil((deadline - clock) / 1000)));
  const session = $derived(view?.session);
  const myTurn = $derived(
    Boolean(
      view &&
      !view.waiting &&
      !expired &&
      (session?.phase === `character${view.actor + 1}` ||
        session?.phase === `move${view.actor + 1}`),
    ),
  );
  let waitingBanner = $state<HTMLDivElement>();
  const waitingMessage = $derived.by(() => {
    if (!view || !session || expired) return null;
    if (view.waiting) return "Aspettiamo il secondo giocatore";
    if (session.phase === "result" && rematchRequested) return "Rivincita: in attesa dell’altro giocatore";
    if (session.phase === "brief" && view.actor === 1) return "Player 1 avvia il round.";
    if (!myTurn && (session.phase === "character1" || session.phase === "character2")) {
      return "L’altro giocatore sta scegliendo il personaggio";
    }
    if (!myTurn && (session.phase === "move1" || session.phase === "move2")) {
      return "Attendi la carta dell’altro giocatore";
    }
    return null;
  });
  $effect(() => {
    if (!waitingMessage) return;
    void tick().then(() => waitingBanner?.scrollIntoView({ block: "start", behavior: "instant" }));
  });
  const result = $derived(
    session?.phase === "result"
      ? resolve(
          session.ids as number[],
          session.moves as string[],
          session.trial,
          session.config,
        )
      : null,
  );

  async function request(command?: RoomCommand | { type: "create" }) {
    if (busy || !active || (!command && refreshing)) return;
    const requestId = ++latestRequest;
    if (command) busy = true;
    else refreshing = true;
    try {
      const targetCode = normalizeRoomCode(code) ?? code.trim().toLowerCase();
      const response = await fetch(
        "/api/merge-battle/rooms" +
          (command ? "" : `?code=${encodeURIComponent(targetCode)}`),
        {
          method: command ? "POST" : "GET",
          headers: command ? { "Content-Type": "application/json" } : {},
          body: command
            ? JSON.stringify({
                ...command,
                code: targetCode,
                revision: view?.revision ?? 0,
              })
            : undefined,
        },
      );
      const data = await response.json();
      if (!active || requestId !== latestRequest) return;
      if (!response.ok) {
        if (response.status === 410) expired = true;
        if (response.status === 403 && !command && !view) return;
        throw new Error(
          data.message || "Connessione non disponibile. Riprova.",
        );
      }
      view = data;
      code = data.code;
      expired = false;
      deadline = Date.now() + data.expires - data.serverNow;
      clock = Date.now();
      const url = new URL(window.location.href);
      url.searchParams.set("room", code);
      window.history.replaceState({}, "", url);
      invite = url.href;
      failure = "";
    } catch (cause) {
      if (!active || requestId !== latestRequest) return;
      failure =
        cause instanceof Error ? cause.message : "Connessione non disponibile.";
    } finally {
      if (command) busy = false;
      else refreshing = false;
    }
  }
  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(invite);
    } catch {
      failure = "Copia il link dal campo invito.";
    }
  }
  onMount(() => {
    active = true;
    mounted = true;
    code = new URL(window.location.href).searchParams.get("room") || "";
    if (code) void request();
    const tick = window.setInterval(() => {
      clock = Date.now();
      if (view && remaining === 0 && !expired && !document.hidden) void request();
    }, 1000);
    const poll = window.setInterval(() => {
      if (view && (session?.phase !== "result" || rematchRequested) && !expired && !document.hidden) void request();
    }, 3000);
    return () => {
      active = false;
      window.clearInterval(tick);
      window.clearInterval(poll);
    };
  });
</script>

<svelte:head><title>Merge Battle online · BacaroTech</title></svelte:head>
<SiteHeader sticky compactBrand label="Navigazione Merge Battle online">
  {#snippet actions()}
    <button onclick={() => tutorialOpen = true}>Come si gioca</button>
    <a href="/merge-battle">Cambia modalità</a>
  {/snippet}
</SiteHeader>
<main class="online-battle">
  {#if tutorialOpen}<MergeTutorial config={session?.config ?? DEFAULT_CONFIG} onclose={() => tutorialOpen = false} />{/if}
  <h1>Merge Battle · Online</h1>
  <p>Due dispositivi, una carta a testa. Nessuna registrazione.</p>
  <p>Cerca di vincere e di prendere il polpo.</p>
  {#if failure}<p role="alert">{failure}</p>{/if}
  {#if expired}
    <h2>Tempo scaduto</h2>
    <p>La stanza è chiusa. Il refresh non prolunga la partita.</p>
    <button
      disabled={busy || !mounted}
      onclick={() => request({ type: "create" })}>Crea una nuova stanza</button
    >
  {:else if !view}
    <section aria-label="Accesso alla stanza">
      <button
        disabled={busy || !mounted}
        onclick={() => request({ type: "create" })}>Crea stanza</button
      >
      <form
        onsubmit={(event) => {
          event.preventDefault();
          void request({ type: "join" });
        }}
      >
        <label for="room-code">Codice stanza</label>
        <input
          id="room-code"
          bind:value={code}
          required
          maxlength={ROOM_CODE_MAX_LENGTH}
          placeholder="polpo-laguna-caffe"
          autocomplete="off"
          autocapitalize="none"
        />
        <button disabled={busy || !mounted || !code.trim()}
          >Entra nella stanza</button
        >
      </form>
      <p>
        La stanza attende per 3 minuti. Quando entra il secondo giocatore avete
        3 minuti per giocare.
      </p>
    </section>
  {:else if session}
    <div class="status">
      <strong>Sei Player {view.actor + 1}</strong>
      <span
        >{view.waiting ? "Attesa" : session.phase === "result" ? "Rivincita" : "Partita"}: {Math.floor(
          remaining / 60,
        )}:{String(remaining % 60).padStart(2, "0")}</span
      >
    </div>
    {#if waitingMessage}
      <div class="waiting-banner" bind:this={waitingBanner} role="status" aria-live="polite" aria-atomic="true">
        <span class="waiting-icon" aria-hidden="true">⏳</span>
        <div><p>{session.phase === "result" ? "Gioca di nuovo" : "Attendi il tuo turno"}</p><h2>{waitingMessage}</h2><span>La pagina si aggiorna automaticamente.</span></div>
      </div>
    {/if}
    {#if view.waiting}
      <h2>Invita il secondo giocatore</h2>
      <label for="invite">Link invito</label>
      <input id="invite" value={invite} readonly />
      <button onclick={copyInvite}>Copia link</button>
      <p>Codice: <strong>{view.code}</strong></p>
      <p>
        Puoi ricaricare questa pagina: il tuo posto rimane riservato in questo
        browser.
      </p>
    {:else}
      <p>Il problema da risolvere: <strong>{trials[session.trial].title}</strong></p>
      <MaintainerBrief weights={session.config.weights[session.trial]} activeAxes={session.config.activeAxes} trial={session.trial} name={trials[session.trial].jury} priority={trials[session.trial].intro} />
      {#if session.phase === "character1" || session.phase === "character2"}
        {#if myTurn}<h2>Scegli il tuo Polpodev</h2>{/if}
        {#if myTurn}
          <fieldset class="online-selection" disabled={busy || !mounted}>
            <legend class="selection-label">Selezione del Polpodev</legend>
            <CharacterWheel
              cast={characters.filter(character => session.allowedCharacters.includes(character.id))}
              taken={session.ids.filter((id): id is number => id !== null)}
              config={session.config}
              onchoose={id => request({ type: "character", value: id })}
            />
          </fieldset>
        {/if}
      {:else if session.phase === "brief"}
        <h2>Leggete lo scenario e preparate le carte</h2>
        {#if view.actor === 0}<button
            disabled={busy || !mounted}
            onclick={() => request({ type: "ready" })}>Inizia il round</button
          >
        {/if}
      {:else if session.phase === "move1" || session.phase === "move2"}
        {#if myTurn}<h2>Scegli la tua carta</h2>{/if}
        <p>La carta avversaria resta nascosta fino al risultato.</p>
        {#if myTurn}<fieldset disabled={busy || !mounted} class="cards">
            <legend>Le tue carte</legend>
            {#each roleCards(session.config, session.ids[view.actor]!) as card, index}
              <MoveCard
                {card}
                {index}
                activeAxes={session.config.activeAxes}
                onplay={() => request({ type: "move", value: card.id })}
              />
            {/each}
          </fieldset>{/if}
      {:else if result}
        <OnlineResult {session} actor={view.actor} />
        <section class="rematch-panel" aria-label="Rivincita nella stessa stanza">
          <h3>Un’altra sfida?</h3>
          <p>Stessa stanza e stessi Polpodev. Confermate entrambi per iniziare un nuovo round.</p>
        <button disabled={busy || !mounted || rematchRequested}
          onclick={() => request({ type: "rematch", round: session.round })}>
          {rematchRequested ? "Rivincita richiesta" : "Gioca di nuovo"}
        </button>
        <button
          disabled={busy || !mounted}
          onclick={() => request({ type: "create" })}
          >Crea un’altra stanza</button
        >
        </section>
      {/if}
    {/if}
  {/if}
</main>

<style>
  .online-battle {
    --comic-paper: #fff;
    --comic-panel: #fff;
    --comic-shadow: #0005;
    --comic-border: #172334;
    --comic-ink: #172334;
    --comic-yellow: #ffe252;
    --comic-on-accent: #172334;
    max-width: 1000px;
    margin: auto;
    min-width: 0;
    padding: 24px;
    color: #f6f3ea;
  }
  section,
  .status {
    padding: 20px;
    border: 1px solid #bac8d7;
    border-radius: 12px;
    background: #23232e;
  }
  .status {
    position: static;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }
  .rematch-panel { margin: 24px 0; }
  .rematch-panel h3 { margin-top: 0; font-size: 24px; }
  .rematch-panel button { margin: 8px 8px 0 0; }
  .waiting-banner { display: flex; align-items: center; gap: 16px; margin: 16px 0 24px; padding: 20px; border: 3px solid #ffda66; border-radius: 14px; background: #352f20; color: #fff5d3; scroll-margin-top: 16px; }
  .waiting-icon { font-size: 36px; flex-shrink: 0; }
  .waiting-banner p { margin: 0 0 6px; color: #ffda66; font-size: 14px; font-weight: 850; text-transform: uppercase; }
  .waiting-banner h2 { margin: 0 0 8px; font-size: clamp(22px, 4vw, 28px); line-height: 1.25; }
  .waiting-banner div > span { font-size: 14px; }
  @media (max-width: 500px) { .waiting-banner { align-items: flex-start; padding: 16px; gap: 12px; } .waiting-icon { font-size: 28px; } }
  form {
    margin-top: 24px;
  }
  label {
    display: block;
    margin-top: 16px;
  }
  input {
    display: block;
    width: 100%;
    box-sizing: border-box;
    padding: 12px;
    margin: 8px 0;
  }
  button {
    min-height: 44px;
    padding: 12px 18px;
    border-radius: 8px;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.6;
    cursor: wait;
  }
  .online-selection {
    --comic-paper: #17171f;
    --comic-panel: #23232e;
    --comic-raised: #353544;
    --comic-border: #77758c;
    --comic-ink: #f6f3ea;
    --comic-orange: #ff9d63;
    --comic-display: 'Trebuchet MS', ui-sans-serif, system-ui, sans-serif;
    --comic-teal: #164e58;
    border: 0;
    padding: 0;
    min-width: 0;
  }
  .selection-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
  .cards {
    border: 0;
    padding: 0;
    min-width: 0;
  }
  [role="alert"] {
    color: #892b36;
  }
</style>
