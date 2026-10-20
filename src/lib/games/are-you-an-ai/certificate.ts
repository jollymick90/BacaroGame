import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { Outcome } from './trials';

export async function createCertificate(outcome: Outcome, logoBytes: Uint8Array) {
  const document = await PDFDocument.create();
  const robot = outcome === 'robot';
  const title = robot ? 'ROBOT PER ECCESSO DI PRECISIONE' : 'UMANO PER INSUFFICIENZA DI PROVE';
  document.setTitle(title);
  document.setAuthor('BacaroTech');
  document.setSubject('Are You an AI? — certificato scherzoso');
  const page = document.addPage([595.28, 841.89]);
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const logo = await document.embedPng(logoBytes);
  const green = rgb(0.098, 0.243, 0.208);
  const purple = rgb(0.404, 0.259, 0.651);
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 595.28,
    height: 841.89,
    color: rgb(0.941, 0.918, 0.969),
  });
  page.drawRectangle({
    x: 32,
    y: 32,
    width: 531.28,
    height: 777.89,
    color: rgb(1, 0.996, 0.976),
    borderColor: green,
    borderWidth: 2,
  });
  page.drawRectangle({
    x: 39,
    y: 39,
    width: 517.28,
    height: 763.89,
    borderColor: green,
    borderWidth: 0.5,
  });
  page.drawRectangle({ x: 60, y: 674, width: 103, height: 103, color: green });
  const logoSize = logo.scaleToFit(95, 95);
  page.drawImage(logo, { x: 66, y: 678, ...logoSize });
  page.drawText('BACAROTECH', { x: 180, y: 740, font: bold, size: 19, color: green });
  page.drawText('Ufficio dubbi sull’umanità', {
    x: 180,
    y: 714,
    font: regular,
    size: 12,
    color: green,
  });
  page.drawLine({ start: { x: 66, y: 654 }, end: { x: 529, y: 654 }, color: green, thickness: 1 });
  page.drawText('Certificato di tolleranza provvisoria', {
    x: 66,
    y: 612,
    font: regular,
    size: 13,
    color: purple,
  });
  const lines = robot
    ? ['ROBOT PER', 'ECCESSO', 'DI PRECISIONE']
    : ['UMANO PER', 'INSUFFICIENZA', 'DI PROVE'];
  for (let index = 0; index < lines.length; index++) {
    page.drawText(lines[index], { x: 66, y: 539 - index * 53, font: bold, size: 36, color: green });
  }
  const description = robot
    ? ['Risposta esatta.', 'Un umano avrebbe almeno esitato.']
    : ['Il sistema non è convinto,', 'ma deve andare in pausa.'];
  for (let index = 0; index < description.length; index++) {
    page.drawText(description[index], {
      x: 66,
      y: 350 - index * 25,
      font: regular,
      size: 17,
      color: green,
    });
  }
  page.drawText(
    robot
      ? 'CALCOLO PERFETTO. SOSPETTO CONFERMATO.'
      : 'TRE PROVE SUPERATE. ZERO CERTEZZE ACQUISITE.',
    {
      x: 66,
      y: 207,
      font: bold,
      size: 11,
      color: purple,
    },
  );
  page.drawText('Are You an AI? / BacaroTech Game Center', {
    x: 66,
    y: 152,
    font: regular,
    size: 11,
    color: green,
  });
  page.drawText('Un verdetto scherzoso, senza alcun valore reale.', {
    x: 66,
    y: 109,
    font: regular,
    size: 10,
    color: green,
  });
  return document.save();
}

export async function downloadCertificate(outcome: Outcome) {
  const response = await fetch('/bacarotech-logo.png');
  if (!response.ok) throw new Error('Logo non disponibile');
  const logo = new Uint8Array(await response.arrayBuffer());
  const bytes = await createCertificate(outcome, logo);
  const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const verdict = outcome === 'robot' ? 'robot' : 'umanita';
  link.download = `bacarotech-certificato-${verdict}.pdf`;
  document.body.append(link);
  link.click();
  link.remove();
  // Give mobile browsers time to hand the resource to their download viewer.
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
