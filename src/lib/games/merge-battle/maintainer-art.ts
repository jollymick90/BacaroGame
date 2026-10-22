const MAINTAINER_ASSETS = [
  'sre',
  'senior-developer',
  'tech-lead',
  'team-lead',
  'security-lead',
  'staff-data-scientist',
  'ml-lead',
  'data-platform-lead',
] as const;

export function maintainerArt(trial: number): string | null {
  const asset = MAINTAINER_ASSETS[trial];
  return asset ? `/images/merge-battle/maintainers/${asset}.webp` : null;
}
