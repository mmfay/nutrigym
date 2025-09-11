export type LoginSuccess = { message: string; user?: { id: string; name: string; email: string; is_sys_admin?: boolean } };
export type LoginResult =
	| { ok: true; data: LoginSuccess; status: number; statusText: string }
	| { ok: false; error: string; status: number; statusText: string; body?: any };

export async function login(email: string, password: string): Promise<LoginResult> {

	const res = await fetch("/api/auth/login", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify({ email, password }),
	});

	const ct = res.headers.get("content-type") || "";
	const isJSON = ct.includes("application/json");
	const body = isJSON ? await res.json() : await res.text();

	if (!res.ok) {
		const msg = isJSON ? body?.message : body;
		return { ok: false, error: msg || "Login failed", status: res.status, statusText: res.statusText, body };
	}

	return { ok: true, data: (body as LoginSuccess) ?? { message: "OK" }, status: res.status, statusText: res.statusText };
}
