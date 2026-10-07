"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WorkoutCalendar } from "../dataTypes";
import { getWorkoutCalendar, scheduleWorkout, unscheduleWorkout } from "../api/workouts/schedule";
import { todayLocalISO } from "../utils/date";
import { notifyWorkoutsChanged } from "../utils/push";

// local-date helpers; the calendar works in plain YYYY-MM-DD strings so there's no timezone drift
const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * The days shown for a month: whole weeks (Sunday first) covering the 1st through the last day.
 */
export function monthGrid(year: number, month: number): string[] {

	const first = new Date(year, month, 1);
	const start = new Date(year, month, 1 - first.getDay());
	const last = new Date(year, month + 1, 0);
	const end = new Date(year, month, last.getDate() + (6 - last.getDay()));

	const days: string[] = [];
	for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) days.push(toISO(d));
	return days;

}

export type WorkoutCalendarController = {
	loading: boolean;
	saving: boolean;
	error: string | null;

	year: number;
	month: number;	// 0-11
	days: string[];
	prevMonth: () => void;
	nextMonth: () => void;
	goToToday: () => void;

	today: string;
	calendar: WorkoutCalendar | null;
	fetchCalendar: () => Promise<void>;

	selectedDate: string;
	selectDate: (date: string) => void;

	plan: (template_id: number, date: string) => Promise<boolean>;
	unplan: (id: number) => Promise<void>;
};

export function useWorkoutCalendarController(): WorkoutCalendarController {

	const now = new Date();

	const [year, setYear] = useState(now.getFullYear());
	const [month, setMonth] = useState(now.getMonth());
	const [selectedDate, setSelectedDate] = useState(todayLocalISO());

	const [calendar, setCalendar] = useState<WorkoutCalendar | null>(null);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const days = useMemo(() => monthGrid(year, month), [year, month]);

	const aliveRef = useRef(true);
	const requestSeq = useRef(0);

	useEffect(() => {
		aliveRef.current = true;
		return () => {
			aliveRef.current = false;
		};
	}, []);

	const fetchCalendar = useCallback(async () => {

		const mySeq = ++requestSeq.current;
		setLoading(true);
		setError(null);

		try {

			const res = await getWorkoutCalendar(days[0], days[days.length - 1]);

			// ignore responses for a month the user already navigated away from
			if (!aliveRef.current || mySeq !== requestSeq.current) return;

			if (!res.ok) {
				setError(res.message);
				return;
			}

			setCalendar(res.data ?? null);

		} finally {
			if (aliveRef.current && mySeq === requestSeq.current) setLoading(false);
		}

	}, [days]);

	const shiftMonth = (delta: number) => {
		const d = new Date(year, month + delta, 1);
		setYear(d.getFullYear());
		setMonth(d.getMonth());
	};

	const goToToday = () => {
		const d = new Date();
		setYear(d.getFullYear());
		setMonth(d.getMonth());
		setSelectedDate(todayLocalISO());
	};

	const plan = useCallback(async (template_id: number, date: string): Promise<boolean> => {

		setSaving(true);
		setError(null);

		try {

			const res = await scheduleWorkout(template_id, date);

			if (res.ok) notifyWorkoutsChanged();

			if (!aliveRef.current) return false;

			if (!res.ok) {
				setError(res.message);
				return false;
			}

			await fetchCalendar();
			return true;

		} finally {
			if (aliveRef.current) setSaving(false);
		}

	}, [fetchCalendar]);

	const unplan = useCallback(async (id: number) => {

		setError(null);

		const res = await unscheduleWorkout(id);

		if (res.ok) notifyWorkoutsChanged();

		if (!aliveRef.current) return;

		if (!res.ok) {
			setError(res.message);
			return;
		}

		setCalendar((prev) => (prev ? { ...prev, scheduled: prev.scheduled.filter((s) => s.id !== id) } : prev));

	}, []);

	return {
		loading,
		saving,
		error,

		year,
		month,
		days,
		prevMonth: () => shiftMonth(-1),
		nextMonth: () => shiftMonth(1),
		goToToday,

		today: calendar?.today ?? todayLocalISO(),
		calendar,
		fetchCalendar,

		selectedDate,
		selectDate: setSelectedDate,

		plan,
		unplan,
	};
}