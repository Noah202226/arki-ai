"use client";

import { useRef, useCallback } from "react";
import { toast } from "sonner";
import { useReceiptStore } from "@/app/store/use-receipt-store";
import { parseReceiptText, type ExtractedReceiptData } from "@/lib/receipt-parser";

import { preprocessReceiptImage } from "@/lib/imageProcessing";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";

export function useReceiptScan() {
  const { user } = useUser();
  const incrementUsage = useMutation(api.aiUsage.incrementUsage);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    isScanning,
    scanProgressText,
    scanProgressPercent,
    scanStage,
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
      // Step 1: Image Preprocessing (Resize, Grayscale, Contrast, Sharpen)
      setScanning(
        true,
        "Optimizing image: grayscale, contrast & sharpen...",
        10,
        "preprocessing"
      );

      // Save photo preview in store immediately
      useReceiptStore.setState({ receiptImage: base64DataUrl });

      try {
        const { dataUrl: optimizedBase64 } = await preprocessReceiptImage(
          base64DataUrl,
          { maxDimension: 1600, contrastFactor: 1.45 }
        );

        useReceiptStore.setState({ receiptImage: optimizedBase64 });

        setScanning(
          true,
          "Initializing local Tesseract OCR engine...",
          22,
          "initializing"
        );

        setScanning(
          true,
          "Uploading image and analyzing with Gemini AI...",
          50,
          "recognizing"
        );

        const res = await fetch("/api/receipt/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: optimizedBase64 }),
        });

        const json = await res.json();
        if (!res.ok || !json?.ok) {
          throw new Error(json?.message || "Could not read text from receipt image.");
        }
        
        const parsedData = json.data as ExtractedReceiptData;

        // If Gemini returned a note or notes field, we can use it, but raw text isn't returned natively by the structured API (unless we added a field for it).
        // For debugging, we can just dump the items as a string in rawOcrText.
        useReceiptStore.setState({ rawOcrText: JSON.stringify(parsedData, null, 2) });

        setScanning(
          true,
          "Receipt processed successfully!",
          100,
          "parsing"
        );

        toast.success("Receipt scanned via Gemini AI! Please verify details.");
        
        // Increment usage count locally
        if (user) {
          incrementUsage({ userId: user.id }).catch((err) => {
            console.error("Failed to increment AI usage:", err);
          });
        }
        
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
    [setScanning, setScanError, openConfirmModal, user, incrementUsage]
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

      setScanning(true, "Preparing image file for OCR...", 5, "preprocessing");

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
    setScanning(true, "Loading sample receipt demonstration...", 30, "initializing");
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
        setScanning(true, "Extracting sample receipt items...", 95, "parsing");
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
