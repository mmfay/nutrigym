import { z } from "zod";
import { isDisposableEmail } from "disposable-email-domains-js";

export const RegisterInputSchema = z.object({
	email: z
		.string()
		.trim()
		.toLowerCase()
		.pipe(z.email())
		.refine((email) => !isDisposableEmail(email), {
			message: "Disposable email addresses are not allowed. Please use a permanent email address.",
		}),
	name: z.string().trim().min(1),
	password: z.string().min(8),
});

export type RegisterInput = z.infer<typeof RegisterInputSchema>;