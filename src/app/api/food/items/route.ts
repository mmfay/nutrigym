// app/api/food/recent/dinner/route.ts
import { ResponseBuilder as R } from "@/lib/utils/response";
import { getUserID } from "@/lib/services/user";
import { addNewFood } from "@/lib/services/food";

export async function POST(req: Request) {
	
	// check user
	await getUserID();
	
	const body = await req.json();
	const newFood = body.newFood;

	if(!newFood) {
		return R.badRequest("missing food");
	}
	
	await addNewFood(newFood);

	return R.ok(null,"Food Created Successfully");

}
