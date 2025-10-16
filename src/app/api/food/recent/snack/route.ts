// app/api/food/recent/snack/route.ts
import { NextResponse } from "next/server";
import { getRecentFood } from "@/lib/services/food";
import { getUser, SESSION_COOKIE } from "@/lib/auth/session";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    // get snack
    const data = await getRecentFood(userId,3);

    return NextResponse.json(data, {
        headers: { "Cache-Control": "no-store" },
    });

}
