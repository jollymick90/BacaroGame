import { privateJson } from '$lib/server/http';
import { gameConfigured } from '$lib/server/game';
import { membersCollection, PUBLIC_CONSENT_VERSION } from '$lib/server/members';
import { EMBEDDING_MODEL } from '$lib/types';
import { createTtlCache } from '$lib/server/ttl-cache';

// Cache only the count; matching and consent checks always read Firestore.
const countCache = createTtlCache<number>(60_000);

export async function GET() {
  if(!gameConfigured()) return privateJson({ available: false, count: 0 });
  const count = await countCache.get(async () => {
    const result = await membersCollection()
      .where('consentVersion', '==', PUBLIC_CONSENT_VERSION)
      .where('model', '==', EMBEDDING_MODEL)
      .limit(200).count().get();
    return result.data().count;
  });
  return privateJson({ available: true, count });
}
