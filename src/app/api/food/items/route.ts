// app/api/food/recent/dinner/route.ts
import { NextResponse } from "next/server";
import { FoodCreate } from "@/lib/dataTypes";
import { getUserID } from "@/lib/services/user";
import { addNewFood } from "@/lib/services/food";

export async function POST(req: Request) {
	
	// check user
	await getUserID();
	
	const body = await req.json();
	const newFood = body.newFood;

	if(!newFood) {
 return NextResponse.json({ success: false, error: "Missing name" }, { status: 400 });
	}
	
	await addNewFood(newFood);

	const data = { success: true }

	return NextResponse.json(data, {
		headers: { "Cache-Control": "no-store" },
	});

}
