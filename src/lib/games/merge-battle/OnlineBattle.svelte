<script lang="ts">
  import { onMount } from "svelte";
  import { characters, trials, resolve, roleCards } from "./engine";
  import type { RoomCommand, RoomView } from "./online";
  import Fighter from "./Fighter.svelte";
  import MoveCard from "./MoveCard.svelte";
  import ScoreComparison from "./ScoreComparison.svelte";
  import ReviewWeights from "./ReviewWeights.svelte";

  type View = RoomView & { code: string };
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
      const targetCode = code.trim().toLowerCase();
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
      if (view && session?.phase !== "result" && remaining === 0 && !expired && !document.hidden) void request();
    }, 1000);
    const poll = window.setInterval(() => {
      if (view && session?.phase !== "result" && !expired && !document.hidden) void request();
    }, 3000);
    return () => {
      active = false;
      window.clearInterval(tick);
      window.clearInterval(poll);
    };
  });
</script>

<svelte:head><title>Merge Battle online · BacaroTech</title></svelte:head>
<main class="online-battle">
  <a href="/merge-battle">← Modalità di gioco</a>
  <h1>Merge Battle · Online</h1>
  <p>Due dispositivi, una carta a testa. Nessuna registrazione.</p>
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
          maxlength="16"
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
        >{view.waiting ? "Attesa" : "Partita"}: {Math.floor(
          remaining / 60,
        )}:{String(remaining % 60).padStart(2, "0")}</span
      >
    </div>
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
      <p>Scenario: <strong>{trials[session.trial].title}</strong></p>
      <ReviewWeights
        weights={session.config.weights[session.trial]}
        activeAxes={session.config.activeAxes}
      />
      {#if session.phase === "character1" || session.phase === "character2"}
        <h2>
          {myTurn
            ? "Scegli il tuo Polpodev"
            : "L’altro giocatore sta scegliendo il personaggio"}
        </h2>
        {#if myTurn}<div class="characters">
            {#each session.allowedCharacters.filter((id) => !session.ids.includes(id)) as id}
              <button
                disabled={busy || !mounted}
                onclick={() => request({ type: "character", value: id })}
              >
                <Fighter {id} /><span>{characters[id].name}</span>
              </button>
            {/each}
          </div>{/if}
      {:else if session.phase === "brief"}
        <h2>Leggete lo scenario e preparate le carte</h2>
        {#if view.actor === 0}<button
            disabled={busy || !mounted}
            onclick={() => request({ type: "ready" })}>Inizia il round</button
          >
        {:else}<p>Player 1 avvia il round.</p>{/if}
      {:else if session.phase === "move1" || session.phase === "move2"}
        <h2>
          {myTurn
            ? "Scegli la tua carta"
            : "Attendi la carta dell’altro giocatore"}
        </h2>
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
        <h2>
          {result.winner === null
            ? "Pareggio!"
            : result.winner === view.actor
              ? "Hai vinto!"
              : "Ha vinto l’altro giocatore!"}
        </h2>
        <ScoreComparison
          cards={session.moves.map((id) =>
            session.config.cards.find((card) => card.id === id)!,
          )}
          weights={session.config.weights[session.trial]}
          activeAxes={session.config.activeAxes}
          labels={["Player 1", "Player 2"]}
        />
        <p>{result.reason}</p>
        <p>Merge: {result.hybrid}</p>
        <button
          disabled={busy || !mounted}
          onclick={() => request({ type: "create" })}
          >Crea un’altra stanza</button
        >
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
  .characters,
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
  }
  .characters button {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .cards {
    border: 0;
    padding: 0;
    min-width: 0;
  }
  [role="alert"] {
    color: #892b36;
  }
</style>
