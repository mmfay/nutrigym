"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { WeightCreate, Weight } from "../dataTypes";
import { addNewWeight } from "../api/weight/weight";

export type WeightController = {

	loading: boolean;
	error: string | null;

	onCreate: (food: WeightCreate) => Promise<Weight>;

	openWeightModal: () => void;
	closeWeightModal: () => void;

	weightModalOpen: boolean;
};

export function useWeightController(): WeightController {

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [weightModalOpen, setWeightModalOpen] = useState(false);

	// Tracks whether the component using this hook is still mounted
	const aliveRef = useRef(true);

	useEffect(() => {
		aliveRef.current = true;
		return () => {
		aliveRef.current = false;
		};
	}, []);

	// create a weight item
	const onCreate = useCallback(
		
		async (weight: WeightCreate): Promise<Weight> => {

			setError(null);

			const res = await addNewWeight(weight);
			
			if (!res.ok) {
				setError(res.error);
				throw new Error(res.error);
			}

			return res.data as Weight;
	
		}
		, []
	);

	// opens food modal
	function openWeightModal() {
		setWeightModalOpen(true);
	}

	// closes food modal
	function closeWeightModal() {
		setWeightModalOpen(false);
	}

	return {
		loading,
		error,
		onCreate,
		openWeightModal,
		closeWeightModal,
		weightModalOpen,
	};
}