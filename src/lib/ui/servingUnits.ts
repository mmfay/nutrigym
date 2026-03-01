export type UnitType = "count" | "volume" | "weight";

type UnitDef = {
  unit: string;      // what you store/display (e.g. "each", "g")
  label: string;     // nice UI label (e.g. "Each", "Grams")
  type: UnitType;    // how it behaves
};

export const UNITS: UnitDef[] = [
  // count
  { unit: "each", label: "Each", type: "count" },
  { unit: "piece", label: "Piece", type: "count" },
  { unit: "slice", label: "Slice", type: "count" },

  // weight
  { unit: "g", label: "Grams (g)", type: "weight" },
  { unit: "oz", label: "Ounces (oz)", type: "weight" },
  { unit: "lb", label: "Pounds (lb)", type: "weight" },

  // volume
  { unit: "ml", label: "Milliliters (ml)", type: "volume" },
  { unit: "l", label: "Liters (L)", type: "volume" },
  { unit: "tsp", label: "Teaspoon (tsp)", type: "volume" },
  { unit: "tbsp", label: "Tablespoon (tbsp)", type: "volume" },
  { unit: "cup", label: "Cup", type: "volume" },
];