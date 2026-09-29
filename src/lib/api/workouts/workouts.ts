import { ApiResult } from "@/lib/dataTypes/results";
import { WorkoutSession, WorkoutSessionSummary, WorkoutSetInput } from "@/lib/dataTypes";
import { getJSON, postJSON, patchJSON, deleteJSON } from "../submissions";

export async function getActiveWorkout(): Promise<ApiResult<WorkoutSession | null>> {
	return getJSON("/api/workouts/sessions/active");
}

export async function getWorkout(id: number): Promise<ApiResult<WorkoutSession>> {
	return getJSON(`/api/workouts/sessions/${id}`);
}

export async function getWorkoutHistory(limit = 20, offset = 0): Promise<ApiResult<WorkoutSessionSummary[]>> {
	return getJSON("/api/workouts/sessions", { limit, offset });
}

export async function startWorkout(data: { template_id?: number | null; schedule_id?: number | null; name?: string }): Promise<ApiResult<WorkoutSession>> {
	return postJSON("/api/workouts/sessions", data);
}

export async function updateWorkout(id: number, data: { name?: string; notes?: string | null; finish?: boolean }): Promise<ApiResult<WorkoutSession>> {
	return patchJSON(`/api/workouts/sessions/${id}`, data);
}

export async function deleteWorkout(id: number): Promise<ApiResult<null>> {
	return deleteJSON(`/api/workouts/sessions/${id}`);
}

export async function addWorkoutExercise(session_id: number, exercise_id: number): Promise<ApiResult<WorkoutSession>> {
	return postJSON(`/api/workouts/sessions/${session_id}/exercises`, { exercise_id });
}

export async function removeWorkoutExercise(session_id: number, session_exercise_id: number): Promise<ApiResult<WorkoutSession>> {
	return deleteJSON(`/api/workouts/sessions/${session_id}/exercises`, { session_exercise_id });
}

export async function addWorkoutSet(session_exercise_id: number, set: WorkoutSetInput): Promise<ApiResult<WorkoutSession>> {
	return postJSON("/api/workouts/sets", { session_exercise_id, ...set });
}

export async function updateWorkoutSet(id: number, set: WorkoutSetInput): Promise<ApiResult<WorkoutSession>> {
	return patchJSON(`/api/workouts/sets?id=${id}`, set);
}

export async function deleteWorkoutSet(id: number): Promise<ApiResult<WorkoutSession>> {
	return deleteJSON("/api/workouts/sets", { id });
}