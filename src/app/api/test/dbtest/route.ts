export const runtime = "nodejs"; // force Node runtime (pg doesn't work on Edge)

import { NextResponse } from "next/server";
import pool from "@/lib/db/db";

// shows we can connect to our database
export async function GET() {

    try {
      	const result = await pool.query("SELECT NOW() as now");
      	return NextResponse.json({ ok: true, now: result.rows[0].now });
    } catch (err: any) {
      	console.error("DB error:", err);
      	return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
	
}
