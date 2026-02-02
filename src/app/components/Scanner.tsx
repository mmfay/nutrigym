import { useState, useEffect, useRef } from "react";
import type React from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";

export function Scanner({
  onClose,
  onDetected,
}: {
  onClose: () => void;
  onDetected: (value: string) => void;
}) {
  const videoRef    = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const streamRef   = useRef<MediaStream | null>(null);

  const stoppedRef  = useRef(false);     // live flag read by RAF loop
  const didStopRef  = useRef(false);     // idempotent teardown
  const [err, setErr] = useState<string | null>(null);

  // Body lock while sheet is open
  useEffect(() => {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const prev = {
      top: document.body.style.top,
      left: document.body.style.left,
      position: document.body.style.position,
      width: document.body.style.width,
      overflowY: document.body.style.overflowY,
    };
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.width = "100%";
    document.body.style.overflowY = "hidden";
    return () => {
      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.left = prev.left;
      document.body.style.width = prev.width;
      document.body.style.overflowY = prev.overflowY;
      window.scrollTo(0, scrollY);
    };
  }, []);

  const DESIRED_FORMATS_NATIVE = [
    "qr_code","data_matrix","pdf417","ean_13","upc_a","upc_e","code_128","itf",
  ] as const;

  const ZXING_HINTS = (() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.DATA_MATRIX,
      BarcodeFormat.PDF_417,
      BarcodeFormat.EAN_13,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.ITF,
    ]);
    return hints;
  })();

  const VIDEO_CONSTRAINTS: MediaStreamConstraints = {
    video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
    audio: false,
  };

  const stopCamera = () => {
    if (didStopRef.current) return;     // idempotent
    didStopRef.current = true;

    // Stop ZXing loop (best-effort)
    try { controlsRef.current?.stop(); } catch {}
    controlsRef.current = null;

    // Stop tracks (torch off first if supported)
    const v = videoRef.current;
    const s: MediaStream | null = streamRef.current || (v?.srcObject as MediaStream | null) || null;

    if (s) {
      for (const track of s.getVideoTracks()) {
        try {
          // @ts-expect-error non-standard but widely supported
          track.applyConstraints?.({ advanced: [{ torch: false }] });
        } catch {}
      }
      for (const t of s.getTracks()) {
        try { t.stop(); } catch {}
      }
    }
    streamRef.current = null;

    // Detach <video> (Safari/iOS friendly)
    if (v) {
      try { v.pause(); } catch {}
      try { (v as any).srcObject = null; } catch {}
      try { v.removeAttribute("src"); } catch {}
      // Some iOS builds need a microtask before load()
      try { queueMicrotask(() => { try { v.load?.(); } catch {} }); } catch {}
    }
  };

  const teardownAndClose = () => {
    stoppedRef.current = true;   // halts RAF loop immediately
    stopCamera();
    onClose();
  };

  useEffect(() => {
    stoppedRef.current = false;
    didStopRef.current = false;

    const secure =
      (typeof window !== "undefined" && window.isSecureContext) ||
      location.protocol === "https:" ||
      location.hostname === "localhost";

    if (!secure) {
      setErr("Camera requires HTTPS (or http://localhost).");
      return;
    }

    (async () => {
      try {
        await ensureMediaDevicesPolyfill();
        const nativeWorked = await tryNativeDetector();
        if (!nativeWorked) await tryZXing();
      } catch (e: any) {
        setErr(e?.message ?? "Unable to access camera.");
      }
    })();

    async function tryNativeDetector(): Promise<boolean> {
      // @ts-ignore
      if (!("BarcodeDetector" in window)) return false;
      // @ts-ignore
      const supported = await window.BarcodeDetector.getSupportedFormats?.();
      if (!supported || supported.length === 0) return false;

      const wanted = DESIRED_FORMATS_NATIVE.filter((f) => supported.includes(f));
      // @ts-ignore
      const detector = new window.BarcodeDetector({ formats: wanted });

      const stream = await navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS);
      streamRef.current = stream;

      // Optional zoom
      try {
        const track = stream.getVideoTracks()[0];
        // @ts-ignore
        await track.applyConstraints({ advanced: [{ zoom: 2.0 }] });
      } catch {}

      const v = videoRef.current!;
      (v as any).srcObject = stream;
      await v.play();

      const scan = async () => {
        if (stoppedRef.current) return;
        try {
          const video = v;
          if (video.videoWidth && video.videoHeight) {
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const bitmap = await createImageBitmap(canvas);
            // @ts-ignore
            const results = await detector.detect(bitmap);
            if (results && results.length > 0) {
              onDetected(results[0].rawValue ?? "");
              teardownAndClose();      // ← stops + closes
              return;
            }
          }
        } catch {}
        requestAnimationFrame(scan);
      };
      requestAnimationFrame(scan);
      return true;
    }

    async function tryZXing(): Promise<boolean> {
      try {
        const reader = new BrowserMultiFormatReader(ZXING_HINTS, 250);
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result) => {
            if (!result || stoppedRef.current) return;
            onDetected(result.getText());
            teardownAndClose();        // ← stops + closes
          }
        );
        controlsRef.current = controls;

        const v = videoRef.current!;
        streamRef.current = (v as any).srcObject as MediaStream | null;

        try {
          const track = streamRef.current?.getVideoTracks()[0];
          // @ts-ignore
          await track?.applyConstraints({ advanced: [{ zoom: 2.0 }] });
        } catch {}

        return true;
      } catch (e: any) {
        setErr(e?.message ?? "Unable to access camera (ZXing).");
        return false;
      }
    }

    async function ensureMediaDevicesPolyfill() {
      // @ts-ignore
      const legacy = (navigator as any).webkitGetUserMedia || (navigator as any).mozGetUserMedia;
      if (!navigator.mediaDevices) (navigator as any).mediaDevices = {};
      if (!navigator.mediaDevices.getUserMedia) {
        if (legacy) {
          navigator.mediaDevices.getUserMedia = (constraints: MediaStreamConstraints) =>
            new Promise((resolve, reject) => {
              legacy.call(navigator, constraints, resolve, reject);
            });
        } else {
          throw new Error("Camera API not supported on this browser/device.");
        }
      }
    }

    // Stop on unmount / dependency change
    return () => {
      stoppedRef.current = true;
      stopCamera();                  // idempotent — ok if Close already did it
    };
  }, [onDetected, onClose]);

  return (
    <div
      className="
        fixed inset-0 z-50 
        flex items-end md:items-center justify-center 
        bg-black/40 
        overflow-y-auto overscroll-contain
      "
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full md:max-w-md p-4">
        <div
          className="
            w-full bg-white dark:bg-gray-800 
            rounded-t-2xl md:rounded-2xl 
            p-4 
            max-h-[85vh] overflow-y-auto
          "
        >
          <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 pb-2">
            <h3 className="font-semibold">Scan Barcode</h3>
            <button
              onClick={teardownAndClose}     // ← stops + closes even if not unmounted
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Close
            </button>
          </div>

          <div className="mt-3 space-y-3">
            <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-black">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
            </div>
            <p className="text-xs text-gray-500">
              {err ?? "Point the camera at a barcode. Try to fill the frame; avoid glare on curved surfaces."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
