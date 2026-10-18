import { privateJson } from '$lib/server/http';
import { gameConfigured, playableMembers } from '$lib/server/game';
import { createTtlCache } from '$lib/server/ttl-cache';

// Cache only the count; matching and consent checks always read Firestore.
const countCache = createTtlCache<number>(60_000);

export async function GET() {
  if(!gameConfigured()) return privateJson({ available: false, count: 0 });
  const count = await countCache.get(async () => (await playableMembers()).length);
  return privateJson({ available: true, count });
}
