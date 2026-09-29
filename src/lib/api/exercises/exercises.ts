import { ApiResult } from "@/lib/dataTypes/results";
import { Exercise, ExerciseCreate, ExerciseHistory, MuscleGroup } from "@/lib/dataTypes";
import { getJSON, postJSON, deleteJSON } from "../submissions";

export async function searchExercises(text: string, muscle_group?: MuscleGroup): Promise<ApiResult<Exercise[]>> {
	return getJSON("/api/exercises", { text, muscle_group });
}

export async function createExercise(data: ExerciseCreate): Promise<ApiResult<Exercise>> {
	return postJSON("/api/exercises", data);
}

export async function deleteExercise(id: number): Promise<ApiResult<null>> {
	return deleteJSON("/api/exercises", { id });
}

export async function getExerciseHistory(id: number): Promise<ApiResult<ExerciseHistory>> {
	return getJSON(`/api/exercises/${id}/history`);
}