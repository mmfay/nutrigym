// app/api/weight/current/route.ts
import { NextResponse } from "next/server";
import { getWeightTrend } from "@/lib/services/weight";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { getUser, SESSION_COOKIE } from "@/lib/auth/session";

export async function GET() {

    const userid = await getUser();
    const userId = userid?.id; 

    // if no user is clear cookie and return unauthenticated
    if (!userId) {

        const res = NextResponse.json(
            { ok: false, code: "UNAUTHENTICATED", message: "You must be signed in." },
            { status: 401, headers: { "Cache-Control": "no-store" } }
        );
        // Optional: clear stale cookie so clients don’t keep sending it
        res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
        return res;

    }

    const data = await getWeightTrend(userId);
    return NextResponse.json(data);

}
