// lib/api/macros/macros.ts
import { HomePayload } from "@/lib/dataTypes";
import { ApiResult } from "@/lib/dataTypes/results";
import { getJSON } from "../submissions";
import { todayLocalISO } from "@/lib/utils/date";

export async function fetchHomePagePayload(): Promise<ApiResult<HomePayload>> {
	return getJSON("/api/home", { today: todayLocalISO() });	
}