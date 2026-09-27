export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { ResponseBuilder as R } from "@/lib/utils/response";
import { requireSysAdmin, setUserEnabled, deleteUser } from "@/lib/services/admin";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/admin/users/:id  { is_enabled: boolean }
export async function PATCH(req: Request, { params }: Params) {

	try {

		const admin = await requireSysAdmin();
		const { id } = await params;

		const body = await req.json().catch(() => null);

		if (typeof body?.is_enabled !== "boolean") {
			return R.badRequest("is_enabled must be a boolean.");
		}

		const user = await setUserEnabled(admin.id, id, body.is_enabled);

		return R.ok(user, body.is_enabled ? "User enabled." : "User disabled.");

	} catch (err) {

		if (err instanceof Response) return err;

		console.error(err);
		return R.serverError("Unable to update user.");

	}

}

// DELETE /api/admin/users/:id
export async function DELETE(_req: Request, { params }: Params) {

	try {

		const admin = await requireSysAdmin();
		const { id } = await params;

		await deleteUser(admin.id, id);

		return R.ok({}, "User deleted.");

	} catch (err) {

		if (err instanceof Response) return err;

		console.error(err);
		return R.serverError("Unable to delete user.");

	}

}