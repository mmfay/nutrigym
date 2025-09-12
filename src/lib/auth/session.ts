// lib/auth/session.ts
import "server-only";
import { cookies } from "next/headers";
import pool from "@/lib/db/db";

export const SESSION_COOKIE = "sid";

export type Session = { user_id: string; data: any };
export type UserRow = { id: string; name: string; email: string };

// get session data
export async function getSession(): Promise<Session | null> {
    
    // gets the session sid
    const cookieStore = await cookies();              
    const sid = cookieStore.get(SESSION_COOKIE)?.value;
    
    if (!sid) return null;

    // finds the session in the database based on sid
    const { rows } = await pool.query(
        `select user_id, data
        from auth_sessions
        where id = $1 and expires_at > now()
        limit 1`,
        [sid]
    );

    return rows[0] ? { user_id: rows[0].user_id, data: rows[0].data } : null;
    
}

// get user data
export async function getUser(): Promise<UserRow | null> {
    const sess = await getSession();
    if (!sess) return null;
    const { rows } = await pool.query<UserRow>(
        `select id, name, email from users where id = $1 limit 1`,
        [sess.user_id]
    );
    return rows[0] ?? null;
}