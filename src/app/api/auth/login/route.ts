import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// form of a login request
const LoginReq = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export async function POST(req: NextRequest) {

    try {

        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json(
                { code: "BAD_JSON", message: "Request body must be valid JSON." },
                { status: 400 }
            );
        }

        const parsed = LoginReq.safeParse(body);

        // if not parsed correctly, send errors.
        if (!parsed.success) {

            return NextResponse.json(
                { 
                    code: "BAD_REQUEST", 
                    message: "Invalid payload", 
                    errors: parsed.error.flatten() 
                },
                { 
                    status: 400 
                }
            );

        }

        const { email, password } = parsed.data;

        // 🔒 Hardcoded check for now
        if (email === "test@gmail.com" && password === "secret123") {

            return NextResponse.json(
                {
                    message: "Login successful",
                    user: {
                        id: "test.user",
                        name: "Test User",
                        email: "test@gmail.com",
                        is_sys_admin: true,
                    },
                },
                { 
                    status: 200 
                }
            );

        }

        // Invalid credentials
        return NextResponse.json(

            { 
                code: "INVALID_CREDENTIALS", 
                message: "Invalid email or password" 
            },
            { 
                status: 401 
            }

        );

    } catch (err: any) {

        const isDev = process.env.NODE_ENV !== "production";

        return NextResponse.json(

            {
                code: "INTERNAL",
                message: "Internal server error",
                ...(isDev ? { details: err?.message, stack: err?.stack } : {}),
            },
            { 
                status: 500 
            }

        );

    }

}
