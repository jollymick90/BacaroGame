import { privateJson } from '$lib/server/http';
import { gameConfigured, playableMembers } from '$lib/server/game';
export async function GET() {
  if(!gameConfigured()) return privateJson({ available: false, count: 0 });
  return privateJson({ available: true, count: (await playableMembers()).length });
}
