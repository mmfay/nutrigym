export type UserDTO = {
	id: string;
	name: string;
	email: string;
	is_sys_admin?: boolean;
};

export type User = {
	id: string;
	name: string;
	email: string;
	timezone: string;
	is_sys_admin: boolean;
}

export type PasswordResetToken = {
	id: string;
	user_id: string;
	token_hash: string;
	expires_at: Date;
	used_at: Date | null;
	created_at: Date;
};

export type ApiKeyMetadata = {
	has_key: boolean;
	key_prefix: string | null;
	created_at: Date | null;
};

export type ApiKeyGenerated = {
	key: string;
	key_prefix: string;
	created_at: Date;
};
export type AdminUser = {
	id: string;
	name: string;
	email: string;
	is_enabled: boolean;
	is_sys_admin: boolean;
	email_verified: boolean;
	created_at: Date | null;
};

export type AdminUserPage = {
	items: AdminUser[];
	nextCursor: string | null;
	hasMore: boolean;
};