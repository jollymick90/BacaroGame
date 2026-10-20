const legacyPaths = new Set([
  '/', '/merge-battle', '/bug-hunter', '/bacarodex', '/are-you-an-ai',
]);

export function legacyGamePath(hash: string): string | null {
  if (!hash.startsWith('#/')) return null;
  const path = hash.slice(1);
  return legacyPaths.has(path) ? path : '/';
}
