"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createFood, logFood, fetchFoodLog, deleteFoodLog, updateFoodLog, clearFoodLog, getRecentFoods, searchFood, getRemainingAIRequests, copyMeal } from "../api/food/food";
import { FoodCreate, Food, FoodTracked } from "../dataTypes";

export type FoodsController = {
	
	loading: boolean;
	error: string | null;

	trackedFood: FoodTracked[];
	recentsByMeal: Partial<Record<number, Food[]>>;
	loadingRecents: Partial<Record<number, boolean>>;
	errorRecents: Partial<Record<number, string>>;
	selectedFoodToLog: Food | null;
	remainingAIRequests: number;

	onCreate: (food: FoodCreate) => Promise<Food>;
	onSearch: (text: string) => Promise<Food[]>;
	onLogFood: (food: Food, meal: number, date: string) => Promise<void>;
	onCopyMeal: (meal: number, date: string) => Promise<number>;
	getFoodLog: (logDate: string) => Promise<void>;
	getRecents: (meal: number) => Promise<void>;
	getAIRequests: () => Promise<void>;
	removeFoodLog: (id: number) => Promise<void>;
	onUpdateFoodLog: (id: number, meal: number, servingSize: number) => Promise<void>;
	onClearHistory: () => Promise<void>;

	openFoodModal: () => void;
	closeFoodModal: () => void;

	openFoodLogModal: (food: Food) => void;
	closeFoodLogModal: () => void;

	openMacroAIModal: () => void;
	closeMacroAIModal: () => void;

	openEditLogModal: (item: FoodTracked) => void;
	closeEditLogModal: () => void;
	selectedLogToEdit: FoodTracked | null;

	foodModalOpen: boolean;
	foodLogModalOpen: boolean;
	macroAIModalOpen: boolean;
};

export function useFoodController(): FoodsController {

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [foodModalOpen, setFoodModalOpen] = useState(false);
	const [foodLogModalOpen, setFoodLogModalOpen] = useState(false);
	const [macroAIModalOpen, setMacroAIModealOpen] = useState(false);

	const [selectedFoodToLog, setSelectedFoodToLog] = useState<Food | null>(null);
	const [selectedLogToEdit, setSelectedLogToEdit] = useState<FoodTracked | null>(null);

	// tracks how many open AI Requests a user has on the front end, so functions can be disabled.
	const [remainingAIRequests, setRemainingAIRequests] = useState(0);

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
			setError(res.message);
			throw new Error(res.message);
		}

		return res.data as Food;

	}, []);

	// retrieves AI Requests remaining. 
	const getAIRequests = useCallback ( async (): Promise<void> => {

		setLoading(true);
		setError(null);

		const res = await getRemainingAIRequests();

		if (!res.ok) {
			setLoading(false);
			setError(res.message);
			throw new Error(res.message);
		}

		setRemainingAIRequests(res.data?.requests ?? 0);

	}, [])

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
				setError(res.message);
				throw new Error(res.message);
			}

			const data = res.data;
			if (!data) {
				setLoading(false);
				setError("No data returned from server");
				return;
			}

			setTrackedFood((prev) => [...prev, data]);
			setLoading(false);
			getAIRequests();
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
			setError(res.message);
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
			setErrorRecents((p) => ({ ...p, [meal]: res.message }));
			setLoadingRecents((p) => ({ ...p, [meal]: false }));
			return;
		}
		
		// store an array
		setRecentsByMeal((p) => ({ ...p, [meal]: (res.data as Food[]) ?? [] }));
		setLoadingRecents((p) => ({ ...p, [meal]: false }));

	}, []);

	// copies a meal from the previous day into the given date, returns count of items added
	const onCopyMeal = useCallback(async (meal: number, date: string): Promise<number> => {

		const res = await copyMeal(meal, date);

		if (!res.ok) {
			setError(res.message);
			throw new Error(res.message);
		}

		const items = res.data ?? [];
		
		if (items.length > 0) {
			setTrackedFood((prev) => [...prev, ...items]);
		}

		return items.length;

	}, []);

	// removes a logged food
	const removeFoodLog = useCallback(async (id: number): Promise<void> => {
		setLoading(true);
		setError(null);

		const res = await deleteFoodLog(id);

		if (!res.ok) {
			setError(res.message);
			setLoading(false);
			return;
		}

		setTrackedFood((prev) => prev.filter((x) => x.id !== id));
		setLoading(false);
	}, []);

	// updates the meal/quantity of a logged food
	const onUpdateFoodLog = useCallback(async (id: number, meal: number, servingSize: number): Promise<void> => {
		setLoading(true);
		setError(null);

		const res = await updateFoodLog(id, meal, servingSize);

		if (!aliveRef.current) return;

		if (!res.ok || !res.data) {
			setError(res.message);
			setLoading(false);
			throw new Error(res.message);
		}

		const updated = res.data;

		setTrackedFood((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
		setLoading(false);
	}, []);

	// clears all tracking history for the user
	const onClearHistory = useCallback(async (): Promise<void> => {
		setLoading(true);
		setError(null);

		const res = await clearFoodLog();

		if (!res.ok) {
			setError(res.message);
			setLoading(false);
			throw new Error(res.message);
		}

		setTrackedFood([]);
		setRecentsByMeal({});
		setLoading(false);
	}, []);

	// searches for a food 
	const onSearch = useCallback(
		async (text: string): Promise<Food[]> => {

			const res = await searchFood(text);
							
			if (!res.ok) {
				setError(res.message);
				throw new Error(res.message);
			}
			
			return res.data as Food[];
		},
		[]
	);

	// opens food modal
	function openFoodModal() {
		setFoodModalOpen(true);
	}

	// closes food modal
	function closeFoodModal() {
		setFoodModalOpen(false);
	}

	// opens food modal
	function openFoodLogModal(food: Food) {
		setSelectedFoodToLog(food);
		setFoodLogModalOpen(true);
	}

	// closes food modal
	function closeFoodLogModal() {
		setFoodLogModalOpen(false);
	}

	// opens edit logged food modal
	function openEditLogModal(item: FoodTracked) {
		setSelectedLogToEdit(item);
	}

	// closes edit logged food modal
	function closeEditLogModal() {
		setSelectedLogToEdit(null);
	}

	// opens food modal
	function openMacroAIModal() {
		setMacroAIModealOpen(true);
	}

	// closes food modal
	function closeMacroAIModal() {
		setMacroAIModealOpen(false);
	}

	return {
		loading,
		error,
		trackedFood,
		recentsByMeal,
		errorRecents,
		loadingRecents,
		selectedFoodToLog,
		remainingAIRequests,
		onCreate,
		onSearch,
		onLogFood,
		onCopyMeal,
		getAIRequests,
		removeFoodLog,
		onUpdateFoodLog,
		onClearHistory,
		getFoodLog,
		getRecents,
		openFoodModal,
		closeFoodModal,
		openFoodLogModal,
		closeFoodLogModal,
		openMacroAIModal,
		closeMacroAIModal,
		openEditLogModal,
		closeEditLogModal,
		selectedLogToEdit,
		foodModalOpen,
		foodLogModalOpen,
		macroAIModalOpen
	};
}