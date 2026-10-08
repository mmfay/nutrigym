// app/api/food/recent/breakfast/route.ts
import { findFoods, findFoodsByBarcode } from "@/lib/services/food";
import { getUserID } from "@/lib/services/user";
import { ResponseBuilder as R } from "@/lib/utils/response";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {

    await getUserID();

    const { searchParams } = new URL(req.url);
	const searchText = searchParams.get("text") ?? "";
	const barcode = searchParams.get("barcode");

	// ?barcode= is an exact UPC/EAN match; ?text= searches name and brand
    const data = barcode !== null ? await findFoodsByBarcode(barcode) : await findFoods(searchText);

    return R.ok(data, "Data retrieved Successfully");

}