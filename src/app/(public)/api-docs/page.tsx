const CODE = (children: string) => (
	<pre className="overflow-x-auto rounded-lg bg-neutral-900 px-5 py-4 text-sm leading-6 text-neutral-100">
		<code>{children}</code>
	</pre>
);

function Endpoint({
	method,
	path,
	description,
	params,
	exampleRequest,
	exampleResponse,
}: {
	method: string;
	path: string;
	description: string;
	params?: { name: string; type: string; required: boolean; description: string }[];
	exampleRequest: string;
	exampleResponse: string;
}) {
	return (
		<section className="space-y-5 rounded-xl border border-border p-6 sm:p-8">
		<div className="flex flex-wrap items-center gap-3">
			<span className="rounded-md bg-foreground px-2.5 py-1 text-xs font-bold tracking-wide text-background">
			{method}
			</span>
			<code className="text-base font-semibold sm:text-lg">{path}</code>
		</div>

		<p className="text-base leading-7 text-muted-foreground">{description}</p>

		{params && params.length > 0 && (
			<div className="space-y-2">
			<h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
				Query Parameters
			</h3>
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
				<thead>
					<tr className="border-b border-border text-left text-muted-foreground">
					<th className="py-2 pr-4 font-medium">Name</th>
					<th className="py-2 pr-4 font-medium">Type</th>
					<th className="py-2 pr-4 font-medium">Required</th>
					<th className="py-2 font-medium">Description</th>
					</tr>
				</thead>
				<tbody>
					{params.map((p) => (
					<tr key={p.name} className="border-b border-border/50">
						<td className="py-2 pr-4 font-mono">{p.name}</td>
						<td className="py-2 pr-4 text-muted-foreground">{p.type}</td>
						<td className="py-2 pr-4 text-muted-foreground">
						{p.required ? "Yes" : "No"}
						</td>
						<td className="py-2 text-muted-foreground">{p.description}</td>
					</tr>
					))}
				</tbody>
				</table>
			</div>
			</div>
		)}

		<div className="space-y-2">
			<h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
			Example Request
			</h3>
			{CODE(exampleRequest)}
		</div>

		<div className="space-y-2">
			<h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
			Example Response
			</h3>
			{CODE(exampleResponse)}
		</div>
		</section>
	);
}

export default function ApiDocsPage() {

	return (
		<main className="min-h-screen bg-background text-foreground">
		<div className="mx-auto max-w-4xl px-6 py-16 sm:px-8 lg:px-10">
			<div className="space-y-12">
			<header className="space-y-4 border-b border-border pb-6">
				<h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
				NutriGym API
				</h1>
				<p className="text-base leading-7 text-muted-foreground sm:text-lg">
				A small read-only API for pulling your NutriGym data into other
				tools. All endpoints below are versioned under{" "}
				<code className="rounded bg-neutral-900 px-1.5 py-0.5 text-sm text-neutral-100">
					/api/v1
				</code>{" "}
				and require an API key.
				</p>
			</header>

			<section className="space-y-4">
				<h2 className="text-2xl font-semibold tracking-tight">
				Authentication
				</h2>
				<p className="text-base leading-7 text-muted-foreground sm:text-lg">
				Generate a key from{" "}
				<span className="font-medium text-foreground">Settings</span> in
				the app. Send it on every request as a bearer token in the{" "}
				<code className="rounded bg-neutral-900 px-1.5 py-0.5 text-sm text-neutral-100">
					Authorization
				</code>{" "}
				header:
				</p>
				{CODE(`Authorization: Bearer <your_api_key>`)}
				<p className="text-base leading-7 text-muted-foreground sm:text-lg">
				Generating a new key revokes any previous key for your account.
				Requests with a missing or invalid key receive a{" "}
				<code className="rounded bg-neutral-900 px-1.5 py-0.5 text-sm text-neutral-100">
					401
				</code>{" "}
				response.
				</p>
			</section>

			<section className="space-y-4">
				<h2 className="text-2xl font-semibold tracking-tight">
				Response Shape
				</h2>
				<p className="text-base leading-7 text-muted-foreground sm:text-lg">
				Every endpoint returns the same envelope:
				</p>
				{CODE(`{
					"ok": boolean,
					"message": string,
					"data": T | null
				}`)}
			</section>

			<section className="space-y-6">
				<h2 className="text-2xl font-semibold tracking-tight">
				Endpoints
				</h2>

				<Endpoint
				method="GET"
				path="/api/v1/weight"
				description="Returns your logged weight entries over a trailing window of days, oldest first."
				params={[
					{
					name: "days",
					type: "integer",
					required: false,
					description:
						"Number of trailing days to include. 1–365, defaults to 28.",
					},
				]}
				exampleRequest={`curl "https://nutrigym.softwarerror.com/api/v1/weight?days=7" \\
					-H "Authorization: Bearer <your_api_key>"`}
				exampleResponse={`{
					"ok": true,
					"message": "Successfully retrieved weight.",
					"data": [
						{ "date": "2026-07-04", "weight": 181.2 },
						{ "date": "2026-07-06", "weight": 180.8 },
						{ "date": "2026-07-11", "weight": 180.1 }
					]
					}`}
				/>

				<Endpoint
				method="GET"
				path="/api/v1/macros"
				description="Returns your current active macro goals."
				exampleRequest={`curl "https://nutrigym.softwarerror.com/api/v1/macros" \\
					-H "Authorization: Bearer <your_api_key>"`}
				exampleResponse={`{
					"ok": true,
					"message": "Successfully retrieved macro goals.",
					"data": {
						"calories": 2400,
						"protein": 180,
						"carbs": 250,
						"fat": 70
					}
				}`}
				/>

				<Endpoint
				method="GET"
				path="/api/v1/macros/tracked"
				description="Returns your logged (tracked) macros for the trailing 7-day window ending on the given date, oldest first."
				params={[
					{
					name: "date",
					type: "string (YYYY-MM-DD)",
					required: false,
					description:
						"Anchor date for the 7-day window. Defaults to today (UTC).",
					},
				]}
				exampleRequest={`curl "https://nutrigym.softwarerror.com/api/v1/macros/tracked?date=2026-07-11" \\
					-H "Authorization: Bearer <your_api_key>"`}
				exampleResponse={`{
					"ok": true,
					"message": "Successfully retrieved tracked macros.",
					"data": [
						{ "date": "Sat", "protein": 142, "carbs": 210, "fat": 61 },
						{ "date": "Sun", "protein": 155, "carbs": 198, "fat": 58 },
						{ "date": "Mon", "protein": 130, "carbs": 220, "fat": 65 },
						{ "date": "Tue", "protein": 148, "carbs": 205, "fat": 60 },
						{ "date": "Wed", "protein": 160, "carbs": 190, "fat": 55 },
						{ "date": "Thu", "protein": 138, "carbs": 215, "fat": 63 },
						{ "date": "Fri", "protein": 150, "carbs": 200, "fat": 59 }
					]
				}`}
				/>

				<Endpoint
				method="GET"
				path="/api/v1/workouts"
				description="Returns your finished workouts started within a trailing window of days, newest first, with every exercise and set. Weights are in lb, distances in miles, durations in seconds. Warm-up sets are flagged with is_warmup. Exercises that track time or distance leave weight and reps null. superset_with_next is true when an exercise was performed back to back with the next exercise by position; a run of linked exercises forms one superset."
				params={[
					{
					name: "days",
					type: "integer",
					required: false,
					description:
						"Number of trailing days to include. 1–365, defaults to 28.",
					},
				]}
				exampleRequest={`curl "https://nutrigym.softwarerror.com/api/v1/workouts?days=7" \\
					-H "Authorization: Bearer <your_api_key>"`}
				exampleResponse={`{
					"ok": true,
					"message": "Successfully retrieved workouts.",
					"data": [
						{
							"id": 42,
							"template_id": 3,
							"name": "Push Day A",
							"notes": null,
							"started_at": "2026-07-11T17:02:11.000Z",
							"ended_at": "2026-07-11T18:04:40.000Z",
							"exercises": [
								{
									"id": 118,
									"exercise_id": 1,
									"exercise_name": "Barbell Bench Press",
									"muscle_group": "chest",
									"equipment": "barbell",
									"tracking_type": "WEIGHT_REPS",
									"position": 0,
									"target_sets": 3,
									"target_reps": 8,
									"target_weight": 185,
									"target_duration_seconds": null,
									"superset_with_next": false,
									"sets": [
										{
											"id": 901,
											"session_exercise_id": 118,
											"set_number": 1,
											"weight": 185,
											"reps": 8,
											"duration_seconds": null,
											"distance": null,
											"is_warmup": false,
											"created_at": "2026-07-11T17:08:52.000Z"
										}
									]
								}
							]
						}
					]
				}`}
				/>
			</section>

			<section className="space-y-3">
				<h2 className="text-2xl font-semibold tracking-tight">Errors</h2>
				<p className="text-base leading-7 text-muted-foreground sm:text-lg">
				A missing or invalid API key returns:
				</p>
				{CODE(`{
					"ok": false,
					"message": "Invalid or missing API key.",
					"data": null
				}`)}
			</section>
			</div>
		</div>
		</main>
	);

}