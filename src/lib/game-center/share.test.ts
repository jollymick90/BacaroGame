import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gameCenterUrl } from './share.ts';

test('QR opens public home on current deployment without admin path, query or fragment', () => {
  assert.equal(
    gameCenterUrl('https://game.example/qr?token=private#/bug-hunter'),
    'https://game.example/',
  );
  assert.equal(gameCenterUrl('http://192.168.1.10:5173/qr'), 'http://192.168.1.10:5173/');
  assert.equal(gameCenterUrl('https://user:pass@game.example/qr'), 'https://game.example/');
});
