"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createFood, logFood, fetchFoodLog, deleteFoodLog, getRecentFoods } from "../api/food/food";
import { FoodCreate, Food, FoodTracked } from "../dataTypes";

export type FoodsController = {
	loading: boolean;
	error: string | null;

	trackedFood: FoodTracked[];
	recentsByMeal: Partial<Record<number, Food[]>>;
	loadingRecents: Partial<Record<number, boolean>>;
	errorRecents: Partial<Record<number, string>>;

	onCreate: (food: FoodCreate) => Promise<Food>;
	onLogFood: (food: Food, meal: number, date: string) => Promise<void>;
	getFoodLog: (logDate: string) => Promise<void>;
	getRecents: (meal: number) => Promise<void>;
	removeFoodLog: (id: number) => Promise<void>;

	openFoodModal: () => void;
	closeFoodModal: () => void;

	foodModalOpen: boolean;
};

export function useFoodController(): FoodsController {

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [foodModalOpen, setFoodModalOpen] = useState(false);

	// data states
	const [trackedFood, setTrackedFood] = useState<FoodTracked[]>([]);
	const [recentsByMeal, setRecentsByMeal] = useState<
		Partial<Record<number, Food[]>>
	>({});
	const [loadingRecents, setLoadingRecents] = useState<
		Partial<Record<number, boolean>>
	>({});
	const [errorRecents, setErrorRecents] = useState<
		Partial<Record<number, string>>
	>({});

	// Tracks whether the component using this hook is still mounted
	const aliveRef = useRef(true);

	useEffect(() => {
		aliveRef.current = true;
		return () => {
		aliveRef.current = false;
		};
	}, []);

	// Keep "latest" snapshots for stable callbacks (avoid dependency loops)
	const recentsRef = useRef(recentsByMeal);
	useEffect(() => {
		recentsRef.current = recentsByMeal;
	}, [recentsByMeal]);

	const loadingRecentsRef = useRef(loadingRecents);
	useEffect(() => {
		loadingRecentsRef.current = loadingRecents;
	}, [loadingRecents]);

	// create a food item
	const onCreate = useCallback(async (food: FoodCreate): Promise<Food> => {
		if (!food || Object.keys(food).length === 0) {
		throw new Error("No fields provided to update.");
		}

		setError(null);

		const res = await createFood(food);

		if (!res.ok) {
			setError(res.error);
			throw new Error(res.error);
		}

		return res.data as Food;
	}, []);

	// logs a food item
	const onLogFood = useCallback(
		async (food: Food, meal: number, date: string): Promise<void> => {
			setLoading(true);
			setError(null);

			if (!food || Object.keys(food).length === 0) {
				setLoading(false);
				throw new Error("No fields provided to update.");
			}

			const res = await logFood(food, meal, date);

			if (!res.ok) {
				setLoading(false);
				setError(res.error);
				throw new Error(res.error);
			}

			const data = res.data;
			if (!data) {
				setLoading(false);
				setError("No data returned from server");
				return;
			}

			setTrackedFood((prev) => [...prev, data]);
			setLoading(false);
		},
		[]
	);

	// gets a food log for a date
	const getFoodLog = useCallback(async (date: string): Promise<void> => {
		setLoading(true);
		setError(null);

		const res = await fetchFoodLog(date);

		if (!aliveRef.current) return;

		if (!res.ok) {
		setError(res.error);
		setLoading(false);
		return;
		}

		setTrackedFood((res.data as FoodTracked[]) ?? []);
		setLoading(false);
	}, []);

	// get recent foods (cached per meal)
	const getRecents = useCallback(async (meal: number): Promise<void> => {
		// cache hit
		const hasKey = Object.prototype.hasOwnProperty.call(
		recentsRef.current,
		meal
		);
		if (hasKey) return;

		// prevent duplicate in flight calls
		if (loadingRecentsRef.current[meal]) return;

		setLoadingRecents((p) => ({ ...p, [meal]: true }));
		setErrorRecents((p) => ({ ...p, [meal]: undefined }));

		const res = await getRecentFoods(meal);
		
		if (!aliveRef.current) return;

		if (!res.ok) {
			setErrorRecents((p) => ({ ...p, [meal]: res.error }));
			setLoadingRecents((p) => ({ ...p, [meal]: false }));
			return;
		}
		
		// store an array
		setRecentsByMeal((p) => ({ ...p, [meal]: (res.data as Food[]) ?? [] }));
		setLoadingRecents((p) => ({ ...p, [meal]: false }));

	}, []);

	// removes a logged food
	const removeFoodLog = useCallback(async (id: number): Promise<void> => {
		setLoading(true);
		setError(null);

		const res = await deleteFoodLog(id);

		if (!res.ok) {
		setError(res.error);
		setLoading(false);
		return;
		}

		setTrackedFood((prev) => prev.filter((x) => x.id !== id));
		setLoading(false);
	}, []);

	// opens food modal
	function openFoodModal() {
		setFoodModalOpen(true);
	}

	// closes food modal
	function closeFoodModal() {
		setFoodModalOpen(false);
	}

	return {
		loading,
		error,
		trackedFood,
		recentsByMeal,
		errorRecents,
		loadingRecents,
		onCreate,
		onLogFood,
		removeFoodLog,
		getFoodLog,
		getRecents,
		openFoodModal,
		closeFoodModal,
		foodModalOpen,
	};
}