import { create } from "zustand";

export interface ExtractedReceiptData {
  merchant: string;
  amount: number;
  date: string;
  categoryHint: string;
  type: "expense" | "income";
  tax?: number;
  items: Array<{ name: string; price: number; quantity?: number }>;
  notes: string;
  confidence: "high" | "medium" | "low";
  engine?: "tesseract" | "gemini" | "demo";
}

interface ReceiptStore {
  isScanning: boolean;
  isConfirmOpen: boolean;
  isKeyPromptOpen: boolean;
  isCameraOpen: boolean;
  scanProgressText: string;
  receiptImage: string | null;
  extractedData: ExtractedReceiptData | null;
  userApiKey: string;

  setScanning: (isScanning: boolean, progressText?: string) => void;
  openConfirmModal: (data: ExtractedReceiptData, image: string | null) => void;
  closeConfirmModal: () => void;
  openCamera: () => void;
  closeCamera: () => void;
  openKeyPrompt: () => void;
  closeKeyPrompt: () => void;
  setUserApiKey: (key: string) => void;
  reset: () => void;
}

const STORAGE_KEY = "arki_gemini_api_key";

export const useReceiptStore = create<ReceiptStore>((set) => ({
  isScanning: false,
  isConfirmOpen: false,
  isKeyPromptOpen: false,
  isCameraOpen: false,
  scanProgressText: "Analyzing receipt with AI...",
  receiptImage: null,
  extractedData: null,
  userApiKey: typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) || "" : "",

  setScanning: (isScanning, progressText = "Analyzing receipt with AI...") =>
    set({ isScanning, scanProgressText: progressText }),

  openConfirmModal: (data, image) =>
    set({
      isConfirmOpen: true,
      extractedData: data,
      receiptImage: image,
      isScanning: false,
      isCameraOpen: false,
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

  openKeyPrompt: () => set({ isKeyPromptOpen: true }),
  closeKeyPrompt: () => set({ isKeyPromptOpen: false }),

  setUserApiKey: (key: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, key);
    }
    set({ userApiKey: key });
  },

  reset: () =>
    set({
      isScanning: false,
      isConfirmOpen: false,
      isKeyPromptOpen: false,
      receiptImage: null,
      extractedData: null,
    }),
}));
