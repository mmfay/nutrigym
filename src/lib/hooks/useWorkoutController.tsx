"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
	Exercise,
	ExerciseHistory,
	ExerciseLastPerformance,
	WorkoutSession,
	WorkoutSessionSummary,
	WorkoutSetInput,
} from "../dataTypes";
import { ApiResult } from "../dataTypes/results";
import {
	addWorkoutExercise,
	addWorkoutSet,
	deleteWorkout,
	deleteWorkoutSet,
	getActiveWorkout,
	getWorkout,
	getWorkoutHistory,
	removeWorkoutExercise,
	setWorkoutSuperset,
	startWorkout,
	updateWorkout,
	updateWorkoutSet,
} from "../api/workouts/workouts";
import { getExerciseHistory } from "../api/exercises/exercises";
import { notifyWorkoutsChanged } from "../utils/push";

const HISTORY_PAGE_SIZE = 20;

export type ProgressExercise = Pick<Exercise, "id" | "name" | "tracking_type">;

export type WorkoutController = {
	error: string | null;
	clearError: () => void;
	saving: boolean;

	// active workout
	active: WorkoutSession | null;
	loadingActive: boolean;
	fetchActive: () => Promise<void>;
	start: (template_id?: number | null, schedule_id?: number | null) => Promise<boolean>;
	finish: () => Promise<boolean>;
	discard: () => Promise<boolean>;
	rename: (name: string) => Promise<void>;
	saveNotes: (notes: string) => Promise<void>;
	addExercise: (exercise_id: number) => Promise<void>;
	removeExercise: (session_exercise_id: number) => Promise<void>;
	setSuperset: (session_exercise_id: number, superset_with_next: boolean) => Promise<void>;
	logSet: (session_exercise_id: number, set: WorkoutSetInput) => Promise<boolean>;
	editSet: (set_id: number, set: WorkoutSetInput) => Promise<boolean>;
	removeSet: (set_id: number) => Promise<void>;

	// last finished performance per exercise id, for "last time" hints and prefill
	lastPerformance: Record<number, ExerciseLastPerformance | null>;

	exercisePickerOpen: boolean;
	openExercisePicker: () => void;
	closeExercisePicker: () => void;

	// history
	history: WorkoutSessionSummary[];
	loadingHistory: boolean;
	hasMoreHistory: boolean;
	fetchHistory: () => Promise<void>;
	loadMoreHistory: () => Promise<void>;
	selectedSession: WorkoutSession | null;
	openSession: (id: number) => Promise<void>;
	closeSession: () => void;
	deleteSession: (id: number) => Promise<void>;

	// per-exercise progress chart
	progressExercise: ProgressExercise | null;
	progress: ExerciseHistory | null;
	loadingProgress: boolean;
	loadProgress: (exercise: ProgressExercise) => Promise<void>;
};

export function useWorkoutController(): WorkoutController {

	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const [active, setActive] = useState<WorkoutSession | null>(null);
	const [loadingActive, setLoadingActive] = useState(true);

	const [lastPerformance, setLastPerformance] = useState<Record<number, ExerciseLastPerformance | null>>({});

	const [exercisePickerOpen, setExercisePickerOpen] = useState(false);

	const [history, setHistory] = useState<WorkoutSessionSummary[]>([]);
	const [loadingHistory, setLoadingHistory] = useState(false);
	const [hasMoreHistory, setHasMoreHistory] = useState(false);
	const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);

	const [progressExercise, setProgressExercise] = useState<ProgressExercise | null>(null);
	const [progress, setProgress] = useState<ExerciseHistory | null>(null);
	const [loadingProgress, setLoadingProgress] = useState(false);

	const aliveRef = useRef(true);

	useEffect(() => {
		aliveRef.current = true;
		return () => {
			aliveRef.current = false;
		};
	}, []);

	// Active-workout mutations run one at a time so fast taps (e.g. logging two sets
	// back to back) reach the server in order and a stale response never overwrites a newer one.
	const queueRef = useRef<Promise<unknown>>(Promise.resolve());

	const mutateActive = useCallback(
		(call: () => Promise<ApiResult<WorkoutSession | null>>): Promise<boolean> => {

			const run = queueRef.current.then(async () => {

				setSaving(true);
				setError(null);

				try {

					const res = await call();

					if (!aliveRef.current) return false;

					if (!res.ok) {
						setError(res.message);
						return false;
					}

					setActive(res.data ?? null);
					return true;

				} catch {
					if (aliveRef.current) setError("Couldn't reach the server. Check your connection and try again.");
					return false;
				} finally {
					if (aliveRef.current) setSaving(false);
				}

			});

			queueRef.current = run.catch(() => undefined);

			return run;

		},
		[]
	);

	const fetchActive = useCallback(async () => {

		setLoadingActive(true);

		try {

			const res = await getActiveWorkout();

			if (!aliveRef.current) return;

			if (!res.ok) {
				setError(res.message);
				return;
			}

			setActive(res.data ?? null);

		} finally {
			if (aliveRef.current) setLoadingActive(false);
		}

	}, []);

	// fetch "last time" sets for any exercise in the active workout we haven't looked up yet
	const requestedRef = useRef(new Set<number>());

	useEffect(() => {

		if (!active) return;

		const missing = active.exercises
			.map((e) => e.exercise_id)
			.filter((id) => !requestedRef.current.has(id));

		for (const id of missing) {

			requestedRef.current.add(id);

			getExerciseHistory(id).then((res) => {
				if (!aliveRef.current) return;
				setLastPerformance((prev) => ({ ...prev, [id]: res.ok ? res.data?.last ?? null : null }));
			});

		}

	}, [active]);

	const start = useCallback(async (template_id?: number | null, schedule_id?: number | null) => {
		const ok = await mutateActive(() => startWorkout({ template_id: template_id ?? null, schedule_id: schedule_id ?? null }));
		if (ok) notifyWorkoutsChanged();
		return ok;
	}, [mutateActive]);

	const finish = useCallback(async () => {

		const id = active?.id;
		if (!id) return false;

		const ok = await mutateActive(async () => {
			const res = await updateWorkout(id, { finish: true });
			// once finished, there's no active workout any more
			return res.ok ? { ...res, data: null } : res;
		});

		if (ok) {
			// history and "last time" hints now include this workout
			requestedRef.current.clear();
			setLastPerformance({});
			notifyWorkoutsChanged();
		}

		return ok;

	}, [active?.id, mutateActive]);

	const discard = useCallback(async () => {

		const id = active?.id;
		if (!id) return false;

		const ok = await mutateActive(async () => {
			const res = await deleteWorkout(id);
			return { ...res, data: null };
		});

		if (ok) notifyWorkoutsChanged();

		return ok;

	}, [active?.id, mutateActive]);

	const rename = useCallback(async (name: string) => {
		const id = active?.id;
		if (!id || !name.trim()) return;
		await mutateActive(() => updateWorkout(id, { name: name.trim() }));
	}, [active?.id, mutateActive]);

	const saveNotes = useCallback(async (notes: string) => {
		const id = active?.id;
		if (!id) return;
		await mutateActive(() => updateWorkout(id, { notes: notes.trim() || null }));
	}, [active?.id, mutateActive]);

	const addExercise = useCallback(async (exercise_id: number) => {
		const id = active?.id;
		if (!id) return;
		await mutateActive(() => addWorkoutExercise(id, exercise_id));
	}, [active?.id, mutateActive]);

	const removeExercise = useCallback(async (session_exercise_id: number) => {
		const id = active?.id;
		if (!id) return;
		await mutateActive(() => removeWorkoutExercise(id, session_exercise_id));
	}, [active?.id, mutateActive]);

	const setSuperset = useCallback(async (session_exercise_id: number, superset_with_next: boolean) => {
		const id = active?.id;
		if (!id) return;
		await mutateActive(() => setWorkoutSuperset(id, session_exercise_id, superset_with_next));
	}, [active?.id, mutateActive]);

	const logSet = useCallback(
		(session_exercise_id: number, set: WorkoutSetInput) => mutateActive(() => addWorkoutSet(session_exercise_id, set)),
		[mutateActive]
	);

	const editSet = useCallback(
		(set_id: number, set: WorkoutSetInput) => mutateActive(() => updateWorkoutSet(set_id, set)),
		[mutateActive]
	);

	const removeSet = useCallback(async (set_id: number) => {
		await mutateActive(() => deleteWorkoutSet(set_id));
	}, [mutateActive]);

	// ----- history -----

	const fetchHistory = useCallback(async () => {

		setLoadingHistory(true);
		setError(null);

		try {

			const res = await getWorkoutHistory(HISTORY_PAGE_SIZE, 0);

			if (!aliveRef.current) return;

			if (!res.ok) {
				setError(res.message);
				return;
			}

			const rows = res.data ?? [];
			setHistory(rows);
			setHasMoreHistory(rows.length === HISTORY_PAGE_SIZE);

		} finally {
			if (aliveRef.current) setLoadingHistory(false);
		}

	}, []);

	const loadMoreHistory = useCallback(async () => {

		setLoadingHistory(true);

		try {

			const res = await getWorkoutHistory(HISTORY_PAGE_SIZE, history.length);

			if (!aliveRef.current) return;

			if (!res.ok) {
				setError(res.message);
				return;
			}

			const rows = res.data ?? [];
			setHistory((prev) => [...prev, ...rows]);
			setHasMoreHistory(rows.length === HISTORY_PAGE_SIZE);

		} finally {
			if (aliveRef.current) setLoadingHistory(false);
		}

	}, [history.length]);

	const openSession = useCallback(async (id: number) => {

		setError(null);

		const res = await getWorkout(id);

		if (!aliveRef.current) return;

		if (!res.ok) {
			setError(res.message);
			return;
		}

		setSelectedSession(res.data ?? null);

	}, []);

	const closeSession = useCallback(() => setSelectedSession(null), []);

	const deleteSession = useCallback(async (id: number) => {

		setError(null);

		const res = await deleteWorkout(id);

		if (!aliveRef.current) return;

		if (!res.ok) {
			setError(res.message);
			return;
		}

		setHistory((prev) => prev.filter((s) => s.id !== id));
		setSelectedSession((prev) => (prev?.id === id ? null : prev));

	}, []);

	const loadProgress = useCallback(async (exercise: ProgressExercise) => {

		setProgressExercise(exercise);
		setLoadingProgress(true);
		setError(null);

		try {

			const res = await getExerciseHistory(exercise.id);

			if (!aliveRef.current) return;

			if (!res.ok) {
				setError(res.message);
				setProgress(null);
				return;
			}

			setProgress(res.data ?? null);

		} finally {
			if (aliveRef.current) setLoadingProgress(false);
		}

	}, []);

	return {
		error,
		clearError: () => setError(null),
		saving,

		active,
		loadingActive,
		fetchActive,
		start,
		finish,
		discard,
		rename,
		saveNotes,
		addExercise,
		removeExercise,
		setSuperset,
		logSet,
		editSet,
		removeSet,

		lastPerformance,

		exercisePickerOpen,
		openExercisePicker: () => setExercisePickerOpen(true),
		closeExercisePicker: () => setExercisePickerOpen(false),

		history,
		loadingHistory,
		hasMoreHistory,
		fetchHistory,
		loadMoreHistory,
		selectedSession,
		openSession,
		closeSession,
		deleteSession,

		progressExercise,
		progress,
		loadingProgress,
		loadProgress,
	};
}