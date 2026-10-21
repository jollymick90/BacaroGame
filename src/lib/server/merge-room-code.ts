import { randomInt } from 'node:crypto';

const WORDS = [
  'polpo', 'laguna', 'caffe', 'barca', 'ponte', 'calle', 'campo', 'isola',
  'vela', 'mare', 'onda', 'vento', 'sole', 'luna', 'stella', 'nuvola',
  'gatto', 'cane', 'volpe', 'orso', 'lupo', 'tigre', 'leone', 'panda',
  'koala', 'rana', 'ape', 'grillo', 'falco', 'gufo', 'corvo', 'merlo',
  'mela', 'pera', 'pesca', 'limone', 'arancia', 'cocco', 'mango', 'kiwi',
  'pizza', 'pasta', 'pane', 'riso', 'torta', 'crema', 'miele', 'gelato',
  'viola', 'rosa', 'menta', 'salvia', 'cedro', 'pino', 'olmo', 'faggio',
  'rame', 'oro', 'argento', 'ambra', 'perla', 'rubino', 'opale', 'corallo',
  'bug', 'pixel', 'mouse', 'codice', 'rete', 'schermo', 'tasto', 'server',
  'razzo', 'treno', 'bici', 'ruota', 'faro', 'torre', 'porto', 'molo',
  'sogno', 'festa', 'gioco', 'salto', 'corsa', 'ritmo', 'suono', 'canto',
  'bosco', 'prato', 'fiore', 'foglia', 'seme', 'ramo', 'sasso', 'neve',
];

export function generateRoomCode(): string {
  return Array.from({ length: 3 }, () => WORDS[randomInt(WORDS.length)]).join('-');
}
