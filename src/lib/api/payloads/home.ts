// lib/api/macros/macros.ts
import { HomePayload } from "@/lib/dataTypes";

export async function fetchHomePagePayload(): Promise<HomePayload> {
  const res = await fetch("/api/home", {
    method: "GET",
    credentials: "include",
    cache: "no-store", // optional: avoid caching
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch homepage payload: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as HomePayload;

  // Optional debug:
  alert(JSON.stringify(data));

  return data;
}