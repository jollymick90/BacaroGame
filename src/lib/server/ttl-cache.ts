/** Per-instance server cache for data shared by all callers. */
export function createTtlCache<T>(ttl: number) {
  let cached: { value: T; expiresAt: number } | undefined;
  let pending: Promise<T> | undefined;
  let generation = 0;

  function set(value: T) {
    generation++;
    pending = undefined;
    cached = { value, expiresAt: Date.now() + ttl };
  }

  function get(load: () => Promise<T>): Promise<T> {
    if (cached && Date.now() < cached.expiresAt) {
      return Promise.resolve(cached.value);
    }
    if (pending) {
      return pending;
    }
    const startedGeneration = generation;
    const request = Promise.resolve().then(load).then(value => {
      if (generation === startedGeneration) {
        cached = { value, expiresAt: Date.now() + ttl };
      }
      return value;
    }).finally(() => {
      if (pending === request) {
        pending = undefined;
      }
    });
    pending = request;
    return request;
  }

  return { get, set };
}
