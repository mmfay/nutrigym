import { ResponseBuilder as R } from "@/lib/utils/response";
import { getUser } from "@/lib/services/user";
import { findExercises, createExercise, deleteExercise } from "@/lib/services/exercises";
import { MUSCLE_GROUPS, EQUIPMENT, TRACKING_TYPES } from "@/lib/dataTypes/dropdownData";
import { MuscleGroup, Equipment, TrackingType } from "@/lib/dataTypes";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {

	const user = await getUser();
	if (!user) return R.unauthorized();

	const { searchParams } = new URL(req.url);
	const text = searchParams.get("text")?.trim() ?? "";
	const muscleGroup = searchParams.get("muscle_group") || undefined;

	if (muscleGroup && !MUSCLE_GROUPS.includes(muscleGroup as MuscleGroup)) {
		return R.badRequest("Invalid muscle group");
	}

	const exercises = await findExercises(user.id, text, muscleGroup);
	return R.ok(exercises, "Data retrieved Successfully");

}

export async function POST(req: Request) {

	const user = await getUser();
	if (!user) return R.unauthorized();

	const body = await req.json();
	const { name, muscle_group, equipment, tracking_type } = body;

	if (!name?.trim()) return R.badRequest("Exercise name is required");
	if (!MUSCLE_GROUPS.includes(muscle_group)) return R.badRequest("Invalid muscle group");
	if (!EQUIPMENT.includes(equipment)) return R.badRequest("Invalid equipment");
	if (!TRACKING_TYPES.includes(tracking_type)) return R.badRequest("Invalid tracking type");

	const exercise = await createExercise(
		user.id,
		{
			name: name.trim(),
			muscle_group: muscle_group as MuscleGroup,
			equipment: equipment as Equipment,
			tracking_type: tracking_type as TrackingType,
		},
		user.is_sys_admin
	);

	if (!exercise) return R.badRequest("An exercise with that name already exists");

	return R.created(exercise, "Exercise created");

}

export async function DELETE(req: Request) {

	const user = await getUser();
	if (!user) return R.unauthorized();

	const { searchParams } = new URL(req.url);
	const id = Number(searchParams.get("id"));

	if (!id) return R.badRequest("Missing exercise id");

	const result = await deleteExercise(user.id, id);
	if (result === "not_found") return R.notFound("Exercise not found");
	if (result === "in_use") return R.badRequest("This exercise is in your workout history and can't be deleted");

	return R.ok(null, "Exercise deleted");

}