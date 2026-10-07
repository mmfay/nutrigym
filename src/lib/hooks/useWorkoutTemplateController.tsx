"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Exercise, PendingTemplateExercise, WorkoutTemplate, WorkoutTemplateCreate } from "../dataTypes";
import {
	createWorkoutTemplate,
	deleteWorkoutTemplate,
	getWorkoutTemplates,
	updateWorkoutTemplate,
} from "../api/workouts/templates";
import { formatDuration, parseDuration } from "../utils/workout";

export type WorkoutTemplateController = {
	loading: boolean;
	saving: boolean;
	error: string | null;

	templates: WorkoutTemplate[];
	fetchTemplates: () => Promise<void>;
	removeTemplate: (id: number) => Promise<void>;

	// builder
	editingId: number | null;
	name: string;
	setName: (v: string) => void;
	notes: string;
	setNotes: (v: string) => void;
	pending: PendingTemplateExercise[];
	addPending: (exercise: Exercise) => void;
	updatePending: (tempId: string, patch: Partial<Omit<PendingTemplateExercise, "tempId" | "exercise">>) => void;
	removePending: (tempId: string) => void;
	movePending: (tempId: string, dir: -1 | 1) => void;
	toggleSuperset: (tempId: string) => void;
	editTemplate: (template: WorkoutTemplate) => void;
	resetBuilder: () => void;
	saveTemplate: () => Promise<boolean>;

	exercisePickerOpen: boolean;
	openExercisePicker: () => void;
	closeExercisePicker: () => void;
};

const newTempId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function useWorkoutTemplateController(): WorkoutTemplateController {

	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);

	const [editingId, setEditingId] = useState<number | null>(null);
	const [name, setName] = useState("");
	const [notes, setNotes] = useState("");
	const [pending, setPending] = useState<PendingTemplateExercise[]>([]);

	const [exercisePickerOpen, setExercisePickerOpen] = useState(false);

	const aliveRef = useRef(true);

	useEffect(() => {
		aliveRef.current = true;
		return () => {
			aliveRef.current = false;
		};
	}, []);

	const fetchTemplates = useCallback(async () => {

		setLoading(true);
		setError(null);

		try {

			const res = await getWorkoutTemplates();

			if (!aliveRef.current) return;

			if (!res.ok) {
				setError(res.message);
				return;
			}

			setTemplates(res.data ?? []);

		} finally {
			if (aliveRef.current) setLoading(false);
		}

	}, []);

	const removeTemplate = useCallback(async (id: number) => {

		setError(null);

		const res = await deleteWorkoutTemplate(id);

		if (!aliveRef.current) return;

		if (!res.ok) {
			setError(res.message);
			return;
		}

		setTemplates((prev) => prev.filter((t) => t.id !== id));

	}, []);

	const addPending = useCallback((exercise: Exercise) => {

		const timed = exercise.tracking_type === "TIME" || exercise.tracking_type === "DISTANCE_TIME";

		setPending((prev) => [
			...prev,
			{
				tempId: newTempId(),
				exercise,
				target_sets: "3",
				target_reps: timed ? "" : "10",
				target_weight: "",
				target_duration_seconds: "",
				superset_with_next: false,
			},
		]);

	}, []);

	const updatePending = useCallback((tempId: string, patch: Partial<Omit<PendingTemplateExercise, "tempId" | "exercise">>) => {
		setPending((prev) => prev.map((p) => (p.tempId === tempId ? { ...p, ...patch } : p)));
	}, []);

	// removing the last exercise of a superset makes the one before it the new end
	const removePending = useCallback((tempId: string) => {

		setPending((prev) => {

			const i = prev.findIndex((p) => p.tempId === tempId);
			if (i < 0) return prev;

			const next = prev.filter((_, k) => k !== i);
			if (i > 0 && !prev[i].superset_with_next) next[i - 1] = { ...next[i - 1], superset_with_next: false };
			return next;

		});

	}, []);

	// links stay with their position, so a moved exercise swaps into its neighbour's superset slot
	const movePending = useCallback((tempId: string, dir: -1 | 1) => {

		setPending((prev) => {

			const i = prev.findIndex((p) => p.tempId === tempId);
			const j = i + dir;

			if (i < 0 || j < 0 || j >= prev.length) return prev;

			const next = [...prev];
			next[i] = { ...prev[j], superset_with_next: prev[i].superset_with_next };
			next[j] = { ...prev[i], superset_with_next: prev[j].superset_with_next };
			return next;

		});

	}, []);

	const toggleSuperset = useCallback((tempId: string) => {
		setPending((prev) => prev.map((p) => (p.tempId === tempId ? { ...p, superset_with_next: !p.superset_with_next } : p)));
	}, []);

	const resetBuilder = useCallback(() => {
		setEditingId(null);
		setName("");
		setNotes("");
		setPending([]);
		setError(null);
	}, []);

	// loads a saved template into the builder
	const editTemplate = useCallback((template: WorkoutTemplate) => {

		setEditingId(template.id);
		setName(template.name);
		setNotes(template.notes ?? "");
		setError(null);

		setPending(
			template.exercises.map((e) => ({
				tempId: newTempId(),
				exercise: {
					id: e.exercise_id,
					user_id: null,
					name: e.exercise_name,
					muscle_group: e.muscle_group,
					equipment: "other",
					tracking_type: e.tracking_type,
					is_verified: false,
					is_custom: false,
					created_at: "",
				},
				target_sets: e.target_sets !== null ? String(e.target_sets) : "3",
				target_reps: e.target_reps !== null ? String(e.target_reps) : "",
				target_weight: e.target_weight !== null ? String(Number(e.target_weight)) : "",
				target_duration_seconds: e.target_duration_seconds !== null ? formatDuration(e.target_duration_seconds) : "",
				superset_with_next: e.superset_with_next,
			}))
		);

	}, []);

	const saveTemplate = useCallback(async (): Promise<boolean> => {

		setError(null);

		if (!name.trim()) {
			setError("Give the template a name");
			return false;
		}

		if (pending.length === 0) {
			setError("Add at least one exercise");
			return false;
		}

		const payload: WorkoutTemplateCreate = {
			name: name.trim(),
			notes: notes.trim() || null,
			exercises: [],
		};

		for (const [i, p] of pending.entries()) {

			const sets = Number(p.target_sets);
			if (!Number.isInteger(sets) || sets < 1 || sets > 20) {
				setError(`${p.exercise.name}: sets must be between 1 and 20`);
				return false;
			}

			const duration = p.target_duration_seconds.trim() ? parseDuration(p.target_duration_seconds) : null;
			if (p.target_duration_seconds.trim() && duration === null) {
				setError(`${p.exercise.name}: time should look like 45 or 1:30`);
				return false;
			}

			payload.exercises.push({
				exercise_id: p.exercise.id,
				target_sets: sets,
				target_reps: p.target_reps.trim() ? Number(p.target_reps) : null,
				target_weight: p.target_weight.trim() ? Number(p.target_weight) : null,
				target_duration_seconds: duration,
				superset_with_next: p.superset_with_next && i < pending.length - 1,
			});

		}

		setSaving(true);

		try {

			const res = editingId
				? await updateWorkoutTemplate(editingId, payload)
				: await createWorkoutTemplate(payload);

			if (!aliveRef.current) return false;

			if (!res.ok || !res.data) {
				setError(res.message);
				return false;
			}

			const saved = res.data;
			setTemplates((prev) => [saved, ...prev.filter((t) => t.id !== saved.id)]);
			resetBuilder();
			return true;

		} finally {
			if (aliveRef.current) setSaving(false);
		}

	}, [name, notes, pending, editingId, resetBuilder]);

	return {
		loading,
		saving,
		error,

		templates,
		fetchTemplates,
		removeTemplate,

		editingId,
		name,
		setName,
		notes,
		setNotes,
		pending,
		addPending,
		updatePending,
		removePending,
		movePending,
		toggleSuperset,
		editTemplate,
		resetBuilder,
		saveTemplate,

		exercisePickerOpen,
		openExercisePicker: () => setExercisePickerOpen(true),
		closeExercisePicker: () => setExercisePickerOpen(false),
	};
}