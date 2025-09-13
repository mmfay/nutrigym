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