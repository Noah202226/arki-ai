import { create } from "zustand";
import type { ExtractedReceiptData } from "@/lib/receipt-parser";

export type { ExtractedReceiptData };

export type ScanStage =
  | "preprocessing"
  | "initializing"
  | "recognizing"
  | "parsing"
  | null;

interface ReceiptStore {
  isScanning: boolean;
  isConfirmOpen: boolean;
  isCameraOpen: boolean;
  scanProgressText: string;
  scanProgressPercent: number;
  scanStage: ScanStage;
  scanError: string | null;
  receiptImage: string | null;
  rawOcrText: string | null;
  extractedData: ExtractedReceiptData | null;

  setScanning: (
    isScanning: boolean,
    progressText?: string,
    progressPercent?: number,
    scanStage?: ScanStage
  ) => void;
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
  scanProgressPercent: 0,
  scanStage: null,
  scanError: null,
  receiptImage: null,
  rawOcrText: null,
  extractedData: null,

  setScanning: (
    isScanning,
    progressText = "Reading receipt with OCR...",
    progressPercent = 0,
    scanStage = null
  ) =>
    set({
      isScanning,
      scanProgressText: progressText,
      scanProgressPercent: progressPercent,
      scanStage,
      ...(isScanning ? { scanError: null } : {}),
    }),

  setScanError: (error) => set({ scanError: error, isScanning: false, scanStage: null }),

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
        engine: "gemini",
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
      rawOcrText: null,
      isScanning: false,
    }),

  openCamera: () => set({ isCameraOpen: true }),
  closeCamera: () => set({ isCameraOpen: false }),

  reset: () =>
    set({
      isScanning: false,
      isConfirmOpen: false,
      scanProgressText: "Reading receipt with OCR...",
      scanProgressPercent: 0,
      scanStage: null,
      scanError: null,
      receiptImage: null,
      rawOcrText: null,
      extractedData: null,
    }),
}));
