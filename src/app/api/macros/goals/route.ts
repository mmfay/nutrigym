// app/api/macros/route.ts
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { getUser, SESSION_COOKIE } from "@/lib/auth/session";
import { getTodayGoals, setMacroGoals } from "@/lib/services/macros";
import { ResponseBuilder as R } from "@/lib/utils/response";

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

    const data = await getTodayGoals(userId);
    return NextResponse.json(data);

}

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
	
	const body = await req.json();
	const newGoals = body.newGoals;

	if(!newGoals) {
		return R.badRequest("No Goal to Create");
	}
	
	const data = await setMacroGoals(userId, newGoals);

	return R.ok(data, "Successfully created Goals");

}
