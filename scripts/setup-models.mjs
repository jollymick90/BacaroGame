import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const out = new URL('public/models/', root);
const source = new URL('node_modules/@vladmandic/human/', root);
await mkdir(out, { recursive: true });
const lock = JSON.parse(await readFile(new URL('scripts/models.lock.json', root), 'utf8'));
const hash = b => createHash('sha256').update(b).digest('hex');
for (const asset of lock) {
  const target = new URL(asset.file, out);
  let bytes;
  try { bytes = await readFile(target); } catch {}
  if (bytes && hash(bytes) === asset.sha256) continue;
  if (asset.packageFile) bytes = await readFile(new URL(asset.packageFile, source));
  else {
    const res = await fetch(asset.url, { signal: AbortSignal.timeout(60000) });
    if (!res.ok) throw new Error(`Download fallito: ${asset.url} (${res.status})`);
    bytes = Buffer.from(await res.arrayBuffer());
  }
  if (hash(bytes) !== asset.sha256) throw new Error(`Checksum errato: ${asset.file}`);
  await writeFile(target, bytes);
}
// Validate every weight shard referenced by each selected manifest.
for (const name of ['blazeface', 'facemesh', 'mobileface']) {
  const manifest = JSON.parse(await readFile(new URL(`${name}.json`, out), 'utf8'));
  for (const group of manifest.weightsManifest) for (const path of group.paths) {
    const bytes = await readFile(new URL(path, out));
    if (!bytes.length || !lock.some(a => a.file === path && a.sha256 === hash(bytes))) throw new Error(`Pesi non verificati: ${path}`);
  }
}
console.log('Modelli verificati: BlazeFace, FaceMesh, MobileFace (manifest + pesi + licenze).');
