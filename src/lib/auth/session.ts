// lib/auth/session.ts
import "server-only";
import { cookies } from "next/headers";
import pool from "@/lib/db/db";
import { User } from "../dataTypes/auth";

export const SESSION_COOKIE = "ng_sid";

export type Session = { user_id: string; data: any };
export type UserRow = { id: string; name: string; email: string };

// get session data
export async function getSession(): Promise<Session | null> {
    
    // gets the session sid
    const cookieStore = await cookies();              
    const sid = cookieStore.get(SESSION_COOKIE)?.value;
    
    if (!sid) return null;

	// disabled users are treated as signed out, even if their session hasn't expired
	const sql = `
		select 
			s.user_id
			,s.data
        from auth_sessions s
		join users u on u.id = s.user_id
        where 
			s.id = $1 
			and s.expires_at > now()
			and u.is_enabled = true
        limit 1;
	`;

    // finds the session in the database based on sid
    const { rows } = await pool.query(sql,[sid]);

    return rows[0] ? { user_id: rows[0].user_id, data: rows[0].data } : null;
    
}

// get user data
export async function getUser(): Promise<User | null> {

    const sess = await getSession();

    if (!sess) return null;

    const { rows } = await pool.query<User>(
        `select id, name, email, timezone from users where id = $1 limit 1`,
        [sess.user_id]
    );

    return rows[0] ?? null;
	
}