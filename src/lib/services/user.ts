import { getUser, SESSION_COOKIE } from "@/lib/auth/session";
import { ResponseBuilder as R } from "../utils/response";

export async function getUserID(){

	const user = await getUser();
	const userID = user?.id; 

	// if no user is clear cookie and return unauthenticated
	if (!userID) {

		const res = R.unauthorized("You Must be Signed In.");
		// Clear stale cookie so clients don’t keep sending it
		res.cookies.set(SESSION_COOKIE, "", { 
			httpOnly: true, 
			secure: true, 
			sameSite: "lax", 
			path: "/", 
			maxAge: 0 
		});
		throw res;

	}

	return userID;

}