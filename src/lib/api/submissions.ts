import { ApiResult } from "../dataTypes/results";

// shared fetch helper, can be used for most posts.
export async function postJSON<TBody extends object>(url: string, body: TBody): Promise<ApiResult> {

	const res = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify(body),
	});

	const ct = res.headers.get("content-type") || "";
	const isJSON = ct.includes("application/json");
	const payload = isJSON ? await res.json() : await res.text();

	return payload

}

// shared fetch helper, can be used for most gets.
export async function getJSON<
	TData = unknown,
	TParams extends Record<string, any> = Record<string, any>>(
  url: string,
  params?: TParams
): Promise<ApiResult<TData>> {
	// Build URL with query params
	let fullUrl = url;

	if (params && Object.keys(params).length > 0) {
		const qs = new URLSearchParams();

		for (const [key, value] of Object.entries(params)) {
		if (value === undefined || value === null) continue;

		if (Array.isArray(value)) {
			for (const v of value) qs.append(key, String(v));
		} else {
			qs.set(key, String(value));
		}
		}

		fullUrl += (url.includes("?") ? "&" : "?") + qs.toString();
	}

	const res = await fetch(fullUrl, {
		method: "GET",
		credentials: "include",
		headers: { Accept: "application/json" },
	});

	const ct = res.headers.get("content-type") || "";
	const isJSON = ct.includes("application/json");
	const payload = isJSON ? await res.json() : await res.text();

	return payload;
}

// shared fetch helper, can be used for most deletes.
export async function deleteJSON<
	TData = unknown,
	TParams extends Record<string, any> = Record<string, any>
>(
	url: string,
	params?: TParams
): Promise<ApiResult<TData>> {

	// Build URL with query params
	let fullUrl = url;

	if (params && Object.keys(params).length > 0) {

		const qs = new URLSearchParams();

		for (const [key, value] of Object.entries(params)) {

			if (value === undefined || value === null) continue;

			if (Array.isArray(value)) {
				for (const v of value) qs.append(key, String(v));
			} else {
				qs.set(key, String(value));
			}

		}

		fullUrl += (url.includes("?") ? "&" : "?") + qs.toString();
	}

	const res = await fetch(fullUrl, {
		method: "DELETE",
		credentials: "include",
		headers: { Accept: "application/json" },
	});

	const ct = res.headers.get("content-type") || "";
	const isJSON = ct.includes("application/json");
	const payload = isJSON ? await res.json() : await res.text();

	// If your API returns the ApiResult envelope, just return it.
	// Otherwise, wrap it.
	if (isJSON && payload && typeof payload === "object" && "ok" in payload) {
		const env = payload as ApiResult<TData>;
		return {
			...env,
			status: env.status ?? res.status,
			statusText: env.statusText ?? res.statusText,
		};
	}

	return payload;
	
}
