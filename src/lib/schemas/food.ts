import { z } from "zod";

// a new food uses this type and is checked.
export const FoodInputSchema = z.object({
	name: z.string().min(1),						// Ex. Apple
	brand: z.string().optional(),					// Ex. Kelloggs
	calories: z.number().int().nonnegative(),		// Ex. 120
	fat: z.number().int().nonnegative(),			// Ex. 120
	carbs: z.number().int().nonnegative(),			// Ex. 120
	protein: z.number().int().nonnegative(),		// Ex. 120
	servingMode: z.string(),						// Ex. COUNT or MEASURE
	servingThing: z.string(),
	servingQty: z.number().int().nonnegative(),
	barcode: z.string(),
});

// used for typing the food input
export type FoodInput = z.infer<typeof FoodInputSchema>;

