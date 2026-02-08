import { ApiResult, ApiSuccess } from "../dataTypes/results";

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

	if (!res.ok) {
		const msg = isJSON ? payload?.message ?? payload?.error : String(payload);
		return { ok: false, error: msg || res.statusText || "Request failed", status: res.status, statusText: res.statusText, body: payload };
	}

	return { ok: true, data: (payload as ApiSuccess) ?? { message: "OK" }, status: res.status, statusText: res.statusText };

}

// shared fetch helper, can be used for most posts.
export async function getJSON<TParams extends Record<string, any> = Record<string, any>>(
  url: string,
  params?: TParams
): Promise<ApiResult> {
	// Build URL with query params
	let fullUrl = url;

	if (params && Object.keys(params).length > 0) {
		const qs = new URLSearchParams();

		for (const [key, value] of Object.entries(params)) {
		if (value === undefined || value === null) continue;

		if (Array.isArray(value)) {
			// ?key=a&key=b
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

	if (!res.ok) {
		const msg = isJSON ? payload?.message ?? payload?.error : String(payload);
		return {
		ok: false,
		error: msg || res.statusText || "Request failed",
		status: res.status,
		statusText: res.statusText,
		body: payload,
		};
	}

	return {
		ok: true,
		data: (payload as ApiSuccess) ?? { message: "OK" },
		status: res.status,
		statusText: res.statusText,
	};
}