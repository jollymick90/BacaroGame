/** Only the deployment origin belongs in the public invitation. */
export function gameCenterUrl(currentUrl: string): string {
  const current = new URL(currentUrl);
  return `${current.origin}/`;
}
