"use client";

import { useRef, useCallback } from "react";
import { toast } from "sonner";
import { useReceiptStore, ExtractedReceiptData } from "@/app/store/use-receipt-store";
import { parseReceiptText } from "@/lib/receipt-parser";

/**
 * Downscales and applies contrast enhancement for ultra-fast, sharp Tesseract OCR.
 * Targets max 1000px dimension and grayscale contrast boost (~80KB-160KB).
 */
function compressAndPreprocessImage(
  dataUrl: string,
  maxDimension = 1000,
  quality = 0.82
): Promise<{ dataUrl: string; mimeType: string }> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !dataUrl.startsWith("data:image")) {
      resolve({ dataUrl, mimeType: "image/jpeg" });
      return;
    }

    const timer = setTimeout(() => {
      resolve({ dataUrl, mimeType: "image/jpeg" });
    }, 8000);

    const img = new Image();
    img.onload = () => {
      clearTimeout(timer);
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        resolve({ dataUrl, mimeType: "image/jpeg" });
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Contrast enhancement: darkens printed text and brightens background
      try {
        const imgData = ctx.getImageData(0, 0, width, height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          const contrast = (gray - 128) * 1.3 + 128;
          const clamped = Math.min(255, Math.max(0, contrast));
          d[i] = clamped;
          d[i + 1] = clamped;
          d[i + 2] = clamped;
        }
        ctx.putImageData(imgData, 0, 0);
      } catch {}

      try {
        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve({ dataUrl: compressed, mimeType: "image/jpeg" });
      } catch {
        resolve({ dataUrl, mimeType: "image/jpeg" });
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      resolve({ dataUrl, mimeType: "image/jpeg" });
    };

    img.src = dataUrl;
  });
}

/**
 * Runs client-side Tesseract.js in a Web Worker with live progress callbacks.
 */
async function runClientTesseract(
  imageDataUrl: string,
  onProgress: (statusText: string) => void
): Promise<ExtractedReceiptData> {
  const { createWorker } = await import("tesseract.js");

  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      if (m.status === "recognizing text") {
        const pct = Math.round((m.progress || 0) * 100);
        onProgress(`Reading receipt text: ${pct}%`);
      } else if (m.status === "loading language traineddata") {
        const pct = Math.round((m.progress || 0) * 100);
        onProgress(`Loading language model: ${pct}%`);
      } else if (m.status === "loading tesseract core") {
        onProgress("Initializing OCR engine...");
      }
    },
  });

  try {
    const ret = await worker.recognize(imageDataUrl);
    const rawText = ret?.data?.text || "";
    await worker.terminate();
    return parseReceiptText(rawText);
  } catch (err) {
    try {
      await worker.terminate();
    } catch {}
    throw err;
  }
}

export function useReceiptScan() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    isScanning,
    scanProgressText,
    scanError,
    isConfirmOpen,
    isCameraOpen,
    receiptImage,
    extractedData,
    setScanning,
    setScanError,
    openManualEntry,
    openConfirmModal,
    closeConfirmModal,
    openCamera,
    closeCamera,
    reset,
  } = useReceiptStore();

  const scanReceiptBase64 = useCallback(
    async (base64DataUrl: string) => {
      setScanning(true, "Optimizing & reading receipt with OCR...");

      // Save photo preview in store immediately
      useReceiptStore.setState({ receiptImage: base64DataUrl });

      try {
        const { dataUrl: optimizedBase64 } = await compressAndPreprocessImage(
          base64DataUrl
        );

        useReceiptStore.setState({ receiptImage: optimizedBase64 });

        let parsedData: ExtractedReceiptData | null = null;

        // 1. Primary: Run client-side Tesseract OCR in Web Worker
        try {
          parsedData = await runClientTesseract(optimizedBase64, (text) => {
            setScanning(true, text);
          });
        } catch (clientErr) {
          console.warn("Client Tesseract error, falling back to server OCR:", clientErr);
        }

        // 2. Fallback: If client worker encounters issue, call server route
        if (!parsedData) {
          setScanning(true, "Processing OCR on server...");
          const res = await fetch("/api/receipt/scan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: optimizedBase64 }),
          });

          const json = await res.json();
          if (!res.ok || !json?.ok) {
            throw new Error(json?.message || "Could not read text from receipt image.");
          }
          parsedData = json.data as ExtractedReceiptData;
        }

        toast.success("Receipt scanned via Tesseract OCR! Please verify details.");
        openConfirmModal(parsedData, optimizedBase64);
      } catch (err: unknown) {
        console.warn("Scan error:", err);
        const msg =
          err instanceof Error
            ? err.message
            : "Could not read text from receipt. Please enter details manually.";

        setScanError(msg);
        toast.error(msg, { duration: 5000 });
      }
    },
    [setScanning, setScanError, openConfirmModal]
  );

  const scanReceiptFile = useCallback(
    async (file: File) => {
      if (!file) return;

      // Mobile Android fallback: file.type can be empty or application/octet-stream
      const isImageMime = file.type && file.type.startsWith("image/");
      const isImageExt = /\.(jpe?g|png|webp|heic|heif|bmp|jfif|tiff?)$/i.test(file.name || "");
      const isLikelyImage = isImageMime || isImageExt || !file.type;

      if (!isLikelyImage) {
        toast.error("Please provide an image file (PNG, JPG, HEIC, WebP).");
        return;
      }

      setScanning(true, "Preparing & optimizing receipt image...");

      try {
        const base64Promise = new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(file);
        });

        const base64DataUrl = await base64Promise;
        await scanReceiptBase64(base64DataUrl);
      } catch (err: unknown) {
        console.error("File read error:", err);
        const msg = "Failed to read image file from device storage.";
        setScanError(msg);
        toast.error(msg);
      }
    },
    [setScanning, setScanError, scanReceiptBase64]
  );

  const scanDemoReceipt = useCallback(async () => {
    setScanning(true, "Loading sample receipt demonstration...");
    try {
      const res = await fetch("/api/receipt/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-mock-demo": "true",
        },
        body: JSON.stringify({ isMock: true }),
      });

      const json = await res.json();
      if (json.ok) {
        const demoSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"><rect width="100%" height="100%" fill="%23fdfcf9"/><text x="50%" y="50" font-family="monospace" font-size="20" font-weight="bold" text-anchor="middle" fill="%23111">JOLLIBEE</text><text x="50%" y="75" font-family="monospace" font-size="12" text-anchor="middle" fill="%23555">Grand Central Branch</text><line x1="30" y1="95" x2="370" y2="95" stroke="%23ccc" stroke-dasharray="4"/><text x="35" y="130" font-family="monospace" font-size="13" fill="%23333">1x 2-pc Chickenjoy</text><text x="365" y="130" font-family="monospace" font-size="13" text-anchor="end" fill="%23333">₱220.00</text><text x="35" y="160" font-family="monospace" font-size="13" fill="%23333">1x Peach Mango Pie</text><text x="365" y="160" font-family="monospace" font-size="13" text-anchor="end" fill="%23333">₱110.00</text><text x="35" y="190" font-family="monospace" font-size="13" fill="%23333">1x Extra Gravy</text><text x="365" y="190" font-family="monospace" font-size="13" text-anchor="end" fill="%23333">₱55.00</text><line x1="30" y1="220" x2="370" y2="220" stroke="%23222" stroke-width="2"/><text x="35" y="260" font-family="monospace" font-size="16" font-weight="bold" fill="%23111">TOTAL AMOUNT</text><text x="365" y="260" font-family="monospace" font-size="18" font-weight="bold" text-anchor="end" fill="%23ff6b35">₱385.00</text><text x="50%" y="320" font-family="monospace" font-size="11" text-anchor="middle" fill="%23888">OR# 948271 • THANK YOU!</text></svg>`;

        openConfirmModal(json.data as ExtractedReceiptData, demoSvg);
        toast.success("Loaded sample receipt! Verify and tweak below.");
      }
    } catch {
      const msg = "Failed to load demo receipt.";
      setScanError(msg);
      toast.error(msg);
    }
  }, [setScanning, setScanError, openConfirmModal]);

  const triggerCamera = useCallback(() => {
    openCamera();
  }, [openCamera]);

  const triggerFileSelect = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        scanReceiptFile(files[0]);
      }
    },
    [scanReceiptFile]
  );

  return {
    fileInputRef,
    isScanning,
    scanProgressText,
    scanError,
    isConfirmOpen,
    isCameraOpen,
    receiptImage,
    extractedData,
    triggerCamera,
    triggerFileSelect,
    handleFileInputChange,
    scanReceiptFile,
    scanReceiptBase64,
    scanDemoReceipt,
    openManualEntry,
    closeConfirmModal,
    openCamera,
    closeCamera,
    reset,
  };
}
