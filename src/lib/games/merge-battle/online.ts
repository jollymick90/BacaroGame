import { createSession, input, type Session } from "./engine.ts";
import type { MergeConfig } from "./config.ts";

export const ROOM_DURATION = 180_000;
export type Player = 0 | 1;
export type Room = {
  players: string[];
  session: Session;
  expires: number;
  revision: number;
};
export type RoomCommand =
  | { type: "join" }
  | { type: "character"; value: number }
  | { type: "move"; value: string }
  | { type: "ready" };
export class RoomError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
export function createRoom(
  player: string,
  now: number,
  config: MergeConfig,
  judge: number,
): Room {
  return {
    players: [player],
    session: createSession("local", judge, config),
    expires: now + ROOM_DURATION,
    revision: 0,
  };
}
export function assertLive(room: Room, now: number) {
  if (now >= room.expires)
    throw new RoomError(410, "La stanza è scaduta. Crea una nuova partita.");
}
export function playerIndex(room: Room, player: string): Player {
  const index = room.players.indexOf(player);
  if (index !== 0 && index !== 1)
    throw new RoomError(403, "Entra nella stanza per giocare.");
  return index;
}
export function updateRoom(
  room: Room,
  player: string,
  command: RoomCommand,
  revision: number,
  now: number,
): Room {
  assertLive(room, now);
  if (command.type === "join") {
    if (room.players.includes(player)) return room;
    if (room.players.length === 2)
      throw new RoomError(409, "La stanza è già completa.");
    return {
      ...room,
      players: [...room.players, player],
      expires: now + ROOM_DURATION,
      revision: room.revision + 1,
    };
  }
  const actor = playerIndex(room, player);
  if (room.players.length !== 2)
    throw new RoomError(409, "Attendi il secondo giocatore.");
  if (revision !== room.revision)
    throw new RoomError(
      409,
      "La partita è cambiata. Attendi l’aggiornamento e riprova.",
    );
  let session = room.session;
  try {
    if (command.type === "ready") {
      if (actor !== 0) throw new Error("Attendi che Player 1 inizi il round.");
      session = input(session, { type: "ready" });
    } else {
      session = input(session, { ...command, actor });
    }
    if (session.phase === "handoff")
      session = input(session, { type: "handoff" });
    if (session.phase === "battle")
      session = input(session, { type: "finish" });
  } catch (cause) {
    throw new RoomError(
      409,
      cause instanceof Error ? cause.message : "Mossa non valida.",
    );
  }
  return { ...room, session, revision: room.revision + 1 };
}
export function roomView(room: Room, player: string, now: number) {
  assertLive(room, now);
  const actor = playerIndex(room, player);
  const session = { ...room.session, moves: [...room.session.moves] };
  if (session.phase !== "result") session.moves[1 - actor] = null;
  return {
    actor,
    waiting: room.players.length === 1,
    expires: room.expires,
    serverNow: now,
    revision: room.revision,
    session,
  };
}
export type RoomView = ReturnType<typeof roomView>;
