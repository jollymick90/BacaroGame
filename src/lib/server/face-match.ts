// MobileFace descriptors must be compared independently of their vector magnitude.
// Human's default distance normalization is tuned to a different descriptor scale
// and can clamp distinct MobileFace candidates to the same score of 1.
export const MIN_SIMILARITY = 0.5;
export const MIN_MARGIN = 0.08;
export function faceSimilarity(first: readonly number[], second: readonly number[]): number {
  if (first.length !== 256 || second.length !== 256) return Number.NaN;
  let dot = 0;
  let firstSquared = 0;
  let secondSquared = 0;
  for (let index = 0; index < first.length; index++) {
    const a = first[index];
    const b = second[index];
    if (!Number.isFinite(a) || !Number.isFinite(b)) return Number.NaN;
    dot += a * b;
    firstSquared += a * a;
    secondSquared += b * b;
  }
  const magnitude = Math.sqrt(firstSquared) * Math.sqrt(secondSquared);
  if (!Number.isFinite(magnitude) || magnitude === 0) return Number.NaN;
  return Math.max(0, Math.min(1, dot / magnitude));
}
export function matchDecision(best?: number, second?: number): 'match' | 'no-match' | 'ambiguous' {
  if (best === undefined || !Number.isFinite(best) || best < MIN_SIMILARITY) return 'no-match';
  if (second !== undefined && best - second + Number.EPSILON < MIN_MARGIN) return 'ambiguous';
  return 'match';
}
