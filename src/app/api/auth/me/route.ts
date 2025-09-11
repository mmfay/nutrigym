import { NextResponse } from "next/server";

export async function GET() {
  
	// hardcoded for initial testing
	const user = {
		id: "test.user",
		name: "Test User",
		email: "test@gmail.com",
		is_sys_admin: true,
	};

	return NextResponse.json(
		{
			user,
			permissions: ["dashboard:view", "meals:edit"], // can be empty or mocked
		},
		{ 
			status: 200 
		}
	);
}
