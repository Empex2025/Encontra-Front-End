/** Escala única de raio (decisão 8, 08/10/2026). */
export const RADIUS_STEPS = [1, 3, 5, 10, 20, 50] as const;
export type RadiusKm = (typeof RADIUS_STEPS)[number];
export const DEFAULT_RADIUS: RadiusKm = 50;

export const isRadius = (n: unknown): n is RadiusKm =>
  typeof n === "number" && (RADIUS_STEPS as readonly number[]).includes(n);

export const radiusLabel = (km: number) => `Até ${km} km`;
