import { gameConfigured } from '$lib/server/game';
export function load() { return { configured: gameConfigured() }; }
