// app/api/food/recent/breakfast/route.ts
import { NextResponse } from "next/server";
import { findFoods } from "@/lib/services/food";
import { getUserID } from "@/lib/services/user";
import { getUser, SESSION_COOKIE } from "@/lib/auth/session";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {

    await getUserID();

    const { searchParams } = new URL(req.url);
	const searchText = searchParams.get("text") ?? "";

    const data = await findFoods(searchText);
    console.log(data);
    return NextResponse.json(
        data, {
        headers: { "Cache-Control": "no-store" },
    });

}
