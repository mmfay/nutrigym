import { postJSON, getJSON } from "./submissions";
import { ApiResult } from "../dataTypes/results";
import { UserDTO } from "../dataTypes/auth";

// login method
export async function login(email: string, password: string): Promise<ApiResult<null>> {
  return postJSON("/api/auth/login", { email, password });
}

// logout method
export async function logout(): Promise<ApiResult<null>> {
    return postJSON("/api/auth/logout", { });
}

// registration method
export async function register(email: string, name: string, password: string): Promise<ApiResult<null>> {
  return postJSON("/api/auth/register", { email, name, password });
}

// authentication data retrieve
export async function me(): Promise<ApiResult<UserDTO>> {
  return getJSON("/api/auth/me", );
}
