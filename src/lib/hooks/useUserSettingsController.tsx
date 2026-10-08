"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiKeyMetadata, User } from "../dataTypes/auth";
import { getUserRecord as getUser, removeAvatar, updateUserRecord, uploadAvatar } from "../api/usersettings/usersettings";
import { toSquareJpeg } from "../utils/image";
import { useAuth } from "@/app/providers/AuthProvider";
import { getApiKeyMetadata as getApiKeyMetadataRequest, generateApiKey, revokeApiKey } from "../api/apikeys/apikeys";


export type UserSettingsController = {

	loading: boolean;
	userLoading: boolean;
	error: string | null;

	// gets
	getUserRecord: () => Promise<void>;

	// updates
	onAccountUpdate: (name: string, email: string, timezone: string) => Promise<void>;

	userRecord: User | undefined;

	// api keys
	apiKeyLoading: boolean;
	apiKeyMetadata: ApiKeyMetadata | undefined;
	generatedKey: string | null;
	getApiKeyMetadata: () => Promise<void>;
	onGenerateApiKey: () => Promise<void>;
	onRevokeApiKey: () => Promise<void>;

	// profile photo
	avatarSaving: boolean;
	avatarError: string | null;
	onAvatarUpload: (file: File) => Promise<void>;
	onAvatarRemove: () => Promise<void>;

};

export function useUserSettingsController(): UserSettingsController {

	const [loading, setLoading] = useState(false);
	const [userLoading, setUserLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [userRecord, setUserRecord] = useState<User>();

	const [apiKeyLoading, setApiKeyLoading] = useState(false);
	const [apiKeyMetadata, setApiKeyMetadata] = useState<ApiKeyMetadata>();
	const [generatedKey, setGeneratedKey] = useState<string | null>(null);

	const [avatarSaving, setAvatarSaving] = useState(false);
	const [avatarError, setAvatarError] = useState<string | null>(null);

	// the navbar reads the photo version from auth, so updates show everywhere at once
	const { updateUser } = useAuth();

	// Tracks whether the component using this hook is still mounted
	const aliveRef = useRef(true);

	useEffect(() => {

		aliveRef.current = true;

		return () => {
			aliveRef.current = false;
		};

	}, []);

	// get User Record
	const getUserRecord = useCallback ( async (): Promise<void> => {

		setUserLoading(true);
		setError(null);

		const res = await getUser();

		if (!res.ok) {
			setUserLoading(false);
			setError(res.message);
			throw new Error(res.message);
		}
		
		setUserRecord(res.data);

		setUserLoading(false);

	}, [])

	// update email address on record
	const onAccountUpdate = useCallback(async (name: string, email: string, timezone: string): Promise<void> => {
		
		setUserLoading(true);
		setError(null);
		
		if (!userRecord) {
			setUserLoading(false);
			return;
		}
		
		const updatedUser: User = {
			...userRecord,
			email: email,
			name: name,
			timezone: timezone,
		}


		const res = await updateUserRecord(updatedUser);
		
		if (!res.ok) {
			setUserLoading(false);
			setError(res.message);
			throw new Error(res.message);
		}

		setUserRecord(res.data);
		setUserLoading(false);

	}, [userRecord]);

	// get API key metadata (never the raw key)
	const getApiKeyMetadata = useCallback(async (): Promise<void> => {

		setApiKeyLoading(true);
		setError(null);

		const res = await getApiKeyMetadataRequest();

		if (!res.ok) {
			setApiKeyLoading(false);
			setError(res.message);
			throw new Error(res.message);
		}

		setApiKeyMetadata(res.data);

		setApiKeyLoading(false);

	}, []);

	// generate (or regenerate) the user's API key
	const onGenerateApiKey = useCallback(async (): Promise<void> => {

		setApiKeyLoading(true);
		setError(null);

		const res = await generateApiKey();

		if (!res.ok) {
			setApiKeyLoading(false);
			setError(res.message);
			throw new Error(res.message);
		}

		setGeneratedKey(res.data?.key ?? null);
		setApiKeyMetadata({
			has_key: true,
			key_prefix: res.data?.key_prefix ?? null,
			created_at: res.data?.created_at ?? null,
		});

		setApiKeyLoading(false);

	}, []);

	// revoke the user's API key
	const onRevokeApiKey = useCallback(async (): Promise<void> => {

		setApiKeyLoading(true);
		setError(null);

		const res = await revokeApiKey();

		if (!res.ok) {
			setApiKeyLoading(false);
			setError(res.message);
			throw new Error(res.message);
		}

		setGeneratedKey(null);
		setApiKeyMetadata({ has_key: false, key_prefix: null, created_at: null });

		setApiKeyLoading(false);

	}, []);

	// shrinks the photo in the browser (square 256px JPEG) before uploading
	const onAvatarUpload = useCallback(async (file: File) => {

		setAvatarError(null);

		if (!file.type.startsWith("image/")) {
			setAvatarError("Choose an image file.");
			return;
		}

		setAvatarSaving(true);

		try {

			const res = await uploadAvatar(await toSquareJpeg(file));
			if (!aliveRef.current) return;

			if (!res.ok || !res.data) {
				setAvatarError(res.message);
				return;
			}

			updateUser({ avatar_version: res.data.avatar_version });

		} catch {
			if (aliveRef.current) setAvatarError("Couldn't upload that photo. Try a different one.");
		} finally {
			if (aliveRef.current) setAvatarSaving(false);
		}

	}, [updateUser]);

	const onAvatarRemove = useCallback(async () => {

		setAvatarError(null);
		setAvatarSaving(true);

		try {

			const res = await removeAvatar();
			if (!aliveRef.current) return;

			if (!res.ok) {
				setAvatarError(res.message);
				return;
			}

			updateUser({ avatar_version: null });

		} catch {
			if (aliveRef.current) setAvatarError("Couldn't remove the photo.");
		} finally {
			if (aliveRef.current) setAvatarSaving(false);
		}

	}, [updateUser]);

	return {
		loading,
		userLoading,
		error,
		getUserRecord,
		onAccountUpdate,
		userRecord,
		apiKeyLoading,
		apiKeyMetadata,
		generatedKey,
		getApiKeyMetadata,
		onGenerateApiKey,
		onRevokeApiKey,
		avatarSaving,
		avatarError,
		onAvatarUpload,
		onAvatarRemove,
	};
}