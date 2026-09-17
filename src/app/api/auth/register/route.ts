export const runtime = "nodejs";

import { ResponseBuilder as R } from "@/lib/utils/response";
import bcrypt from "bcryptjs";
import { insertUser } from "@/lib/services/user";
import { RegisterInputSchema } from "@/lib/schemas/auth";

// round of encryption
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 12);

export async function POST(req: Request) {

	try {

		const body = await req.json();
		const parsed = RegisterInputSchema.safeParse(body);

		if (!parsed.success) {
			const message = parsed.error.issues[0]?.message ?? "Please enter a valid email, name, and password (min 8 characters).";
			return R.badRequest(message);
		}

		const { email: normEmail, name, password } = parsed.data;

		// hash password
		const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

		const newUser = await insertUser(normEmail, name, password_hash)

		if (!newUser) {
			throw new Error("Error during creation process.");
		}

		return R.ok("User created successfully.");

	} catch (err: any) {
		
		// Handle unique constraint violations (Postgres 23505)
		if (err?.code === "23505") {

			return R.badRequest("Email already exists");

		}

		console.error(err);
		return R.serverError("An error occurred on the server.");

	}

}