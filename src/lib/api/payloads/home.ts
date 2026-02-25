// lib/api/macros/macros.ts
import { HomePayload } from "@/lib/dataTypes";
import { ApiResult } from "@/lib/dataTypes/results";
import { getJSON } from "../submissions";

export async function fetchHomePagePayload(): Promise<ApiResult<HomePayload>> {
	return getJSON("/api/home", {});	
}