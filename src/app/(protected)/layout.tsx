import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
	children,
}: {
	children: React.ReactNode;
}) {

	const cookieStore = await cookies();

	// ✅ change "session" to your real cookie name
	const hasSession = cookieStore.get("sid")?.value;

	if (!hasSession) {
		redirect("/login");
	}

	return <>{children}</>;

}
