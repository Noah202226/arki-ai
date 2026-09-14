"use client";

import { useRef, useCallback } from "react";
import { toast } from "sonner";
import { useReceiptStore, ExtractedReceiptData } from "@/app/store/use-receipt-store";

/**
 * Downscales and compresses image before upload to avoid multi-megabyte payloads.
 * Targets max 1280px dimension and 0.80 JPEG quality (~150KB-250KB).
 * Wrapped with a 10s timeout to avoid hanging indefinitely on mobile image decoding.
 */
function compressImage(
  dataUrl: string,
  maxDimension = 1280,
  quality = 0.8
): Promise<{ dataUrl: string; mimeType: string }> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !dataUrl.startsWith("data:image")) {
      resolve({ dataUrl, mimeType: "image/jpeg" });
      return;
    }

    const timer = setTimeout(() => {
      resolve({ dataUrl, mimeType: "image/jpeg" });
    }, 10000);

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
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ dataUrl, mimeType: "image/jpeg" });
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      try {
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve({ dataUrl: compressedDataUrl, mimeType: "image/jpeg" });
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

export function useReceiptScan() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    isScanning,
    scanProgressText,
    scanError,
    isConfirmOpen,
    isKeyPromptOpen,
    isCameraOpen,
    receiptImage,
    extractedData,
    userApiKey,
    setScanning,
    setScanError,
    openManualEntry,
    openConfirmModal,
    closeConfirmModal,
    openCamera,
    closeCamera,
    openKeyPrompt,
    closeKeyPrompt,
    setUserApiKey,
    reset,
  } = useReceiptStore();

  const scanReceiptBase64 = useCallback(
    async (base64DataUrl: string, mimeType = "image/jpeg") => {
      setScanning(true, "Optimizing & reading receipt with OCR...");

      // Save preview immediately so if recognition fails, user can still inspect and manually enter
      useReceiptStore.setState({ receiptImage: base64DataUrl });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

      try {
        const { dataUrl: optimizedBase64, mimeType: optimizedMime } = await compressImage(
          base64DataUrl
        );

        useReceiptStore.setState({ receiptImage: optimizedBase64 });

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        const activeKey =
          userApiKey ||
          (typeof window !== "undefined"
            ? localStorage.getItem("arki_gemini_api_key") || ""
            : "");
        if (activeKey) {
          headers["x-gemini-key"] = activeKey;
        }

        const res = await fetch("/api/receipt/scan", {
          method: "POST",
          headers,
          signal: controller.signal,
          body: JSON.stringify({
            imageBase64: optimizedBase64,
            mimeType: optimizedMime,
          }),
        });

        clearTimeout(timeoutId);

        let json: any = null;
        try {
          json = await res.json();
        } catch {
          const rawText = await res.text().catch(() => "");
          throw new Error(
            res.status === 413
              ? "Image file was too large for server. Please try a smaller photo."
              : `Server returned error (${res.status}): ${rawText.slice(0, 100) || "Invalid response"}`
          );
        }

        if (!res.ok || !json?.ok) {
          throw new Error(json?.message || "Failed to parse receipt from image.");
        }

        if (json.fallbackFrom) {
          toast.info("Switched to OCR scanner (Gemini rate limit or quota reached).", { duration: 4000 });
        } else if (json.data?.engine === "tesseract") {
          toast.success("Receipt scanned via OCR! Please review the details.");
        } else {
          toast.success("Receipt scanned with AI! Please review the details.");
        }

        openConfirmModal(json.data as ExtractedReceiptData, optimizedBase64);
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        console.warn("Scan error:", err);

        let msg = "Failed to scan receipt. Please try again.";
        if (err instanceof Error) {
          if (err.name === "AbortError") {
            msg = "OCR processing timed out. Server or network is busy. You can enter details manually.";
          } else {
            msg = err.message;
          }
        }

        setScanError(msg);
        toast.error(msg, { duration: 6000 });
      }
    },
    [userApiKey, setScanning, setScanError, openConfirmModal]
  );

  const scanReceiptFile = useCallback(
    async (file: File) => {
      if (!file) return;

      // Mobile Android fallback: file.type can be empty string or application/octet-stream
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
        await scanReceiptBase64(base64DataUrl, file.type || "image/jpeg");
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
        // Sample receipt visual preview SVG
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
    isKeyPromptOpen,
    isCameraOpen,
    receiptImage,
    extractedData,
    userApiKey,
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
    openKeyPrompt,
    closeKeyPrompt,
    setUserApiKey,
    reset,
  };
}
