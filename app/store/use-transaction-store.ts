import { create } from "zustand";

interface TransactionStore {
  isOpen: boolean;
  initialData: {
    title: string;
    category: string;
    creditId: string | null;
  };
  onOpen: (title?: string, category?: string, creditId?: string | null) => void;
  onClose: () => void;
}

export const useTransactionStore = create<TransactionStore>((set) => ({
  isOpen: false,
  initialData: { title: "", category: "General", creditId: null },
  onOpen: (title = "", category = "General", creditId = null) =>
    set({ isOpen: true, initialData: { title, category, creditId } }),
  onClose: () =>
    set({
      isOpen: false,
      // Reset data on close to avoid data leaking into the next open
      initialData: { title: "", category: "General", creditId: null },
    }),
}));
