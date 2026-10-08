import { ResponseBuilder as R } from "@/lib/utils/response";
import { getUser } from "@/lib/services/user";
import { AVATAR_MAX_BYTES, deleteAvatar, getAvatar, saveAvatar } from "@/lib/services/avatar";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/usersettings/avatar?v=<version> — the signed-in user's photo. The version in the URL changes
// on every upload, so the browser can cache each one for good.
export async function GET(req: Request) {

	const user = await getUser();
	if (!user) return R.unauthorized();

	try {

		const avatar = await getAvatar(user.id);
		if (!avatar) return R.notFound("No profile photo");

		const versioned = new URL(req.url).searchParams.get("v") === avatar.version;

		return new Response(new Uint8Array(avatar.image), {
			headers: {
				"Content-Type": avatar.content_type,
				"Content-Length": String(avatar.image.length),
				"Cache-Control": versioned ? "private, max-age=31536000, immutable" : "private, no-cache",
				"X-Content-Type-Options": "nosniff",
				"Content-Security-Policy": "default-src 'none'",
			},
		});

	} catch (err) {
		return R.fromError(err);
	}

}

// POST /api/usersettings/avatar  multipart form with a "file" field
export async function POST(req: Request) {

	const user = await getUser();
	if (!user) return R.unauthorized();

	const form = await req.formData().catch(() => null);
	const file = form?.get("file");

	if (!(file instanceof Blob)) return R.badRequest("Choose a photo to upload");
	if (file.size > AVATAR_MAX_BYTES) return R.badRequest("That photo is too large");

	try {
		const version = await saveAvatar(user.id, Buffer.from(await file.arrayBuffer()));
		return R.ok({ avatar_version: version }, "Profile photo updated");
	} catch (err) {
		return R.fromError(err);
	}

}

// DELETE /api/usersettings/avatar
export async function DELETE() {

	const user = await getUser();
	if (!user) return R.unauthorized();

	try {
		await deleteAvatar(user.id);
		return R.ok({ avatar_version: null }, "Profile photo removed");
	} catch (err) {
		return R.fromError(err);
	}

}