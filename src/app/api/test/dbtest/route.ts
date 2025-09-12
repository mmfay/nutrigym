export const runtime = "nodejs"; // force Node runtime (pg doesn't work on Edge)

import { NextResponse } from "next/server";
import pool from "@/lib/db/db";
import { getUser } from "@/lib/auth/session";

// shows we can connect to our database
export async function GET() {

	const userId = await getUser();  
  	console.log("USERID ->", userId?.id); 

    try {
      	const result = await pool.query("SELECT NOW() as now");
      	return NextResponse.json({ ok: true, now: result.rows[0].now });
    } catch (err: any) {
      	console.error("DB error:", err);
      	return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
	
}
