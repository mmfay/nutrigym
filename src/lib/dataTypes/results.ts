import { UserDTO } from "./auth";

export type ApiSuccess = { 
	message: string; 
	user?: UserDTO 
};

export type ApiResult =
	| { ok: true; data: ApiSuccess; status: number; statusText: string }
	| { ok: false; error: string; status: number; statusText: string; body?: any };
