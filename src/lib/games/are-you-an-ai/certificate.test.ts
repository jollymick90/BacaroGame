import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PDFDocument, PDFName } from 'pdf-lib';
import { createCertificate } from './certificate.ts';

test('both verdicts produce a one-page A4 PDF with embedded logo and matching metadata', async () => {
  const logo = new Uint8Array(await readFile('public/bacarotech-logo.png'));
  for (const outcome of ['human', 'robot'] as const) {
    const bytes = await createCertificate(outcome, logo);
    const document = await PDFDocument.load(bytes);
    assert.equal(document.getPageCount(), 1);
    assert.equal(Math.round(document.getPage(0).getWidth()), 595);
    assert.equal(Math.round(document.getPage(0).getHeight()), 842);
    assert.match(document.getTitle()!, outcome === 'human' ? /UMANO/ : /ROBOT/);
    assert.ok(document.getPage(0).node.Resources()?.get(PDFName.of('XObject')));
  }
});
