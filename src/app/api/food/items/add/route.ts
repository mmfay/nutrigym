// app/api/food/recent/dinner/route.ts
import { NextResponse } from "next/server";
import { FoodInputSchema } from "@/lib/schemas/food";
import { getUserID } from "@/lib/services/user";
import { addNewFood } from "@/lib/services/food";

export async function POST(req: Request) {
	
	// check user
	await getUserID();
	
	// get the json and parse the foodItem.
	const json = await req.json();
  	const body = "foodItem" in json ? json.foodItem : json; 

	const parsed = FoodInputSchema.safeParse(body);

	if (!parsed.success) {
		// Log details for debugging; return actionable issues to client
		console.error(parsed.error.flatten());
		return NextResponse.json(
			{ ok: false, error: "Invalid body", issues: parsed.error.issues },
			{ status: 400, headers: { "Cache-Control": "no-store" } }
		);
	}
	const food = parsed.data;
	
	await addNewFood(food);

	const data = { success: true }

	return NextResponse.json(data, {
		headers: { "Cache-Control": "no-store" },
	});

}
