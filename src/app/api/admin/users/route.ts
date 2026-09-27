export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { ResponseBuilder as R } from "@/lib/utils/response";
import { requireSysAdmin, listUsers } from "@/lib/services/admin";

// GET /api/admin/users?cursor=...&search=...
export async function GET(req: Request) {

	try {

		await requireSysAdmin();

		const url = new URL(req.url);
		const cursor = url.searchParams.get("cursor");
		const search = url.searchParams.get("search")?.trim() || null;

		const page = await listUsers(cursor, search);

		return R.ok(page, "Users retrieved.");

	} catch (err) {

		if (err instanceof Response) return err;

		console.error(err);
		return R.serverError("Unable to retrieve users.");

	}

}