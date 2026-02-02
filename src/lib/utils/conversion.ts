export const WEIGHT_TO_G = { g: 1, oz: 28.3495, lb: 453.592 } as const;
export type MeasureUnit = keyof typeof WEIGHT_TO_G;