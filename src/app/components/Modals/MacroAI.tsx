"use client";

import { useEffect, useRef, useState } from "react";
import { getMacroData } from "@/lib/api/food/food";
import { FoodMacros } from "@/lib/dataTypes";

type MacroAIProps = {
	isOpen: boolean;
	onClose: () => void;

	onConfirm?: (payload: {
		description: string;
		macros: FoodMacros;
		image?: Blob | null;
	}) => Promise<void> | void;
};

type Step = "capture" | "review";

/**
 * Converting what is displayed on canvas (image) to a blob, so we can upload it.
 */
function canvasToBlob(
	canvas: HTMLCanvasElement,
	type = "image/jpeg",
	quality = 0.9
): Promise<Blob> {

	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(b) => {
				if (!b) reject(new Error("Failed to capture image (blob was null)."));
				else resolve(b);
			},
			type,
			quality
		);
	});

}

export default function MacroAI({ isOpen, onClose, onConfirm }: MacroAIProps) {
	
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const streamRef = useRef<MediaStream | null>(null);

	const [error, setError] = useState<string | null>(null);
	const [starting, setStarting] = useState(false);

	const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
	const [photoUrl, setPhotoUrl] = useState<string | null>(null);

	const [submitting, setSubmitting] = useState(false);
	const [macros, setMacros] = useState<FoodMacros | null>(null);

	const [step, setStep] = useState<Step>("capture");
	const [description, setDescription] = useState("");

	useEffect(() => {
		if (!isOpen) return;

		// reset state on open
		setError(null);
		setStarting(false);
		setSubmitting(false);
		setMacros(null);
		setDescription("");
		setStep("capture");

		if (photoUrl) URL.revokeObjectURL(photoUrl);
		setPhotoUrl(null);
		setPhotoBlob(null);

		const t = setTimeout(() => startCamera(), 0);

		return () => {
		clearTimeout(t);
		stopCamera();
		};
		
	}, [isOpen]);

	// stop camera
	async function stopCamera() {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((t) => t.stop());
			streamRef.current = null;
		}
		if (videoRef.current) {
			videoRef.current.srcObject = null;
		}
	}

	// start camera
	async function startCamera() {

		setStarting(true);
		setError(null);

		try {
			await stopCamera();

			const stream = await navigator.mediaDevices.getUserMedia({
				video: true,
				audio: false,
			});

			streamRef.current = stream;

			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				await videoRef.current.play();
			}
		} catch (e: any) {
			setError(`${e?.name ?? "Error"}: ${e?.message ?? "Camera unavailable."}`);
		} finally {
			setStarting(false);
		}

	}

	// capture photo
	async function capturePhoto() {

		const video = videoRef.current;
		if (!video) return;

		const w = video.videoWidth;
		const h = video.videoHeight;

		if (!w || !h) {
			setError("Camera not ready yet—try again in a second.");
			return;
		}

		setError(null);

		const canvas = document.createElement("canvas");
		canvas.width = w;
		canvas.height = h;

		const ctx = canvas.getContext("2d");
		if (!ctx) {
			setError("Canvas not available.");
			return;
		}

		ctx.drawImage(video, 0, 0, w, h);

		try {
			const blob = await canvasToBlob(canvas, "image/jpeg", 0.9);

			setPhotoBlob(blob);

			if (photoUrl) URL.revokeObjectURL(photoUrl);
			setPhotoUrl(URL.createObjectURL(blob));

			await stopCamera();
		} catch (e: any) {
			setError(e?.message ?? "Failed to capture image.");
		}
	}

	// handle photo submit
	async function handleSubmit() {
		if (!photoBlob) {
			setError("Tap Capture first.");
			return;
		}

		setError(null);
		setSubmitting(true);
		setMacros(null);

		try {
			const res = await getMacroData(photoBlob);

			if (!res.ok) {
				setError(res.error ?? "Failed to get macros.");
				return;
			}
			if (!res.data) {
				setError("No Data returned from request, try again.");
			}
			setMacros(res.data);
			setStep("review");
		} catch (e: any) {
			setError(e?.message ?? "Upload failed.");
		} finally {
			setSubmitting(false);
		}
	}

	// handle photo retake
	async function handleRetake() {
		setError(null);
		setMacros(null);
		setDescription("");
		setStep("capture");

		// clear captured image
		if (photoUrl) URL.revokeObjectURL(photoUrl);
		setPhotoUrl(null);
		setPhotoBlob(null);

		// restart camera
		await startCamera();
	}

	// used to handle tracking of food.
	async function handleConfirm() {
		if (!macros) {
			setError("No macros to confirm.");
			return;
		}

		setSubmitting(true);
		setError(null);

		try {
			await onConfirm?.({
				description: description.trim(),
				macros,
				image: photoBlob,
			});

			await handleCancel();
		} catch (e: any) {
			setError(e?.message ?? "Failed to save item.");
		} finally {
			setSubmitting(false);
		}
	}

	// handle cancel
	async function handleCancel() {
		await stopCamera();
		if (photoUrl) URL.revokeObjectURL(photoUrl);

		setPhotoUrl(null);
		setPhotoBlob(null);
		setMacros(null);
		setError(null);
		setDescription("");
		setStep("capture");

		await onClose();
	}

	if (!isOpen) return null;

	const hasCaptured = !!photoUrl;

	return (
		<div className="fixed inset-0 z-50 bg-black/50 p-4 overflow-y-auto">
			<div className="min-h-full flex items-center justify-center">
			<div className="w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-gray-900">
			<div className="text-sm font-semibold">Scan food</div>
			<button
				type="button"
				onClick={handleCancel}
				className="rounded-lg px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10"
			>
				Close
			</button>
			</div>

			<div className="p-4">
			{error && (
				<div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
				{error}
				</div>
			)}

			{/* Show VIDEO only when we have NOT captured */}
			{!hasCaptured && (
				<div className="overflow-hidden rounded-xl border border-gray-200 bg-black dark:border-gray-800">
				<video
					ref={videoRef}
					autoPlay
					playsInline
					muted
					className="h-72 w-full object-cover"
				/>
				</div>
			)}

			{/* Show IMAGE only after capture */}
			{hasCaptured && (
				<div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
				<img
					src={photoUrl!}
					alt="Captured"
					className="h-72 w-full object-cover"
				/>
				</div>
			)}

			{/* REVIEW FORM */}
			{step === "review" && macros && (
				<>
				<div className="mt-3 rounded-xl border border-gray-200 p-3 text-sm dark:border-gray-800">
					<div className="mb-2 font-semibold">Estimated macros</div>
					<div className="grid grid-cols-2 gap-2">
					<div>{macros.foodName}</div>
					<div>Calories: {macros.calories}</div>
					<div>Protein: {macros.protein}g</div>
					<div>Carbs: {macros.carbs}g</div>
					<div>Fat: {macros.fat}g</div>
					</div>
				</div>
				</>
			)}

			<div className="mt-4 flex flex-wrap gap-2">
				{step === "capture" && (
				<>
					<button
					type="button"
					disabled={starting || submitting || hasCaptured}
					onClick={capturePhoto}
					className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black"
					>
					{starting ? "Starting…" : "Capture"}
					</button>

					{hasCaptured && (
					<button
						type="button"
						onClick={handleRetake}
						disabled={submitting}
						className="rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-black/5 disabled:opacity-60 dark:border-gray-800 dark:hover:bg-white/10"
					>
						Retake
					</button>
					)}

					<button
					type="button"
					onClick={handleCancel}
					disabled={submitting}
					className="ml-auto rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-black/5 disabled:opacity-60 dark:border-gray-800 dark:hover:bg-white/10"
					>
					Cancel
					</button>

					<button
					type="button"
					onClick={handleSubmit}
					disabled={submitting || !photoBlob}
					className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
					>
					{submitting ? "Submitting…" : "Submit"}
					</button>
				</>
				)}

				{step === "review" && (
				<>
					<button
					type="button"
					onClick={handleRetake}
					disabled={submitting}
					className="rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-black/5 disabled:opacity-60 dark:border-gray-800 dark:hover:bg-white/10"
					>
					Retake
					</button>

					<button
					type="button"
					onClick={handleCancel}
					disabled={submitting}
					className="ml-auto rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-black/5 disabled:opacity-60 dark:border-gray-800 dark:hover:bg-white/10"
					>
					Cancel
					</button>

					<button
					type="button"
					onClick={handleConfirm}
					disabled={submitting || !macros}
					className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
					>
					{submitting ? "Saving…" : "Add to log"}
					</button>
				</>
				)}
			</div>
			</div>
		</div>
		</div>
	);
}