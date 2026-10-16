/** Shared Firebase project: names owned by the existing interview application.
 * Inventory supplied by the owner; never use these for Game Center records.
 */
export const RESERVED_COLLECTIONS = Object.freeze([
  'change_requests', 'fcm_tokens', 'invites', 'slots', 'speakers', 'users',
] as const);

/** Explicit allowlist. Add new names only after checking the shared database. */
export const GAME_COLLECTIONS = Object.freeze({ members: 'bacarodexMembers', configurations: 'bacaroGameConfigurations' } as const);

export function approvedCollectionName(name: string): string {
  if ((RESERVED_COLLECTIONS as readonly string[]).includes(name)) {
    throw new Error(`Collezione riservata al progetto interviste: ${name}`);
  }
  if (!(Object.values(GAME_COLLECTIONS) as string[]).includes(name) || name.includes('/')) {
    throw new Error(`Collezione non registrata per BacaroGame: ${name}`);
  }
  return name;
}
