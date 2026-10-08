"use client";

import Recipes from "@/app/components/KitchenTabs/Recipes";

export default function Kitchen() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100">
			<div className="mx-auto max-w-7xl px-6 py-8">
				<Recipes />
			</div>
		</div>
	);
}