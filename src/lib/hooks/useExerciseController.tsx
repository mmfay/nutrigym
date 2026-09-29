"use client";

import { useCallback, useState } from "react";
import { Exercise, ExerciseCreate, MuscleGroup } from "../dataTypes";
import { searchExercises, createExercise, deleteExercise } from "../api/exercises/exercises";

export type ExerciseController = {
	error: string | null;
	creating: boolean;

	onSearch: (text: string, muscle_group?: MuscleGroup) => Promise<Exercise[]>;
	onCreate: (data: ExerciseCreate) => Promise<Exercise | null>;
	onDelete: (id: number) => Promise<boolean>;
	clearError: () => void;
};

export function useExerciseController(): ExerciseController {

	const [error, setError] = useState<string | null>(null);
	const [creating, setCreating] = useState(false);

	// searches the global catalog plus the user's custom exercises
	const onSearch = useCallback(async (text: string, muscle_group?: MuscleGroup): Promise<Exercise[]> => {

		const res = await searchExercises(text, muscle_group);

		if (!res.ok) {
			setError(res.message);
			return [];
		}

		return res.data ?? [];

	}, []);

	// creates a custom exercise, returns null (and sets error) on failure
	const onCreate = useCallback(async (data: ExerciseCreate): Promise<Exercise | null> => {

		setError(null);
		setCreating(true);

		try {

			const res = await createExercise(data);

			if (!res.ok) {
				setError(res.message);
				return null;
			}

			return res.data ?? null;

		} finally {
			setCreating(false);
		}

	}, []);

	// deletes a custom exercise
	const onDelete = useCallback(async (id: number): Promise<boolean> => {

		setError(null);

		const res = await deleteExercise(id);

		if (!res.ok) {
			setError(res.message);
			return false;
		}

		return true;

	}, []);

	const clearError = useCallback(() => setError(null), []);

	return {
		error,
		creating,
		onSearch,
		onCreate,
		onDelete,
		clearError,
	};
}