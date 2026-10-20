import { error } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import type { GameCenterConfiguration } from '$lib/game-center/configuration';

export const load: LayoutLoad = async ({ fetch, depends }) => {
  depends('game-center:configuration');
  const response = await fetch('/api/game-center/config');
  if (!response.ok) error(503, 'Configurazione non disponibile. Riprova tra poco.');
  const configuration: GameCenterConfiguration = await response.json();
  return { configuration };
};
