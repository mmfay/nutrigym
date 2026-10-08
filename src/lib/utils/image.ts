/**
 * Browser-side image helpers.
 */

function loadImage(file: Blob): Promise<HTMLImageElement> {

	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve(img);
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error("Couldn't read that image"));
		};
		img.src = url;
	});

}

/**
 * Center-crops an image to a square and scales it to `size` px as a JPEG.
 * Photos from an iPhone arrive as JPEG via the file picker, and the browser applies EXIF rotation when drawing.
 */
export async function toSquareJpeg(file: Blob, size = 256, quality = 0.85): Promise<Blob> {

	const img = await loadImage(file);

	const side = Math.min(img.naturalWidth, img.naturalHeight);
	const sx = (img.naturalWidth - side) / 2;
	const sy = (img.naturalHeight - side) / 2;

	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;

	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Couldn't process that image");

	ctx.imageSmoothingQuality = "high";
	ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

	return new Promise((resolve, reject) =>
		canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't process that image"))), "image/jpeg", quality)
	);

}