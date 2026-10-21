export const ROOM_CODE_MAX_LENGTH = 38;

export function isRoomCode(value: unknown): value is string {
  return typeof value === 'string' && (
    /^[a-f0-9]{16}$/.test(value) || /^[a-z]{3,12}-[a-z]{3,12}-[a-z]{3,12}$/.test(value)
  );
}

export function normalizeRoomCode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '-');
  return isRoomCode(normalized) ? normalized : null;
}
