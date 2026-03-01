export const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const normalizeToday = (x: any): TodayMacros => ({
  calories: num(x?.calories),
  protein:  num(x?.protein),
  carbs:    num(x?.carbs),
  fat:      num(x?.fat),
});

export const DEFAULT_TODAY: TodayMacros = { calories: 0, protein: 0, carbs: 0, fat: 0 };

export interface MacroGoal {
	id: number;
    calories: number;
    protein: number;
    carbs: number;   
    fat: number;    
}

export interface MacroGoalCreate {
    calories: number;
    protein: number;
    carbs: number;   
    fat: number;    
}

export interface TodayMacros {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export interface DayMacros { 
    date: string;
    protein: number;
    carbs: number;
    fat: number;
}

export interface WeightPoint {
    date: string; 
    weight: number; 
}

export interface HomePayload {
    weight: WeightPoint[];
    macros: DayMacros[];
    today:  TodayMacros;
    goals:  MacroGoal;
}

export type Food = {
	id: number,
	name: string,
	brand: string,
	calories: number,
	protein: number,
	carbs: number,
	fat: number,
	serving_size: number,
	serving_unit: string,
	serving_metric_size?: number; // e.g. 228
	serving_metric_unit?: "g" | "ml";
}

export type FoodTracked = {
    id: number,
	meal: number,
	name: string,
	brand: string,
	recorded_at: string, 
    carbs: number,
    fat: number,
	protein: number,
	calories: number,
    serving_size: number,
    serving_unit: string
}

export type FoodCreate = {
	name: string;
	brand: string;
	barcode: string;
	calories: number;
	fat: number;
	carbs: number;
	protein: number;
	serving_type: "COUNT" | "MEASURE" ;
	// “label serving”
	serving_size: number;        // e.g. 1
	serving_unit: string;        // e.g. "cup" or "each"
	// optional metric equivalent from parentheses
	serving_metric_size?: number; // e.g. 228
	serving_metric_unit?: "g" | "ml";
};

export type FoodInput = {
    name: string;
    brand?: string;
    calories: number;
    fat: number;     
    carbs: number;  
    protein: number; 
    servingMode: "COUNT" | "MEASURE";
    servingUnit: string;   // e.g., "g"/"oz"/"lb"
    servingQty: number;     // e.g., 32
    countUnit: string;
    countQty: number;
    barcode?: string;
};

export type WeightCreate = {
	date: string; 
    weight: number; 
}

export type Weight = {
	id: number;
	measured_at: string;
	weight: number;
}

export type Input = Date | string | number;