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
	id: number | null,
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
	isAI?: boolean;
	is_verified: boolean;
	barcode?: string | null;
}

export type FoodMacros = {
	foodName: string;
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
};

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
    serving_unit: string,
	isAI?: boolean
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

export type UserRecipeItem = {
	id: number;
	food_id: number;
	food_name: string;
	brand: string;
	serving_size: number;
	serving_unit: string;
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
};

export type UserRecipe = {
	id: number;
	name: string;
	created_at: string;
	yield_size: number;
	yield_unit: string;
	items: UserRecipeItem[];
};

export type RecipeItemCreate = {
	food_id: number;
	serving_size: number;
	serving_unit: string;
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
};

export type RecipeCreate = {
	name: string;
	yield_size: number;
	yield_unit: string;
	items: RecipeItemCreate[];
};

export type PendingRecipeItem = {
	tempId: string;
	food: Food;
	serving_size: number;
	serving_unit: string;
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
};
export type MuscleGroup =
	| "chest" | "back" | "shoulders" | "biceps" | "triceps" | "forearms"
	| "quads" | "hamstrings" | "glutes" | "calves" | "core" | "full_body" | "cardio";

export type Equipment =
	| "barbell" | "dumbbell" | "machine" | "cable" | "bodyweight" | "kettlebell" | "band" | "other";

export type TrackingType = "WEIGHT_REPS" | "REPS" | "TIME" | "DISTANCE_TIME";

export type Exercise = {
	id: number;
	user_id: string | null;
	name: string;
	muscle_group: MuscleGroup;
	equipment: Equipment;
	tracking_type: TrackingType;
	is_verified: boolean;
	is_custom: boolean;
	created_at: string;
};

export type ExerciseCreate = {
	name: string;
	muscle_group: MuscleGroup;
	equipment: Equipment;
	tracking_type: TrackingType;
};

// ---------- Workouts ----------

// targets shared by template exercises and session exercises
export type ExerciseTargets = {
	target_sets: number | null;
	target_reps: number | null;
	target_weight: number | null;
	target_duration_seconds: number | null;
};

export type WorkoutTemplateExercise = ExerciseTargets & {
	id: number;
	exercise_id: number;
	exercise_name: string;
	muscle_group: MuscleGroup;
	tracking_type: TrackingType;
	position: number;
	superset_with_next: boolean;
};

export type WorkoutTemplate = {
	id: number;
	name: string;
	notes: string | null;
	created_at: string;
	exercises: WorkoutTemplateExercise[];
};

export type WorkoutTemplateExerciseCreate = {
	exercise_id: number;
	target_sets: number;
	target_reps?: number | null;
	target_weight?: number | null;
	target_duration_seconds?: number | null;
	superset_with_next?: boolean;
};

export type WorkoutTemplateCreate = {
	name: string;
	notes?: string | null;
	exercises: WorkoutTemplateExerciseCreate[];
};

// exercise being assembled in the template builder, before save
export type PendingTemplateExercise = {
	tempId: string;
	exercise: Exercise;
	target_sets: string;
	target_reps: string;
	target_weight: string;
	target_duration_seconds: string;
	superset_with_next: boolean;
};

export type WorkoutSet = {
	id: number;
	session_exercise_id: number;
	set_number: number;
	weight: number | null;
	reps: number | null;
	duration_seconds: number | null;
	distance: number | null;
	is_warmup: boolean;
	created_at: string;
};

export type WorkoutSetInput = {
	weight?: number | null;
	reps?: number | null;
	duration_seconds?: number | null;
	distance?: number | null;
	is_warmup?: boolean;
};

export type WorkoutSessionExercise = ExerciseTargets & {
	id: number;
	exercise_id: number;
	exercise_name: string;
	muscle_group: MuscleGroup;
	equipment: Equipment;
	tracking_type: TrackingType;
	position: number;
	superset_with_next: boolean;
	sets: WorkoutSet[];
};

export type WorkoutSession = {
	id: number;
	template_id: number | null;
	name: string;
	notes: string | null;
	started_at: string;
	ended_at: string | null;
	exercises: WorkoutSessionExercise[];
};

// row in the workout history list
export type WorkoutSessionSummary = {
	id: number;
	template_id: number | null;
	name: string;
	started_at: string;
	ended_at: string | null;
	exercise_count: number;
	set_count: number;
	volume: number;	// sum of weight * reps on working sets, lb
	exercise_names: string[];
};

// sets from the most recent finished session that included an exercise
export type ExerciseLastPerformance = {
	session_id: number;
	started_at: string;
	sets: WorkoutSet[];
};

// one point per finished session on the exercise progress chart
export type ExerciseProgressPoint = {
	date: string;
	top_weight: number | null;
	est_1rm: number | null;
	volume: number;
	total_reps: number;
	total_duration_seconds: number;
	total_distance: number;
};

export type ExerciseHistory = {
	last: ExerciseLastPerformance | null;
	progress: ExerciseProgressPoint[];
};

// ---------- Workout calendar ----------

export type ScheduledWorkoutStatus = "planned" | "in_progress" | "completed" | "missed";

export type ScheduledWorkout = {
	id: number;
	date: string;	// YYYY-MM-DD
	template_id: number;
	template_name: string;
	session_id: number | null;
	status: ScheduledWorkoutStatus;
};

// a finished workout that wasn't started from the calendar
export type CalendarWorkout = {
	id: number;
	name: string;
	date: string;	// YYYY-MM-DD, in the user's timezone
	set_count: number;
};

export type WorkoutCalendar = {
	today: string;	// YYYY-MM-DD, in the user's timezone
	scheduled: ScheduledWorkout[];
	sessions: CalendarWorkout[];
};

// ---------- Push notifications ----------

// what the browser's PushSubscription.toJSON() sends us
export type PushSubscriptionInput = {
	endpoint: string;
	keys: { p256dh: string; auth: string };
};

// message body the service worker (public/sw.js) receives
export type PushPayload = {
	title: string;
	body: string;
	url: string;
	tag: string;		// a newer push with the same tag replaces the older notification
	badge?: number;		// home screen icon badge; 0 clears it, omitted leaves it alone
};

export type ReminderKind = "workout" | "breakfast" | "lunch" | "dinner";

// minutes after local midnight; null = that reminder is off
export type ReminderPreferences = Record<`${ReminderKind}_time`, number | null>;