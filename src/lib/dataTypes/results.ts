export type ApiResult<T> =
	| { ok: true; message?: string; data?: T; status: number; statusText: string }
	| { ok: false; error: string; status: number; statusText: string; body?: any };
