"use client";

import { useEffect, useState } from "react";
import { useAdminController } from "@/lib/hooks/useAdminController";
import { useAuth } from "@/app/providers/AuthProvider";
import { AdminUser } from "@/lib/dataTypes/auth";
import Spinner from "@/app/components/Spinner";

export default function AdminPage() {

	// controller for admin user management
	const ac = useAdminController();
	const auth = useAuth();

	// search box value (debounced into the controller)
	const [searchInput, setSearchInput] = useState("");

	// id of the user whose delete is awaiting confirmation
	const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

	// load users on open and whenever the search changes
	useEffect(() => {

		const t = setTimeout(() => {
			ac.loadUsers(searchInput.trim());
		}, 300);

		return () => clearTimeout(t);

	}, [searchInput]);

	async function handleDelete(user: AdminUser) {

		await ac.onDeleteUser(user);
		setConfirmDeleteId(null);

	}

	const initialLoading = ac.loading && ac.users.length === 0;

	return (
		<div className="mx-auto max-w-5xl px-6 py-10">
			<div className="mb-8">
				<h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
					Admin Panel
				</h1>
				<p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
					Disable or permanently delete user accounts.
				</p>
			</div>

			<section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
				<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h2 className="text-lg font-medium text-slate-900 dark:text-white">
							Users
						</h2>
						<p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
							Disabling signs the user out everywhere and blocks their API key. Deleting removes the account and all of its data.
						</p>
					</div>

					<input
						type="search"
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						placeholder="Search name or email"
						aria-label="Search users"
						className="w-full sm:w-64 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-600"
					/>
				</div>

				{ac.error && (
					<p className="mb-4 text-sm text-red-600 dark:text-red-400">
						{ac.error}
					</p>
				)}

				{initialLoading ? (
					<Spinner />
				) : ac.users.length === 0 ? (
					<p className="text-sm text-slate-600 dark:text-slate-400">
						No users found.
					</p>
				) : (
					<ul className="divide-y divide-slate-200 dark:divide-slate-800">
						{ac.users.map((user) => {

							const isSelf = user.id === auth.user?.id;
							const locked = isSelf || user.is_sys_admin;
							const pending = ac.pendingUserId === user.id;
							const confirming = confirmDeleteId === user.id;

							return (
								<li key={user.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
									<div className="min-w-0">
										<div className="flex flex-wrap items-center gap-2">
											<p className="truncate text-sm font-medium text-slate-900 dark:text-white">
												{user.name}
											</p>
											{user.is_sys_admin && (
												<span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
													Admin
												</span>
											)}
											{!user.is_enabled && (
												<span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/60 dark:text-red-300">
													Disabled
												</span>
											)}
											{!user.email_verified && (
												<span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
													Unverified
												</span>
											)}
										</div>
										<p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-400">
											{user.email}
										</p>
										{user.created_at && (
											<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
												Joined {new Date(user.created_at).toLocaleDateString()}
											</p>
										)}
									</div>

									{locked ? (
										<p className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
											{isSelf ? "This is you" : "Admin accounts can't be changed here"}
										</p>
									) : !confirming ? (
										<div className="flex shrink-0 items-center gap-2">
											<button
												type="button"
												onClick={() => ac.onToggleEnabled(user)}
												disabled={pending}
												className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
											>
												{pending ? "Saving..." : user.is_enabled ? "Disable" : "Enable"}
											</button>
											<button
												type="button"
												onClick={() => setConfirmDeleteId(user.id)}
												disabled={pending}
												className="rounded-xl border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
											>
												Delete
											</button>
										</div>
									) : (
										<div className="flex shrink-0 items-center gap-2">
											<button
												type="button"
												onClick={() => setConfirmDeleteId(null)}
												disabled={pending}
												className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
											>
												Cancel
											</button>
											<button
												type="button"
												onClick={() => handleDelete(user)}
												disabled={pending}
												className="rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
											>
												{pending ? "Deleting..." : "Confirm: delete account"}
											</button>
										</div>
									)}
								</li>
							);
						})}
					</ul>
				)}

				{ac.hasMore && (
					<div className="mt-5 flex justify-center">
						<button
							type="button"
							onClick={ac.loadMore}
							disabled={ac.loading}
							className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
						>
							{ac.loading ? "Loading..." : "Load more"}
						</button>
					</div>
				)}
			</section>
		</div>
	);
}
