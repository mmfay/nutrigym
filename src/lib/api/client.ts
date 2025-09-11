export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  
    const res = await fetch(path, {
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
        ...init,
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
    }

    return res.json();
}
