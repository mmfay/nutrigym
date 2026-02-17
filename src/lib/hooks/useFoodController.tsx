"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createFood } from "../api/food/food";
import { FoodCreate, Food } from "../dataTypes";

export type FoodsController = {
	loading: boolean;
	error: string | null;

	onCreate: (food: FoodCreate) => Promise<Food>;
	openFoodModal: () => void;
	closeFoodModal: () => void;

	foodModalOpen: boolean;

}
export function useFoodController(): FoodsController {

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [foodModalOpen, setFoodModalOpen] = useState(false);

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

	function openFoodModal() {
		setFoodModalOpen(true);
	}

	function closeFoodModal() {
		setFoodModalOpen(false);
	}

	// make accessible outside of controller
	return {
		loading,
		error,
		onCreate,
		openFoodModal,
		closeFoodModal,
		foodModalOpen
	}
}