// app/api/weight/add/route.ts
import { logFood } from "@/lib/services/tracking";
import { Food } from "@/lib/dataTypes";
import { ResponseBuilder as R } from "@/lib/utils/response";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { getUser, SESSION_COOKIE } from "@/lib/auth/session";

export async function POST(req: Request) {

    const userid = await getUser();
    const userId = userid?.id; 

    // if no user is clear cookie and return unauthenticated
    if (!userId) {

        const res = R.unauthorized();

        // Optional: clear stale cookie so clients don’t keep sending it
        res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
        return res;

    }

    const { foodItem, meal, date } = (await req.json()) as {
        foodItem: Food;
        meal: number;
        date: Date;
    };

    try {
        console.log(date);
        const row = await logFood(userId, meal, date, foodItem);
    } catch (err) {
        console.log(err);
    }
        
    return R.ok({}, "Food Tracked Successfully");

}
