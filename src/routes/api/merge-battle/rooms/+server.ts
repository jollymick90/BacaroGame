import { createHash, randomBytes } from "node:crypto";
import { error, type RequestEvent } from "@sveltejs/kit";
import { body, privateJson, sameOrigin } from "$lib/server/http";
import { firebaseAdmin } from "$lib/firebase/firebase-admin.server";
import { mergeRoomDocument } from "$lib/firebase/game-collections.server";
import { getMergeConfiguration } from "$lib/server/merge-configuration";
import {
  createRoom,
  roomView,
  updateRoom,
  RoomError,
  type Room,
  type RoomCommand,
} from "$lib/games/merge-battle/online";
import type { RequestHandler } from "./$types";

const COOKIE = "bacaro_merge_player";
function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
function identity(event: RequestEvent, create: boolean) {
  let token = event.cookies.get(COOKIE);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    if (!create) error(403, "Entra nella stanza per giocare.");
    token = randomBytes(32).toString("hex");
  }
  if (create) {
    event.cookies.set(COOKIE, token, {
      path: "/api/merge-battle/rooms",
      httpOnly: true,
      secure: event.url.protocol === "https:",
      sameSite: "strict",
      maxAge: 3600,
    });
  }
  return hash(token);
}
function codeFrom(value: unknown) {
  if (typeof value !== "string" || !/^[a-f0-9]{16}$/.test(value))
    error(400, "Codice stanza non valido.");
  return value;
}
function parseCommand(payload: Record<string, unknown>): RoomCommand {
  if (payload.type === "join" || payload.type === "ready")
    return { type: payload.type };
  if (payload.type === "character" && Number.isInteger(payload.value))
    return { type: "character", value: payload.value as number };
  if (
    payload.type === "move" &&
    typeof payload.value === "string" &&
    payload.value.length <= 128
  )
    return { type: "move", value: payload.value };
  error(400, "Mossa non valida.");
}
async function readOrUpdate(
  code: string,
  player: string,
  command?: RoomCommand,
  revision = -1,
) {
  const reference = mergeRoomDocument("room-" + code);
  const room = await firebaseAdmin().db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) return null;
    const current = snapshot.data() as Room;
    const now = Date.now();
    if (now >= current.expires) {
      transaction.delete(reference);
      return null;
    }
    const next = command
      ? updateRoom(current, player, command, revision, now)
      : current;
    // Authorize before exposing or persisting anything.
    roomView(next, player, now);
    if (next !== current)
      transaction.set(reference, {
        ...next,
        expiresAt: new Date(next.expires),
      });
    return next;
  });
  if (!room) error(410, "La stanza non esiste più o è scaduta.");
  return privateJson({ code, ...roomView(room, player, Date.now()) });
}
function fail(cause: unknown): never {
  if (cause instanceof RoomError) error(cause.status, cause.message);
  throw cause;
}
export const GET: RequestHandler = async (event) => {
  try {
    return await readOrUpdate(
      codeFrom(event.url.searchParams.get("code")),
      identity(event, false),
    );
  } catch (cause) {
    fail(cause);
  }
};
export const POST: RequestHandler = async (event) => {
  sameOrigin(event);
  const payload = await body(event, 2048);
  if (
    Object.keys(payload).some(
      (key) => !["type", "code", "value", "revision"].includes(key),
    )
  )
    error(400, "Richiesta non valida.");
  const player = identity(event, true);
  try {
    if (payload.type !== "create") {
      const command = parseCommand(payload);
      if (command.type !== "join" && !Number.isSafeInteger(payload.revision))
        error(400, "Revisione mancante.");
      return await readOrUpdate(
        codeFrom(payload.code),
        player,
        command,
        payload.revision as number,
      );
    }
    const { config } = await getMergeConfiguration();
    const code = randomBytes(8).toString("hex");
    const reference = mergeRoomDocument("room-" + code);
    // Shared across server instances. Never retain the raw client address.
    const rateReference = mergeRoomDocument(
      "rate-" + hash(event.getClientAddress()),
    );
    const room = await firebaseAdmin().db.runTransaction(
      async (transaction) => {
        const rate = (await transaction.get(rateReference)).data();
        const now = Date.now();
        const count = rate && rate.expires > now ? Number(rate.count) : 0;
        if (count >= 8)
          error(429, "Troppe stanze create. Attendi un minuto e riprova.");
        const expires =
          rate && rate.expires > now ? Number(rate.expires) : now + 60_000;
        const judge =
          config.judges[Math.floor(Math.random() * config.judges.length)];
        const created = createRoom(player, now, config, judge);
        transaction.set(rateReference, {
          count: count + 1,
          expires,
          expiresAt: new Date(expires),
        });
        transaction.create(reference, {
          ...created,
          expiresAt: new Date(created.expires),
        });
        return created;
      },
    );
    return privateJson({ code, ...roomView(room, player, Date.now()) }, 201);
  } catch (cause) {
    fail(cause);
  }
};
