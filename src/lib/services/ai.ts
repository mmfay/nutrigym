import OpenAI from "openai";

import { ResponseBuilder as R } from "../utils/response";

export type FoodMacros = {
	foodName: string;
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
};

const client = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

function toDataUrl(bytes: Uint8Array, mimeType: string) {
	const base64 = Buffer.from(bytes).toString("base64");
	return `data:${mimeType};base64,${base64}`;
}

/**
 * Moderates an image (data URL or regular URL). Throws if flagged.
 * Uses omni-moderation-latest which supports image inputs.
 */
async function moderateImage(imageUrl: string) {
	const mod = await client.moderations.create({
		model: "omni-moderation-latest",
		input: [
		// Optional: include a little text context for better classification signals
		{ type: "text", text: "User uploaded an image for food macro estimation." },
		{ type: "image_url", image_url: { url: imageUrl } },
		],
	});

	const result = mod.results?.[0];

	if (!result) {
		return R.badGateway("Issue moderating request");
	}

	// improve on how we moderate for now, just throw an error.
	if (result.flagged) {
		// You can choose to be more granular (block only certain categories),
		// but simplest is: if flagged => reject.
		const categories = Object.entries(result.categories ?? {})
		.filter(([, v]) => v)
		.map(([k]) => k);

		return R.badRequest("Photo did not pass moderation");
	}

	return result; // in case you want logging/telemetry
}

/**
 * Uses OpenAI to calculate macros from an image.
 */
export async function estimateMacrosFromImage(args: {
	bytes: Uint8Array;
	mimeType: string;
}){

	const { bytes, mimeType } = args;

	const imageUrl = toDataUrl(bytes, mimeType);

	// moderate photo
	await moderateImage(imageUrl);

	// macro estimation prompt if moderation is successful
	const prompt =
		`You are a nutrition estimator.\n` +
		`First, identify the food as a COMMON NAME someone would type into a food log (1–3 words).\n` +
		`Examples: "lemon", "chicken fajitas", "pepperoni pizza", "scrambled eggs".\n` +
		`Do NOT describe the scene or use adjectives like "plate of", "close-up", "homemade".\n` +
		`\n` +
		`Then estimate TOTAL macros for all food shown (combine items).\n` +
		`Return ONLY valid JSON with EXACT keys: foodName, calories, protein, carbs, fat.\n` +
		`Numbers only. Protein/carbs/fat are grams. No extra text.`;

	const resp = await client.chat.completions.create({
		model: "gpt-4.1-mini",
		temperature: 0.2,
		messages: [
		{
			role: "user",
			content: [
			{ type: "text", text: prompt },
			{ type: "image_url", image_url: { url: imageUrl } },
			],
		},
		],
		response_format: { type: "json_object" },
	});

	const text = resp.choices[0]?.message?.content ?? "{}";

	let parsed: any;

	try {
		parsed = JSON.parse(text);
	} catch {
		return R.badGateway("Service was not able to process at this time");
	}

	const macros: FoodMacros = {
		foodName: parsed.foodName,
		calories: Number(parsed.calories ?? 0),
		protein: Number(parsed.protein ?? 0),
		carbs: Number(parsed.carbs ?? 0),
		fat: Number(parsed.fat ?? 0),
	};

	if (
		!Number.isFinite(macros.calories) ||
		!Number.isFinite(macros.protein) ||
		!Number.isFinite(macros.carbs) ||
		!Number.isFinite(macros.fat) ||
		macros.foodName
	) {
		return R.badGateway("Service was not able to process at this time.");
	}

	return macros;

}