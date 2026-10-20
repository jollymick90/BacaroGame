// Matched visually; original filenames and evidence are in the public manifest.
export const CHARACTER_ART: Record<number, string> = {
  0: 'frontend',
  1: 'backend',
  2: 'full-stack',
  3: 'platform',
  4: 'sre',
  5: 'security',
  6: 'qa',
  7: 'database',
  8: 'data-engineer',
  9: 'data-scientist',
  10: 'ml-engineer',
  11: 'analytics'
};

export function characterArt(id: number) {
  const name = CHARACTER_ART[id];
  return {
    src: `/images/merge-battle/${name}.webp`,
    srcset: `/images/merge-battle/${name}-small.webp 320w, /images/merge-battle/${name}.webp 640w`
  };
}
