import { test } from "node:test";
import assert from "node:assert/strict";
import { createRoom, updateRoom, roomView, ROOM_DURATION } from "./online.ts";
import { DEFAULT_CONFIG } from "./config.ts";

const initial = () =>
  createRoom("one", 100, DEFAULT_CONFIG, DEFAULT_CONFIG.judges[0]);
test("waiting and playing each have an absolute three minute deadline", () => {
  const room = initial();
  assert.equal(room.expires, 100 + ROOM_DURATION);
  assert.throws(() =>
    updateRoom(room, "two", { type: "join" }, 0, room.expires),
  );
  const joined = updateRoom(room, "two", { type: "join" }, 0, 200);
  assert.equal(joined.expires, 200 + ROOM_DURATION);
  assert.deepEqual(updateRoom(joined, "two", { type: "join" }, 0, 300), joined);
  assert.equal(roomView(joined, "one", 400).expires, joined.expires);
  assert.throws(() => roomView(joined, "one", joined.expires));
});
test("two slots only, identities private, no moves before join", () => {
  const room = initial();
  assert.throws(() =>
    updateRoom(room, "one", { type: "character", value: 0 }, 0, 101),
  );
  const joined = updateRoom(room, "two", { type: "join" }, 0, 200);
  assert.throws(() => updateRoom(joined, "three", { type: "join" }, 0, 201));
  assert.throws(() => roomView(joined, "three", 201));
  assert.equal("players" in roomView(joined, "one", 201), false);
});
test("turns, stale requests and card secrecy survive the entire round", () => {
  let room = updateRoom(initial(), "two", { type: "join" }, 0, 200);
  const [first, second] = room.session.allowedCharacters;
  assert.throws(() =>
    updateRoom(
      room,
      "two",
      { type: "character", value: second },
      room.revision,
      201,
    ),
  );
  room = updateRoom(
    room,
    "one",
    { type: "character", value: first },
    room.revision,
    201,
  );
  assert.throws(() =>
    updateRoom(room, "two", { type: "character", value: second }, 1, 202),
  );
  room = updateRoom(
    room,
    "two",
    { type: "character", value: second },
    room.revision,
    202,
  );
  room = updateRoom(room, "one", { type: "ready" }, room.revision, 203);
  const card = room.session.config.assignments[first][0];
  room = updateRoom(
    room,
    "one",
    { type: "move", value: card },
    room.revision,
    204,
  );
  assert.equal(roomView(room, "two", 205).session.moves[0], null);
  assert.equal(roomView(room, "one", 205).session.moves[0], card);
  room = updateRoom(
    room,
    "two",
    { type: "move", value: room.session.config.assignments[second][0] },
    room.revision,
    206,
  );
  assert.equal(roomView(room, "two", 207).session.phase, "result");
  assert.equal(roomView(room, "two", 207).session.moves[0], card);
  assert.equal(room.expires, 206 + ROOM_DURATION);
});

test('room codes support three words, spaces and legacy links without accepting paths', async () => {
  const { normalizeRoomCode, isRoomCode } = await import('./room-code.ts');
  const { generateRoomCode } = await import('../../server/merge-room-code.ts');
  assert.equal(normalizeRoomCode(' POLPO Laguna Caffe '), 'polpo-laguna-caffe');
  assert.equal(normalizeRoomCode('be79cfde00ee9218'), 'be79cfde00ee9218');
  for (const invalid of ['../room', 'polpo-laguna', 'a-b-c', 'polpo/laguna/caffe', null, 'polpo-laguna-caffe-extra']) {
    assert.equal(normalizeRoomCode(invalid), null);
  }
  for (let index = 0; index < 100; index++) {
    const code = generateRoomCode();
    assert.equal(isRoomCode(code), true);
    assert.equal(code.split('-').length, 3);
  }
});

test('both players can agree to a rematch in the same room without stale votes restarting later rounds', () => {
  let room = initial();
  room = updateRoom(room, 'two', { type: 'join' }, room.revision, 200);
  const ids = room.session.allowedCharacters.slice(0, 2);
  room = updateRoom(room, 'one', { type: 'character', value: ids[0] }, room.revision, 201);
  room = updateRoom(room, 'two', { type: 'character', value: ids[1] }, room.revision, 202);
  assert.throws(() => updateRoom(room, 'one', { type: 'rematch', round: 0 }, room.revision, 203));
  room = updateRoom(room, 'one', { type: 'ready' }, room.revision, 203);
  room = updateRoom(room, 'one', { type: 'move', value: room.session.config.assignments[ids[0]][0] }, room.revision, 204);
  room = updateRoom(room, 'two', { type: 'move', value: room.session.config.assignments[ids[1]][0] }, room.revision, 205);
  assert.equal(room.expires, 205 + ROOM_DURATION);
  const finished = room;
  const revision = room.revision;
  assert.throws(() => updateRoom(room, 'outsider', { type: 'rematch', round: 0 }, revision, 206));
  room = updateRoom(room, 'one', { type: 'rematch', round: 0 }, revision, 206);
  assert.deepEqual(roomView(room, 'two', 206).rematchReady, [0]);
  assert.equal(room.session.phase, 'result');
  assert.equal(updateRoom(room, 'one', { type: 'rematch', round: 0 }, revision, 207), room);
  assert.equal(room.expires, finished.expires);
  room = updateRoom(room, 'two', { type: 'rematch', round: 0 }, revision, 208);
  assert.equal(room.session.phase, 'brief');
  assert.equal(room.session.round, 1);
  assert.deepEqual(room.players, finished.players);
  assert.deepEqual(room.session.ids, ids);
  assert.deepEqual(room.session.moves, [null, null]);
  assert.deepEqual(roomView(room, 'one', 209).rematchReady, []);
  assert.equal(room.expires, 208 + ROOM_DURATION);
  assert.throws(() => updateRoom(room, 'one', { type: 'rematch', round: 0 }, room.revision, 209));
  assert.throws(() => updateRoom(finished, 'one', { type: 'rematch', round: 0 }, revision, finished.expires));
  room = updateRoom(room, 'one', { type: 'ready' }, room.revision, 210);
  room = updateRoom(room, 'one', { type: 'move', value: room.session.config.assignments[ids[0]][0] }, room.revision, 211);
  room = updateRoom(room, 'two', { type: 'move', value: room.session.config.assignments[ids[1]][0] }, room.revision, 212);
  assert.equal(room.session.phase, 'result');
  assert.throws(() => updateRoom(room, 'one', { type: 'rematch', round: 0 }, revision, 213));

});
