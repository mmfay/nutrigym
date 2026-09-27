import { redirect } from "next/navigation";
import { getUser } from "@/lib/services/user";

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {

	const user = await getUser();

	if (!user?.is_sys_admin) {
		redirect("/home");
	}

	return <>{children}</>;

}
