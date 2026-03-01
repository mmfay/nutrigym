export const WEIGHT_TO_G = {
  g: 1,
  kg: 1000,
  oz: 28.349523125,
  lb: 453.59237,
} as const;

export type WeightUnit = keyof typeof WEIGHT_TO_G;

export function convertWeight(unit_to: WeightUnit, unit_from: WeightUnit) {
  // returns multiplier such that: value_in_to = value_in_from * multiplier
  return WEIGHT_TO_G[unit_from] / WEIGHT_TO_G[unit_to];
}

export const VOLUME_TO_ML = {
	mL: 1,
	L: 1000,
	tsp: 4.92892159375,
	tbsp: 14.78676478125,
	fl_oz: 29.5735295625,
	cup: 236.5882365,
	pt: 473.176473,
	qt: 946.352946,
	gal: 3785.411784
} as const;

export type VolumeUnit = keyof typeof VOLUME_TO_ML;

export function convertVolume(unit_to: VolumeUnit, unit_from: VolumeUnit) {
  // returns multiplier such that: value_in_to = value_in_from * multiplier
  return VOLUME_TO_ML[unit_from] / VOLUME_TO_ML[unit_to];
}