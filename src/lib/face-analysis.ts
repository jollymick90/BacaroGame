export type FacePoint = [number, number];
export type FaceAnalysis = {
  embedding: number[];
  landmarks: FacePoint[];
  box: [number, number, number, number];
  width: number;
  height: number;
};
type DetectedFace = {
  embedding?: readonly number[];
  mesh?: readonly (readonly (number | undefined)[])[];
  box: readonly number[];
};
type Detection = { face: readonly DetectedFace[]; width?: number; height?: number };
type PhotoSize = { width: number; height: number };
type FaceDetector<Photo> = {
  detect: (photo: Photo) => Promise<Detection>;
  clear: () => void;
};
export function copyFaceAnalysis(result: Detection, width: number, height: number): FaceAnalysis {
  if (result.face.length === 0)
    throw new Error('Nessun volto rilevato. Cerca più luce e guarda la fotocamera.');
  if (result.face.length > 1)
    throw new Error('Più volti rilevati. Inquadra una sola persona e rifai la foto.');
  const face = result.face[0];
  const embedding = face.embedding;
  if (
    !embedding ||
    embedding.length !== 256 ||
    !embedding.every(Number.isFinite) ||
    !embedding.some((value) => value !== 0)
  ) {
    throw new Error('Volto non abbastanza leggibile. Avvicinati e rifai la foto.');
  }
  const landmarks: FacePoint[] = [];
  for (const point of face.mesh ?? []) {
    const x = point[0];
    const y = point[1];
    if (
      typeof x === 'number' &&
      typeof y === 'number' &&
      Number.isFinite(x) &&
      Number.isFinite(y)
    ) {
      landmarks.push([x, y]);
    }
  }
  return {
    embedding: [...embedding],
    landmarks,
    box: [face.box[0], face.box[1], face.box[2], face.box[3]],
    width: result.width && Number.isFinite(result.width) ? result.width : width,
    height: result.height && Number.isFinite(result.height) ? result.height : height,
  };
}
/** The shared Human instance cannot detect two photos or clear another job's result concurrently. */
export function createFaceAnalyzer<Photo extends PhotoSize>(
  load: () => Promise<FaceDetector<Photo>>,
) {
  let pending: Promise<void> = Promise.resolve();
  return (photo: Photo, status: (text: string) => void = () => {}): Promise<FaceAnalysis> => {
    const job = pending.then(async () => {
      status('Caricamento dei modelli locali…');
      const detector = await load();
      try {
        status('Analisi del volto sul dispositivo…');
        const result = await detector.detect(photo);
        return copyFaceAnalysis(result, photo.width, photo.height);
      } finally {
        detector.clear();
      }
    });
    pending = job.then(
      () => {},
      () => {},
    );
    return job;
  };
}
