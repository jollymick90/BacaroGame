import { randomUUID } from 'node:crypto';

interface Failure {
  error: unknown;
  status: number;
  event: { request: Request; route: { id: string | null } };
}

export function reportServerError({ error, status, event }: Failure, log: (entry: Record<string, unknown>) => void = entry => console.error('[server-error]', entry)) {
  const errorId = randomUUID();
  const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
  // Allow diagnostic codes, never arbitrary SDK payloads or error messages.
  const safeCode = typeof code === 'number' && Number.isFinite(code) ? code
    : typeof code === 'string' && /^[a-zA-Z0-9_/-]{1,80}$/.test(code) ? code : undefined;
  const stack = error instanceof Error ? error.stack?.split('\n').filter(line => /^\s+at /.test(line)).join('\n') : undefined;
  log({ errorId, status, method: event.request.method, route: event.route.id, code: safeCode, stack });
  return { message: `Servizio temporaneamente non disponibile. Riprova tra poco. Riferimento: ${errorId}` };
}
