export const TIMEZONES = [
	"America/Los_Angeles",
	"America/Denver",
	"America/Chicago",
	"America/New_York",
	"America/Phoenix",
	"America/Anchorage",
	"Pacific/Honolulu",
	"UTC",
	"Europe/London",
	"Europe/Paris",
	"Asia/Tokyo",
	"Australia/Sydney",
];
export const MUSCLE_GROUPS = [
	"chest",
	"back",
	"shoulders",
	"biceps",
	"triceps",
	"forearms",
	"quads",
	"hamstrings",
	"glutes",
	"calves",
	"core",
	"full_body",
	"cardio",
] as const;

export const EQUIPMENT = [
	"barbell",
	"dumbbell",
	"machine",
	"cable",
	"bodyweight",
	"kettlebell",
	"band",
	"other",
] as const;

export const TRACKING_TYPES = [
	"WEIGHT_REPS",
	"REPS",
	"TIME",
	"DISTANCE_TIME",
] as const;