import type Human from '@vladmandic/human';
import { createFaceAnalyzer } from './face-analysis';
import type { Config, FaceConfig, GenericConfig } from '@vladmandic/human';
// MobileFace è documentato nella wiki Models e implementato in 3.3.6,
// ma omesso da FaceConfig: l'estensione riflette src/models.ts e mobilefacenet.ts.
type EmbeddingFaceConfig = Partial<FaceConfig> & { mobilefacenet: Partial<GenericConfig> };
const face: EmbeddingFaceConfig = {
  enabled: true,
  detector: {
    maxDetected: 10,
    rotation: true,
    return: false,
    minConfidence: 0.5,
    skipFrames: 0,
    skipTime: 0,
  },
  mesh: { enabled: true, keepInvalid: true },
  attention: { enabled: false },
  iris: { enabled: false },
  description: { enabled: false },
  emotion: { enabled: false },
  gear: { enabled: false },
  antispoof: { enabled: false },
  liveness: { enabled: false },
  mobilefacenet: { enabled: true, modelPath: 'mobileface.json', skipFrames: 0, skipTime: 0 },
};
const config: Partial<Config> = {
  backend: 'webgl',
  modelBasePath: `${import.meta.env.BASE_URL}models/`,
  debug: false,
  cacheModels: false,
  cacheSensitivity: 0,
  skipAllowed: false,
  async: false,
  face,
  body: { enabled: false },
  hand: { enabled: false },
  object: { enabled: false },
  gesture: { enabled: false },
  segmentation: { enabled: false },
  filter: { enabled: true, return: false },
};
let loading: Promise<Human> | undefined;
export function loadHuman(): Promise<Human> {
  return (loading ??= (async () => {
    const { default: HumanBrowser } = await import('@vladmandic/human');
    const human = new HumanBrowser(config);
    await human.load();
    const loaded = human.models.loaded();
    if (!['blazeface', 'facemesh', 'mobilefacenet'].every((name) => loaded.includes(name)))
      throw new Error('Modelli incompleti.');
    return human;
  })().catch(() => {
    loading = undefined;
    throw new Error(
      'Caricamento modelli fallito. Controlla connessione, WebGL e file in /models, poi riprova.',
    );
  }));
}
// The factory only creates a queue; unused SSR imports need no inference runtime.
export const analyzeFace = /* @__PURE__ */ createFaceAnalyzer<HTMLCanvasElement>(async () => {
  const human = await loadHuman();
  return {
    detect: (photo) => human.detect(photo),
    clear() {
      // Copy only the requested results, then release references to photo and face data.
      human.result.face.length = 0;
      human.process.canvas = null;
      human.result.canvas = null;
    },
  };
});
export async function extract(photo: HTMLCanvasElement, status: (text: string) => void) {
  const result = await analyzeFace(photo, status);
  return result.embedding;
}
