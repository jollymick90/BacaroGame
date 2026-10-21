/** Signed shortest rotation; continuous when a pointer crosses ±180 degrees. */
export function rotationDelta(from: number, to: number): number {
  return ((to - from + 180) % 360 + 360) % 360 - 180;
}

export function nearestCharacter(rotation: number, ids: number[], taken: number[]) {
  let nearest: { id: number; rotation: number } | null = null;
  let distance = Infinity;
  for (const [index, id] of ids.entries()) {
    if (taken.includes(id)) continue;
    const adjustment = rotationDelta(rotation, -index * 360 / ids.length);
    if (Math.abs(adjustment) < distance) {
      distance = Math.abs(adjustment);
      nearest = { id, rotation: rotation + adjustment };
    }
  }
  return nearest;
}
