import { ResponseBuilder as R } from "@/lib/utils/response";
import { estimateMacrosFromImage } from "@/lib/services/ai";

export const runtime = "nodejs";

export async function POST(req: Request) {

	try {
		const form = await req.formData();

		const file = form.get("image");

		if (!(file instanceof File)) {
			return R.badRequest("missing image");
		}

		const bytes = new Uint8Array(await file.arrayBuffer());

		// Optional guardrails
		if (!file.type.startsWith("image/")) {
			return R.badRequest("file must be an image");
		}
		if (bytes.length === 0) {
			return R.badRequest("empty upload");
		}

		const macros = await estimateMacrosFromImage({
			bytes,
			mimeType: file.type || "image/jpeg",
		});

		return R.ok(macros, "successfully retrieved macros");

	} catch (e: any) {

		return R.serverError(e?.message ?? "server error");

	}
}