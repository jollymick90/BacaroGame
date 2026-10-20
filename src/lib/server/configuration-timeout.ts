/** A slow configuration backend must not hold the entire Game Center open. */
export async function withConfigurationTimeout<T>(load: () => Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(load),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Configurazione: tempo di attesa esaurito.')), 3000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
