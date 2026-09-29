import { ApiResult } from "@/lib/dataTypes/results";
import { WorkoutTemplate, WorkoutTemplateCreate } from "@/lib/dataTypes";
import { getJSON, postJSON, patchJSON, deleteJSON } from "../submissions";

export async function getWorkoutTemplates(): Promise<ApiResult<WorkoutTemplate[]>> {
	return getJSON("/api/workouts/templates");
}

export async function createWorkoutTemplate(data: WorkoutTemplateCreate): Promise<ApiResult<WorkoutTemplate>> {
	return postJSON("/api/workouts/templates", data);
}

export async function updateWorkoutTemplate(id: number, data: WorkoutTemplateCreate): Promise<ApiResult<WorkoutTemplate>> {
	return patchJSON(`/api/workouts/templates?id=${id}`, data);
}

export async function deleteWorkoutTemplate(id: number): Promise<ApiResult<null>> {
	return deleteJSON("/api/workouts/templates", { id });
}