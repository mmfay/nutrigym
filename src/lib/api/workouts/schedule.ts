import { ApiResult } from "@/lib/dataTypes/results";
import { ScheduledWorkout, WorkoutCalendar } from "@/lib/dataTypes";
import { getJSON, postJSON, deleteJSON } from "../submissions";

export async function getWorkoutCalendar(from: string, to: string): Promise<ApiResult<WorkoutCalendar>> {
	return getJSON("/api/workouts/schedule", { from, to });
}

export async function getTodaysScheduledWorkouts(): Promise<ApiResult<ScheduledWorkout[]>> {
	return getJSON("/api/workouts/schedule/today");
}

export async function scheduleWorkout(template_id: number, date: string): Promise<ApiResult<{ id: number }>> {
	return postJSON("/api/workouts/schedule", { template_id, date });
}

export async function unscheduleWorkout(id: number): Promise<ApiResult<null>> {
	return deleteJSON("/api/workouts/schedule", { id });
}