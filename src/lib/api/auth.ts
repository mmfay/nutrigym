// lib/api/auth.ts

export type UserDTO = {
  id: string;
  name: string;
  email: string;
  is_sys_admin?: boolean;
};

export type ApiSuccess = { message: string; user?: UserDTO };
export type ApiResult =
  | { ok: true; data: ApiSuccess; status: number; statusText: string }
  | { ok: false; error: string; status: number; statusText: string; body?: any };

// shared fetch helper, can this be used for all posts? move to separate file?
async function postJSON<TBody extends object>(url: string, body: TBody): Promise<ApiResult> {
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

// login method
export async function login(email: string, password: string): Promise<ApiResult> {
  return postJSON("/api/auth/login", { email, password });
}


// registration method
export async function register(user_id: string, email: string, name: string, password: string): Promise<ApiResult> {
  return postJSON("/api/auth/register", { user_id, email, name, password });
}
