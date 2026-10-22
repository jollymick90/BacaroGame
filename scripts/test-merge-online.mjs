import assert from "node:assert/strict";
import { appendFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const emulator = process.env.FIRESTORE_EMULATOR_HOST;
if (!emulator || !/^127\.0\.0\.1:\d+$/.test(emulator))
  throw new Error("Richiesto emulatore locale isolato.");
const project = "demo-bacaro-online";
const origin = "http://127.0.0.1:5198";
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "--host",
    "127.0.0.1",
    "--port",
    "5198",
    "--strictPort",
  ],
  {
    env: {
      ...process.env,
      DEBUG: "",
      PUBLIC_FIREBASE_USE_EMULATORS: "true",
      PUBLIC_FIREBASE_PROJECT_ID: project,
      PUBLIC_FIREBASE_API_KEY: "demo-key",
      PUBLIC_FIREBASE_AUTH_DOMAIN: project + ".firebaseapp.com",
      FIREBASE_ADMIN_KEY: "",
      FIRESTORE_EMULATOR_HOST: emulator,
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
// Consume output without printing environment-dependent diagnostics.
server.stdout.on("data", (chunk) =>
  appendFileSync("/tmp/online-vite.log", chunk),
);
server.stderr.on("data", (chunk) =>
  appendFileSync("/tmp/online-vite.log", chunk),
);
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      ready = (await fetch(origin + "/api/merge-battle/config")).ok;
    } catch {}
    if (ready) break;
    if (server.exitCode !== null) throw new Error("Server di prova terminato.");
    await delay(500);
  }
  assert.ok(ready, "Server disponibile");
  const { chromium } = await import(
    process.env.PLAYWRIGHT_MODULE || "playwright"
  );
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const first = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const second = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const third = await browser.newContext();
  first.setDefaultTimeout(15000);
  second.setDefaultTimeout(15000);
  const errors = [];
  const a = await first.newPage();
  const b = await second.newPage();
  a.on("pageerror", (error) => errors.push(error.message));
  b.on("pageerror", (error) => errors.push(error.message));
  await a.goto(origin + "/merge-battle/online");
  const createdResponse = a.waitForResponse(
    (response) =>
      response.url().endsWith("/api/merge-battle/rooms") &&
      response.request().method() === "POST",
  );
  await a.getByRole("button", { name: "Crea stanza", exact: true }).click();
  const created = await createdResponse;
  assert.equal(created.status(), 201, await created.text());
  await a
    .getByRole("heading", { name: "Invita il secondo giocatore" })
    .waitFor();
  console.log("PASS: creazione stanza");
  const invitation = await a.getByLabel("Link invito").inputValue();
  const code = new URL(invitation).searchParams.get("room");
  await a.reload();
  await a.getByText("Sei Player 1", { exact: true }).waitFor();
  await a.clock.install();
  await a.route("**/api/merge-battle/rooms?**", (route) => route.abort());
  await b.goto(invitation);
  await b
    .getByRole("button", { name: "Entra nella stanza", exact: true })
    .click();
  await b.getByText("Sei Player 2", { exact: true }).waitFor();
  const endpoint = origin + "/api/merge-battle/rooms";
  async function state(context) {
    const response = await context.request.get(endpoint + "?code=" + code);
    assert.equal(response.status(), 200);
    return response.json();
  }
  // Host missed the join while offline: its old waiting countdown must not end the live game.
  await a.clock.fastForward(181000);
  await a.unroute("**/api/merge-battle/rooms?**");
  await a.clock.resume();
  const joined = await state(first);
  const deadline = joined.expires;
  assert.equal(
    (
      await third.request.post(endpoint, {
        headers: { Origin: origin },
        data: { type: "join", code },
      })
    ).status(),
    409,
  );
  assert.equal(
    (await third.request.get(endpoint + "?code=" + code)).status(),
    403,
  );
  assert.equal(
    (
      await first.request.post(endpoint, {
        headers: { Origin: "https://other.invalid" },
        data: { type: "ready", code },
      })
    ).status(),
    403,
  );
  await a
    .getByRole("heading", { name: "Scegli il tuo Polpodev", exact: true })
    .waitFor();
  await a.getByRole("button", { name: "Frontend Developer", exact: true }).click();
  await a.getByRole("button", { name: "Conferma personaggio", exact: true }).click();
  await b
    .getByRole("heading", { name: "Scegli il tuo Polpodev", exact: true })
    .waitFor();
  await b.getByRole("button", { name: "Backend Developer", exact: true }).click();
  await b.getByRole("button", { name: "Conferma personaggio", exact: true }).click();
  await a.getByRole("button", { name: "Inizia il round" }).click();
  await a
    .getByRole("heading", { name: "Scegli la tua carta", exact: true })
    .waitFor();
  await a
    .getByRole("button", { name: /^Gioca:/ })
    .first()
    .click();
  const hidden = await state(second);
  assert.equal(hidden.session.moves[0], null);
  assert.equal(hidden.expires, deadline);
  const stale = await first.request.post(endpoint, {
    headers: { Origin: origin },
    data: { type: "ready", code, revision: joined.revision },
  });
  assert.equal(stale.status(), 409);
  await b.reload();
  await b.getByText("Sei Player 2", { exact: true }).waitFor();
  await b
    .getByRole("button", { name: /^Gioca:/ })
    .first()
    .click();
  await a
    .getByRole("heading", {
      name: /Hai vinto!|Pareggio!|Ha vinto l’altro giocatore!/,
    })
    .waitFor();
  assert.equal((await state(first)).session.phase, "result");
  assert.ok((await state(second)).expires >= deadline);
  assert.ok(
    await b.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    "Nessun overflow mobile",
  );
  // Expire only this test-created room, using the isolated demo emulator.
  const document = `http://${emulator}/v1/projects/${project}/databases/(default)/documents/bacaroGameMergeRooms/room-${code}`;
  const expire = await fetch(document + "?updateMask.fieldPaths=expires", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: { expires: { integerValue: "0" } } }),
  });
  assert.ok(expire.ok);
  assert.equal(
    (await first.request.get(endpoint + "?code=" + code)).status(),
    410,
  );
  assert.equal((await fetch(document)).status, 404);
  const beforeCookies = await first.cookies(endpoint);
  const oldCookie = beforeCookies.find(value => value.name === 'bacaro_merge_player');
  assert.ok(oldCookie);
  await first.addCookies([{ ...oldCookie, expires: Date.now() / 1000 + 10 }]);
  const racedCreate = await first.request.post(endpoint, {
    headers: { Origin: origin },
    data: { type: "create" },
  });
  assert.equal(racedCreate.status(), 201);
  const raced = await racedCreate.json();
  const joins = await Promise.all(
    [second, third].map((context) =>
      context.request.post(endpoint, {
        headers: { Origin: origin },
        data: { type: "join", code: raced.code },
      }),
    ),
  );
  assert.deepEqual(
    joins.map((response) => response.status()).sort(),
    [200, 409],
  );
  const raceState = await (
    await first.request.get(endpoint + "?code=" + raced.code)
  ).json();
  const move = {
    type: "character",
    code: raced.code,
    revision: raceState.revision,
    value: raceState.session.allowedCharacters[0],
  };
  const moves = await Promise.all(
    [1, 2].map(() =>
      first.request.post(endpoint, { headers: { Origin: origin }, data: move }),
    ),
  );
  assert.deepEqual(
    moves.map((response) => response.status()).sort(),
    [200, 409],
  );
  const cookies = await first.cookies(endpoint);
  const cookie = cookies.find((value) => value.name === "bacaro_merge_player");
  assert.ok(
    cookie && cookie.expires * 1000 > Date.now() + 3500000,
    "Cookie rinnovato senza cambiare identità",
  );
  assert.equal(cookie.value, oldCookie.value, 'Identità preservata al rinnovo');
  assert.deepEqual(errors, []);
  console.log(
    "PASS: due browser, refresh, turni, privacy carte, terzo escluso, CSRF, revisione, scadenza/cancellazione, mobile.",
  );
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
