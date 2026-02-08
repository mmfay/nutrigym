import { postJSON, getJSON } from "./submissions";
import { ApiResult } from "../dataTypes/results";

// login method
export async function login(email: string, password: string): Promise<ApiResult> {
  return postJSON("/api/auth/login", { email, password });
}

// logout method
export async function logout(): Promise<ApiResult> {
    return postJSON("/api/auth/logout", { });
}

// registration method
export async function register(email: string, name: string, password: string): Promise<ApiResult> {
  return postJSON("/api/auth/register", { email, name, password });
}

// authentication data retrieve
export async function me(): Promise<ApiResult> {
  return getJSON("/api/auth/me", );
}
