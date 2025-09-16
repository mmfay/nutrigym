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

export const normalizeGoal = (x: any): MacroGoal => ({
  calories: num(x?.calories),
  protein:  num(x?.protein),
  carbs:    num(x?.carbs),
  fat:      num(x?.fat),
});

export const DEFAULT_TODAY: TodayMacros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
export const DEFAULT_GOAL:  MacroGoal  = { calories: 0, protein: 0, carbs: 0, fat: 0 };

export interface MacroGoal {
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