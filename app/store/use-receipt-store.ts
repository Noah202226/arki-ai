import { create } from "zustand";
import type { ExtractedReceiptData } from "@/lib/receipt-parser";

export type { ExtractedReceiptData };

interface ReceiptStore {
  isScanning: boolean;
  isConfirmOpen: boolean;
  isCameraOpen: boolean;
  scanProgressText: string;
  scanError: string | null;
  receiptImage: string | null;
  extractedData: ExtractedReceiptData | null;

  setScanning: (isScanning: boolean, progressText?: string) => void;
  setScanError: (error: string | null) => void;
  openManualEntry: (capturedImage?: string | null) => void;
  openConfirmModal: (data: ExtractedReceiptData, image: string | null) => void;
  closeConfirmModal: () => void;
  openCamera: () => void;
  closeCamera: () => void;
  reset: () => void;
}

export const useReceiptStore = create<ReceiptStore>((set) => ({
  isScanning: false,
  isConfirmOpen: false,
  isCameraOpen: false,
  scanProgressText: "Reading receipt with OCR...",
  scanError: null,
  receiptImage: null,
  extractedData: null,

  setScanning: (isScanning, progressText = "Reading receipt with OCR...") =>
    set({ isScanning, scanProgressText: progressText, ...(isScanning ? { scanError: null } : {}) }),

  setScanError: (error) => set({ scanError: error, isScanning: false }),

  openManualEntry: (capturedImage = null) =>
    set((state) => ({
      isConfirmOpen: true,
      isScanning: false,
      isCameraOpen: false,
      scanError: null,
      receiptImage: capturedImage || state.receiptImage,
      extractedData: {
        merchant: "",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        categoryHint: "General",
        type: "expense",
        items: [],
        notes: "Manually entered after photo review",
        confidence: "medium",
        engine: "tesseract",
      },
    })),

  openConfirmModal: (data, image) =>
    set({
      isConfirmOpen: true,
      extractedData: data,
      receiptImage: image,
      isScanning: false,
      isCameraOpen: false,
      scanError: null,
    }),

  closeConfirmModal: () =>
    set({
      isConfirmOpen: false,
      extractedData: null,
      receiptImage: null,
      isScanning: false,
    }),

  openCamera: () => set({ isCameraOpen: true }),
  closeCamera: () => set({ isCameraOpen: false }),

  reset: () =>
    set({
      isScanning: false,
      isConfirmOpen: false,
      scanError: null,
      receiptImage: null,
      extractedData: null,
    }),
}));
