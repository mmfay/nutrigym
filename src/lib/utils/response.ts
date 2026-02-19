// lib/utils/response.ts
import { NextResponse } from "next/server";

export class ResponseBuilder {

	static json<T>(data: T, status: number, message?: string) {

		return NextResponse.json(
		{
			ok: status >= 200 && status < 300,
			message,
			data,
		},
		{
			status,
			headers: { "Cache-Control": "no-store" },
		}
		);
		
  	}

	static unauthorized(message = "You must be signed in.") {
		return this.json(null, 401, message);
	}

	static ok<T>(data?: T, message = "OK") {
		return this.json(data ?? null, 200, message);
	}

	static created<T>(data?: T, message = "Created") {
		return this.json(data ?? null, 201, message);
	}

	static serverError(message = "Internal Server Error") {
		return this.json(null, 500, message);
	}

	static badRequest(message = "Bad Request") {
		return this.json(null, 400, message);
	}
}
