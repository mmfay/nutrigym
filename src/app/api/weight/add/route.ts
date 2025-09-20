// app/api/weight/add/route.ts
import { NextResponse } from "next/server";
import { addWeight } from "@/lib/services/weight";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { getUser, SESSION_COOKIE } from "@/lib/auth/session";

export async function POST(req: Request) {

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

    let body;

    // check there is a body
    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
            { ok: false, message: "Invalid JSON body" },
            { status: 400 }
        );
    }

    const { date, weight } = body;

    // check there is a date/weight
    if (!date || typeof weight !== "number") {
        return NextResponse.json(
            { ok: false, message: "Missing date or weight" },
            { status: 400 }
        );
    }

    // try to add weight
    try {
        const trend = await addWeight(userId, date, weight); 
        return NextResponse.json(trend);
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { ok: false, message: "Failed to add weight" },
            { status: 500 }
        );
    }

}
