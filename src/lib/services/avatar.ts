import "server-only";
import pool from "@/lib/db/db";
import { ResponseBuilder as R } from "@/lib/utils/response";

// the browser uploads a ~256px square, so anything near this is not a profile photo
export const AVATAR_MAX_BYTES = 1024 * 1024;

type AvatarType = "image/jpeg" | "image/png" | "image/webp";

/**
 * Identifies the image format from its first bytes, so the stored and served type never
 * depends on what the client claimed. Returns null for anything that isn't JPEG, PNG or WebP.
 */
function detectImageType(buf: Buffer): AvatarType | null {

	if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";

	if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";

	if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";

	return null;

}

export async function getAvatar(user_id: string) {

	const { rows } = await pool.query<{ image: Buffer; content_type: AvatarType; version: string }>(
		`SELECT image, content_type, (EXTRACT(EPOCH FROM updated_at) * 1000)::bigint::text AS version
		 FROM user_avatars WHERE user_id = $1`,
		[user_id]
	);

	return rows[0] ?? null;

}

/**
 * Validates and stores a profile photo, returning its new version (used to bust caches).
 */
export async function saveAvatar(user_id: string, image: Buffer) {

	if (image.length === 0) throw R.badRequest("Choose a photo to upload");
	if (image.length > AVATAR_MAX_BYTES) throw R.badRequest("That photo is too large");

	const content_type = detectImageType(image);
	if (!content_type) throw R.badRequest("Photos must be JPEG, PNG or WebP");

	const { rows } = await pool.query<{ version: string }>(
		`INSERT INTO user_avatars (user_id, image, content_type)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (user_id) DO UPDATE
		 SET image = EXCLUDED.image, content_type = EXCLUDED.content_type, updated_at = now()
		 RETURNING (EXTRACT(EPOCH FROM updated_at) * 1000)::bigint::text AS version`,
		[user_id, image, content_type]
	);

	return rows[0].version;

}

export async function deleteAvatar(user_id: string) {
	await pool.query(`DELETE FROM user_avatars WHERE user_id = $1`, [user_id]);
}