"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createFood, logFood, fetchFoodLog, deleteFoodLog } from "../api/food/food";
import { FoodCreate, Food, FoodTracked } from "../dataTypes";
import { ApiResult } from "../dataTypes/results";

export type FoodsController = {
	loading: boolean;
	error: string | null;

	trackedFood: FoodTracked[];

	onCreate: (food: FoodCreate) => Promise<Food>;
	onLogFood: (food: Food, meal: number, date: string) => Promise<void>;
	getFoodLog: (logDate: string) => Promise<void>;
	removeFoodLog: (id: number) => Promise<void>;

	openFoodModal: () => void;
	closeFoodModal: () => void;

	foodModalOpen: boolean;

}
export function useFoodController(): FoodsController {

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [foodModalOpen, setFoodModalOpen] = useState(false);

	// data states
	const [trackedFood, setTrackedFood] = useState<FoodTracked[]>([]);

	// Tracks whether the component using this hook is still mounted
	// Used to prevent calling setState after unmount when async requests resolve late
	const aliveRef = useRef(true); 

	useEffect(() => {
		aliveRef.current = true;
		return () => {
			aliveRef.current = false;			
		}
	}, []);

	// create a food item
	const onCreate = useCallback(
		async (food: FoodCreate): Promise<Food> => {

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

		},
		[]
	);

	// logs a food item
	const onLogFood = useCallback(

		async (food: Food, meal: number, date: string): Promise<void> => {

			setLoading(true);
			setError(null);
			
			console.log(`Date ${date}`);

			if (!food || Object.keys(food).length === 0) {
				throw new Error("No fields provided to update.");
			}

			const res = await logFood(food, meal, date);

			if (!res.ok) {
				setError(res.error);
				throw new Error(res.error);
			}

			const data = res.data;

			if (!data) {
				setError("No data returned from server");
				return;
			}
			alert(`Data: ${JSON.stringify(data)}`);

			setTrackedFood(prev => [...prev, data]);

			return;
		},
		[]
	);

	// gets a food log for a date
	const getFoodLog = useCallback(

		async (date: string): Promise<void> => {

			setLoading(true);
			setError(null);

			const res = await fetchFoodLog(date);

			if (!aliveRef.current) return;

			if (!res.ok) {
				setError(res.error);
				setLoading(false);
				return;
			}
			setTrackedFood(res.data as FoodTracked[]);
			setLoading(false);
		},
		[]
	);

	// removes a logged food
	const removeFoodLog = useCallback(

		async (id: number): Promise<void> => {

			setLoading(true);
			setError(null);

			const res = await deleteFoodLog(id);

			if (!res.ok) {
				setError(res.error);
				setLoading(false);
			}
			setTrackedFood((prev) => prev.filter((x) => x.id !== id));
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

	// make accessible outside of controller
	return {
		loading,
		error,
		trackedFood,
		onCreate,
		onLogFood,
		removeFoodLog,
		getFoodLog,
		openFoodModal,
		closeFoodModal,
		foodModalOpen
	}
}