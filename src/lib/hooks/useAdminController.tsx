"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdminUser } from "../dataTypes/auth";
import { getAdminUsers, setAdminUserEnabled, deleteAdminUser } from "../api/admin/admin";

export type AdminController = {

	loading: boolean;
	error: string | null;

	users: AdminUser[];
	hasMore: boolean;
	search: string;

	// id of the user currently being updated/deleted
	pendingUserId: string | null;

	// gets
	loadUsers: (search?: string) => Promise<void>;
	loadMore: () => Promise<void>;

	// updates
	onToggleEnabled: (user: AdminUser) => Promise<void>;
	onDeleteUser: (user: AdminUser) => Promise<void>;

};

export function useAdminController(): AdminController {

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [users, setUsers] = useState<AdminUser[]>([]);
	const [nextCursor, setNextCursor] = useState<string | null>(null);
	const [hasMore, setHasMore] = useState(false);
	const [search, setSearch] = useState("");

	const [pendingUserId, setPendingUserId] = useState<string | null>(null);

	// Tracks the latest list request so stale search responses are ignored
	const requestRef = useRef(0);

	// Tracks whether the component using this hook is still mounted
	const aliveRef = useRef(true);

	useEffect(() => {

		aliveRef.current = true;

		return () => {
			aliveRef.current = false;
		};

	}, []);

	// load the first page of users for a search term
	const loadUsers = useCallback(async (searchTerm: string = ""): Promise<void> => {

		const requestId = ++requestRef.current;

		setLoading(true);
		setError(null);
		setSearch(searchTerm);

		const res = await getAdminUsers(null, searchTerm);

		if (!aliveRef.current || requestId !== requestRef.current) return;

		setLoading(false);

		if (!res.ok || !res.data) {
			setError(res.message ?? "Unable to load users.");
			return;
		}

		setUsers(res.data.items);
		setNextCursor(res.data.nextCursor);
		setHasMore(res.data.hasMore);

	}, []);

	// append the next page of users
	const loadMore = useCallback(async (): Promise<void> => {

		if (!nextCursor) return;

		const requestId = ++requestRef.current;

		setLoading(true);
		setError(null);

		const res = await getAdminUsers(nextCursor, search);

		if (!aliveRef.current || requestId !== requestRef.current) return;

		setLoading(false);

		if (!res.ok || !res.data) {
			setError(res.message ?? "Unable to load users.");
			return;
		}

		const page = res.data;

		setUsers((prev) => [...prev, ...page.items]);
		setNextCursor(page.nextCursor);
		setHasMore(page.hasMore);

	}, [nextCursor, search]);

	// enable or disable a user
	const onToggleEnabled = useCallback(async (user: AdminUser): Promise<void> => {

		setPendingUserId(user.id);
		setError(null);

		const res = await setAdminUserEnabled(user.id, !user.is_enabled);

		if (!aliveRef.current) return;

		setPendingUserId(null);

		if (!res.ok || !res.data) {
			setError(res.message ?? "Unable to update user.");
			return;
		}

		const updated = res.data;

		setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));

	}, []);

	// permanently delete a user
	const onDeleteUser = useCallback(async (user: AdminUser): Promise<void> => {

		setPendingUserId(user.id);
		setError(null);

		const res = await deleteAdminUser(user.id);

		if (!aliveRef.current) return;

		setPendingUserId(null);

		if (!res.ok) {
			setError(res.message ?? "Unable to delete user.");
			return;
		}

		setUsers((prev) => prev.filter((u) => u.id !== user.id));

	}, []);

	return {
		loading,
		error,
		users,
		hasMore,
		search,
		pendingUserId,
		loadUsers,
		loadMore,
		onToggleEnabled,
		onDeleteUser,
	};
}