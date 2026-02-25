"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createMacroGoals } from "../api/macros/macros";
import { MacroGoal, MacroGoalCreate } from "../dataTypes";

export type MacroController = {

	loading: boolean;
	error: string | null;

	onGoalCreate: (food: MacroGoalCreate) => Promise<MacroGoal>;

	openGoalModal: () => void;
	closeGoalModal: () => void;

	goalModalOpen: boolean;
};

export function useMacroController(): MacroController {

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [goalModalOpen, setGoalModalOpen] = useState(false);

	// Tracks whether the component using this hook is still mounted
	const aliveRef = useRef(true);

	useEffect(() => {
		aliveRef.current = true;
		return () => {
			aliveRef.current = false;
		};
	}, []);

	// create a goal
	const onGoalCreate = useCallback(async (goal: MacroGoalCreate): Promise<MacroGoal> => {
		
		setError(null);

		const res = await createMacroGoals(goal);

		if (!res.ok) {
			setError(res.error);
			throw new Error(res.error);
		}

		return res.data as MacroGoal;

	}, []);

	// opens goal modal
	function openGoalModal() {
		setGoalModalOpen(true);
	}

	// closes goal modal
	function closeGoalModal() {
		setGoalModalOpen(false);
	}

	return {
		loading,
		error,
		onGoalCreate,
		openGoalModal,
		closeGoalModal,
		goalModalOpen,
	};
}