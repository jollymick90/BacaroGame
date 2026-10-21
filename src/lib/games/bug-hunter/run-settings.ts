export type RunSettings = {
  distanceGoal: number;
  bugGoal: number;
};

export const DEFAULT_RUN_SETTINGS: RunSettings = {
  distanceGoal: 1000,
  bugGoal: 20,
};

export const RUN_SETTINGS_LIMITS = {
  distanceGoal: { minimum: 100, maximum: 10000 },
  bugGoal: { minimum: 1, maximum: 100 },
};

export function validateRunSettings(value: unknown): RunSettings {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Obiettivi della corsa non validi.');
  }
  const candidate = value as Record<string, unknown>;
  const distanceGoal = candidate.distanceGoal;
  const bugGoal = candidate.bugGoal;
  const distanceLimits = RUN_SETTINGS_LIMITS.distanceGoal;
  const bugLimits = RUN_SETTINGS_LIMITS.bugGoal;
  if (typeof distanceGoal !== 'number' || !Number.isInteger(distanceGoal) || distanceGoal < distanceLimits.minimum || distanceGoal > distanceLimits.maximum) {
    throw new Error(`La distanza deve essere un numero intero da ${distanceLimits.minimum} a ${distanceLimits.maximum} metri.`);
  }
  if (typeof bugGoal !== 'number' || !Number.isInteger(bugGoal) || bugGoal < bugLimits.minimum || bugGoal > bugLimits.maximum) {
    throw new Error(`L’obiettivo bug deve essere un numero intero da ${bugLimits.minimum} a ${bugLimits.maximum}.`);
  }
  return { distanceGoal, bugGoal };
}
