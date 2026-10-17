import { EMBEDDING_MODEL, type GameData, type Pokemon, type SuperadminAccount } from './types';
async function request<T>(path: string, method = 'GET', data?: unknown): Promise<T> {
  const response = await fetch(`/api/bacarodex${path}`, {
    method, credentials: 'same-origin', cache: 'no-store',
    headers: data === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(response.status === 401 ? 'Sessione scaduta. Ricarica la pagina e accedi di nuovo.' : result.message || 'Operazione Firebase non riuscita. Riprova.');
  return result;
}
export const gameData = () => request<GameData>('');
export function registerMember(
  name: string,
  pokemon: Pokemon,
  embedding: number[],
  consent: boolean,
  mode: 'self' | 'other' = 'self',
) {
  return request('/members', 'POST', {
    name,
    pokemonId: pokemon.id,
    embedding,
    consent,
    mode,
    otherConsent: mode === 'other' && consent,
    model: EMBEDDING_MODEL,
  });
}

export const listSuperadmins = () => request<{ accounts: SuperadminAccount[] }>('/superadmins');

export function changeSuperadmin(email: string, enabled: boolean) {
  return request('/superadmins', 'PATCH', { email, enabled });
}

export function changeMemberAccess(email: string, enabled: boolean) {
  return request('/access', 'PATCH', { email, enabled });
}

export function removeMember(memberId: string) {
  return request('/members', 'DELETE', { memberId });
}
export const removeMyMember = () => request('/members', 'DELETE');
export const captureMember = (memberId: string, pokemonId: number) => request('/captures', 'POST', { memberId, pokemonId });
export const clearMyData = (includeRegistration: boolean) => request('/data', 'DELETE', { includeRegistration });
