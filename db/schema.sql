drop table if exists users cascade;
drop table if exists auth_sessions cascade;
drop table if exists weight cascade;
drop table if exists food cascade;
drop table if exists food_tracker cascade;
drop table if exists macro_goals cascade;
drop table if exists ai_daily_usage cascade;
drop table if exists recipe_items cascade;
drop table if exists recipes cascade;
drop table if exists api_keys cascade;
drop table if exists workout_schedule cascade;
drop table if exists workout_sets cascade;
drop table if exists workout_session_exercises cascade;
drop table if exists workout_sessions cascade;
drop table if exists workout_template_exercises cascade;
drop table if exists workout_templates cascade;
drop table if exists exercises cascade;

-- Users table
create table if not exists users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,          -- unique email
    name VARCHAR(120) NOT NULL,                  -- full name
    password_hash TEXT NOT NULL,                 -- hashed password
	is_enabled BOOLEAN NOT NULL DEFAULT true,    -- whether user account is active
	is_sys_admin BOOLEAN NOT NULL DEFAULT false,
	email_verified BOOLEAN NOT NULL DEFAULT false,    -- whether user account has verified email
	email_verified_at TIMESTAMP NULL,                   -- when email was verified
    email_verification_token_hash TEXT NULL,            -- hashed verification token
    email_verification_expires_at TIMESTAMP NULL,       -- verification token expiration
    timezone VARCHAR(100) NOT NULL DEFAULT 'UTC', -- user timezone
    created_at TIMESTAMP DEFAULT NOW(),           -- record created timestamp

    CONSTRAINT chk_users_timezone
    CHECK (
        timezone IN (
            'America/Los_Angeles',
            'America/Denver',
            'America/Chicago',
            'America/New_York',
            'America/Phoenix',
            'America/Anchorage',
            'Pacific/Honolulu',
            'UTC',
            'Europe/London',
            'Europe/Paris',
            'Asia/Tokyo',
            'Australia/Sydney'
        )
    )
);

-- Sessions 
create table if not exists auth_sessions (
    id         text primary key,                                        -- opaque sid (e.g., nanoid)
    user_id    uuid not null references users(id) on delete cascade,    -- match users.id
    data       jsonb not null default '{}',                             -- tiny bag: roles, company_id
    created_at timestamptz not null default now(),
    expires_at timestamptz not null
);

create table if not exists weight (
	id					bigserial primary key,
    user_id 			uuid not null references users(id) on delete cascade,
    measured_at 		date not null,             
    weight 				numeric(6,2) not null,          
    unit 				text check (unit in ('lb','kg')) default 'lb',
    constraint 			uq_weight_user_date unique (user_id, measured_at)
);

create table if not exists food (
	id                		bigserial primary key,
	name              		text not null,            -- apple
	brand             		text,                     -- generic or 'orchard ..'
	barcode           		text unique,              -- optional (UPC/EAN)
	serving_size      		numeric(7,2) not null default 0,
	serving_unit      		text,
	serving_type      		text not null,
	count_name           	text,
	serving_metric_size  	numeric(7,2),
	serving_metric_unit  	text check (serving_metric_unit in ('g','ml')),
	protein              	numeric(7,2) not null default 0,
	carbs             		numeric(7,2) not null default 0,
	fat               		numeric(7,2) not null default 0,
	calories          		numeric(7,2) not null default 0,  -- label calories, not computed
	created_at        		timestamptz not null default now(),
	updated_at        		timestamptz not null default now(),
	is_verified		  		boolean not null default false,
	constraint chk_food_macros_nonneg
		check (
			protein >= 0 and carbs >= 0 and fat >= 0 and calories >= 0
		)
);

create table if not exists food_tracker (
	id                	bigserial primary key,
	meal 				int not null,
	user_id             uuid not null references users(id) on delete cascade,
	food_id             bigint references food(id),
	recorded_at         date not null,
	carbs               numeric(6,2) not null,
	fat                 numeric(6,2) not null,
	protein             numeric(6,2) not null,
	calories            numeric(6,2) not null,
	serving_size        numeric(6,2) not null,
	serving_unit        text,
	food_name           text,
	is_ai               boolean not null default false
);

create table if not exists macro_goals (
	id                	bigserial primary key,
    user_id 			uuid not null references users(id) on delete cascade,
    date_from 			date not null,   
    date_to 			date,     
    carbs 				numeric(6,2) not null, 
    fat 				numeric(6,2) not null,    
    protein 			numeric(6,2) not null,
    calories 			numeric(6,2) not null
);

CREATE OR REPLACE VIEW food_log_v AS
	SELECT
		ft.id,
		ft.user_id,
		ft.meal,
		CASE ft.meal
			WHEN 0 THEN 'breakfast'
			WHEN 1 THEN 'lunch'
			WHEN 2 THEN 'dinner'
			WHEN 3 THEN 'snack'
			ELSE 'unknown'
		END                      AS meal_name,
		ft.recorded_at,
		-- logged amounts (what the user actually tracked)
		ft.serving_size          AS serving_size,
		ft.serving_unit          AS serving_unit,
		ft.protein               AS protein,
		ft.carbs                 AS carbs,
		ft.fat                   AS fat,
		ft.calories              AS calories,

		-- food catalog details
		f.id                                    AS food_id,
		COALESCE(f.name, ft.food_name)          AS food_name,
		f.brand,
		f.barcode,
		f.serving_size                          AS food_serving_size,
		f.serving_unit                          AS food_serving_unit,
		f.protein                               AS food_protein_per_serving,
		f.carbs                                 AS food_carbs_per_serving,
		f.fat                                   AS food_fat_per_serving,
		f.calories                              AS food_calories_per_serving,

		-- how many label servings the logged serving represents
		CASE
			WHEN f.serving_size > 0 THEN ft.serving_size / f.serving_size
			ELSE NULL
		END                                     AS servings_equivalent,
		f.is_verified,
		ft.is_ai
	FROM food_tracker ft
	LEFT JOIN food f ON f.id = ft.food_id;

create table if not exists recipes (
	id           bigserial primary key,
	user_id      uuid not null references users(id) on delete cascade,
	name         text not null,
	yield_size   numeric(7,2) not null,
	yield_unit   text not null,
	created_at   timestamptz not null default now()
);

create table if not exists recipe_items (
	id           bigserial primary key,
	recipe_id    bigint not null references recipes(id) on delete cascade,
	food_id      bigint not null references food(id),
	serving_size numeric(7,2) not null default 1,
	serving_unit text,
	protein      numeric(7,2) not null default 0,
	carbs        numeric(7,2) not null default 0,
	fat          numeric(7,2) not null default 0,
	calories     numeric(7,2) not null default 0
);

create table if not exists meals (
	id        bigserial primary key,
	user_id   uuid not null references users(id) on delete cascade,
	name      text not null,
	created_at timestamptz not null default now()
);

create table if not exists meal_items (
	id           bigserial primary key,
	meal_id      bigint not null references meals(id) on delete cascade,
	food_id      bigint not null references food(id),
	serving_size numeric(7,2) not null default 1,
	serving_unit text,
	protein      numeric(7,2) not null default 0,
	carbs        numeric(7,2) not null default 0,
	fat          numeric(7,2) not null default 0,
	calories     numeric(7,2) not null default 0
);

create table ai_daily_usage (
	user_id     		uuid not null,
	usage_date  		date not null,
	used_count  		int not null default 0,
	pending_count 		int not null default 0,
	updated_at  		timestamptz not null default now(),
	primary key (user_id, usage_date),
	check (used_count >= 0)
);

CREATE TABLE password_reset_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash text NOT NULL,
    expires_at timestamptz NOT NULL,
    used_at timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE api_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    key_hash text NOT NULL UNIQUE,
    key_prefix text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Exercises (global catalog + user custom)
create table if not exists exercises (
	id					bigserial primary key,
	user_id				uuid references users(id) on delete cascade,	-- null = global catalog entry
	name				text not null,
	muscle_group		text not null,
	equipment			text not null,
	tracking_type		text not null,
	is_verified			boolean not null default false,
	created_at			timestamptz not null default now(),
	updated_at			timestamptz not null default now(),
	constraint chk_exercises_muscle_group
		check (muscle_group in ('chest','back','shoulders','biceps','triceps','forearms','quads','hamstrings','glutes','calves','core','full_body','cardio')),
	constraint chk_exercises_equipment
		check (equipment in ('barbell','dumbbell','machine','cable','bodyweight','kettlebell','band','other')),
	constraint chk_exercises_tracking_type
		check (tracking_type in ('WEIGHT_REPS','REPS','TIME','DISTANCE_TIME'))
);

create unique index if not exists uq_exercises_global_name on exercises (lower(name)) where user_id is null;
create unique index if not exists uq_exercises_user_name on exercises (user_id, lower(name)) where user_id is not null;

insert into exercises (name, muscle_group, equipment, tracking_type, is_verified) values
	('Barbell Bench Press',			'chest',		'barbell',		'WEIGHT_REPS',		true),
	('Incline Barbell Bench Press',	'chest',		'barbell',		'WEIGHT_REPS',		true),
	('Dumbbell Bench Press',		'chest',		'dumbbell',		'WEIGHT_REPS',		true),
	('Incline Dumbbell Press',		'chest',		'dumbbell',		'WEIGHT_REPS',		true),
	('Cable Fly',					'chest',		'cable',		'WEIGHT_REPS',		true),
	('Push-Up',						'chest',		'bodyweight',	'REPS',				true),
	('Dip',							'triceps',		'bodyweight',	'REPS',				true),
	('Deadlift',					'back',			'barbell',		'WEIGHT_REPS',		true),
	('Barbell Row',					'back',			'barbell',		'WEIGHT_REPS',		true),
	('Dumbbell Row',				'back',			'dumbbell',		'WEIGHT_REPS',		true),
	('Pull-Up',						'back',			'bodyweight',	'REPS',				true),
	('Chin-Up',						'back',			'bodyweight',	'REPS',				true),
	('Lat Pulldown',				'back',			'cable',		'WEIGHT_REPS',		true),
	('Seated Cable Row',			'back',			'cable',		'WEIGHT_REPS',		true),
	('Overhead Press',				'shoulders',	'barbell',		'WEIGHT_REPS',		true),
	('Dumbbell Shoulder Press',		'shoulders',	'dumbbell',		'WEIGHT_REPS',		true),
	('Lateral Raise',				'shoulders',	'dumbbell',		'WEIGHT_REPS',		true),
	('Face Pull',					'shoulders',	'cable',		'WEIGHT_REPS',		true),
	('Rear Delt Fly',				'shoulders',	'dumbbell',		'WEIGHT_REPS',		true),
	('Barbell Curl',				'biceps',		'barbell',		'WEIGHT_REPS',		true),
	('Dumbbell Curl',				'biceps',		'dumbbell',		'WEIGHT_REPS',		true),
	('Hammer Curl',					'biceps',		'dumbbell',		'WEIGHT_REPS',		true),
	('Cable Curl',					'biceps',		'cable',		'WEIGHT_REPS',		true),
	('Triceps Pushdown',			'triceps',		'cable',		'WEIGHT_REPS',		true),
	('Overhead Triceps Extension',	'triceps',		'dumbbell',		'WEIGHT_REPS',		true),
	('Skull Crusher',				'triceps',		'barbell',		'WEIGHT_REPS',		true),
	('Close-Grip Bench Press',		'triceps',		'barbell',		'WEIGHT_REPS',		true),
	('Back Squat',					'quads',		'barbell',		'WEIGHT_REPS',		true),
	('Front Squat',					'quads',		'barbell',		'WEIGHT_REPS',		true),
	('Leg Press',					'quads',		'machine',		'WEIGHT_REPS',		true),
	('Leg Extension',				'quads',		'machine',		'WEIGHT_REPS',		true),
	('Bulgarian Split Squat',		'quads',		'dumbbell',		'WEIGHT_REPS',		true),
	('Walking Lunge',				'quads',		'dumbbell',		'WEIGHT_REPS',		true),
	('Goblet Squat',				'quads',		'dumbbell',		'WEIGHT_REPS',		true),
	('Romanian Deadlift',			'hamstrings',	'barbell',		'WEIGHT_REPS',		true),
	('Lying Leg Curl',				'hamstrings',	'machine',		'WEIGHT_REPS',		true),
	('Hip Thrust',					'glutes',		'barbell',		'WEIGHT_REPS',		true),
	('Standing Calf Raise',			'calves',		'machine',		'WEIGHT_REPS',		true),
	('Seated Calf Raise',			'calves',		'machine',		'WEIGHT_REPS',		true),
	('Plank',						'core',			'bodyweight',	'TIME',				true),
	('Hanging Leg Raise',			'core',			'bodyweight',	'REPS',				true),
	('Cable Crunch',				'core',			'cable',		'WEIGHT_REPS',		true),
	('Ab Wheel Rollout',			'core',			'other',		'REPS',				true),
	('Kettlebell Swing',			'full_body',	'kettlebell',	'WEIGHT_REPS',		true),
	('Farmer''s Carry',				'forearms',		'dumbbell',		'TIME',				true),
	('Running',						'cardio',		'other',		'DISTANCE_TIME',	true),
	('Cycling',						'cardio',		'machine',		'DISTANCE_TIME',	true),
	('Rowing Machine',				'cardio',		'machine',		'DISTANCE_TIME',	true),
	('Walking',						'cardio',		'other',		'DISTANCE_TIME',	true),
	('Jump Rope',					'cardio',		'other',		'TIME',				true)
on conflict (lower(name)) where user_id is null do nothing;


-- Workouts: templates (plans) and sessions (what was actually lifted)
create table if not exists workout_templates (
	id					bigserial primary key,
	user_id				uuid not null references users(id) on delete cascade,
	name				text not null,
	notes				text,
	created_at			timestamptz not null default now(),
	updated_at			timestamptz not null default now()
);

create table if not exists workout_template_exercises (
	id						bigserial primary key,
	template_id				bigint not null references workout_templates(id) on delete cascade,
	exercise_id				bigint not null references exercises(id) on delete cascade,
	position				int not null,
	target_sets				int not null default 3,
	target_reps				int,
	target_weight			numeric(7,2),			-- lb
	target_duration_seconds	int,
	constraint chk_wte_targets_nonneg
		check (target_sets > 0 and coalesce(target_reps, 0) >= 0 and coalesce(target_weight, 0) >= 0 and coalesce(target_duration_seconds, 0) >= 0)
);

create table if not exists workout_sessions (
	id					bigserial primary key,
	user_id				uuid not null references users(id) on delete cascade,
	template_id			bigint references workout_templates(id) on delete set null,
	name				text not null,
	notes				text,
	started_at			timestamptz not null default now(),
	ended_at			timestamptz				-- null = in progress
);

-- a user can only have one workout in progress at a time
create unique index if not exists uq_workout_sessions_active on workout_sessions (user_id) where ended_at is null;

create table if not exists workout_session_exercises (
	id						bigserial primary key,
	session_id				bigint not null references workout_sessions(id) on delete cascade,
	exercise_id				bigint not null references exercises(id),	-- restrict: logged history keeps its exercise
	position				int not null,
	target_sets				int,
	target_reps				int,
	target_weight			numeric(7,2),
	target_duration_seconds	int
);

create table if not exists workout_sets (
	id						bigserial primary key,
	session_exercise_id		bigint not null references workout_session_exercises(id) on delete cascade,
	set_number				int not null,
	weight					numeric(7,2),			-- lb
	reps					int,
	duration_seconds		int,
	distance				numeric(8,2),			-- mi
	is_warmup				boolean not null default false,
	created_at				timestamptz not null default now(),
	constraint chk_workout_sets_nonneg
		check (coalesce(weight, 0) >= 0 and coalesce(reps, 0) >= 0 and coalesce(duration_seconds, 0) >= 0 and coalesce(distance, 0) >= 0)
);


-- Planned workouts on the calendar
create table if not exists workout_schedule (
	id					bigserial primary key,
	user_id				uuid not null references users(id) on delete cascade,
	template_id			bigint not null references workout_templates(id) on delete cascade,
	scheduled_date		date not null,
	session_id			bigint references workout_sessions(id) on delete set null,	-- set once the planned workout is started
	created_at			timestamptz not null default now()
);