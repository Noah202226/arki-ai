"use client";

import { useEffect, useState, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Shadcn UI
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Icons
import {
  Receipt,
  ScanLine,
  CheckCircle2,
  Calendar as CalendarIcon,
  Wallet,
  Tag,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Camera,
  Sparkles,
  ShoppingBag,
  FileText,
  Maximize2,
  Minimize2,
  ShieldAlert,
  AlertCircle,
  Plus,
  Trash2,
  Check,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useReceiptStore } from "@/app/store/use-receipt-store";

interface ReceiptConfirmDialogProps {
  onRetake?: () => void;
}

export function ReceiptConfirmDialog({ onRetake }: ReceiptConfirmDialogProps) {
  const {
    isConfirmOpen,
    isScanning,
    scanProgressText,
    scanProgressPercent,
    scanStage,
    scanError,
    receiptImage,
    extractedData,
    setScanError,
    openManualEntry,
    closeConfirmModal,
  } = useReceiptStore();

  const addTransaction = useMutation(api.financials.addTransaction);
  const accounts = useQuery(api.accounts.getAccounts);
  const categories = useQuery(api.categories.getCategories, { type: undefined });

  // Form states
  interface EditableReceiptItem {
    id: string;
    name: string;
    price: string | number;
    quantity: number;
  }

  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<EditableReceiptItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  // Pre-fill form when extractedData changes
  useEffect(() => {
    if (extractedData && isConfirmOpen) {
      setMerchant(extractedData.merchant || "Receipt Expense");
      setAmount(extractedData.amount ? String(extractedData.amount) : "");
      setType(extractedData.type || "expense");
      setNotes(extractedData.notes || "");

      // Populate items from extracted receipt or empty array
      if (Array.isArray(extractedData.items) && extractedData.items.length > 0) {
        setItems(
          extractedData.items.map((it, idx) => ({
            id: `item-${idx}-${Date.now()}`,
            name: it.name || "",
            price: it.price !== undefined ? String(it.price) : "0",
            quantity: it.quantity && it.quantity > 0 ? it.quantity : 1,
          }))
        );
      } else {
        setItems([]);
      }

      // Parse date safely
      if (extractedData.date) {
        try {
          const parsed = parseISO(extractedData.date);
          if (!isNaN(parsed.getTime())) {
            // If date is today, preserve current local time so it sorts at the top of today's list
            const now = new Date();
            if (parsed.toDateString() === now.toDateString()) {
              parsed.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
            }
            setDate(parsed);
          } else {
            setDate(new Date());
          }
        } catch {
          setDate(new Date());
        }
      } else {
        setDate(new Date());
      }
    }
  }, [extractedData, isConfirmOpen]);

  // Item manipulation handlers
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: "",
        price: "",
        quantity: 1,
      },
    ]);
  };

  const handleUpdateItem = (
    id: string,
    field: "name" | "price" | "quantity",
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Real-time sum of itemized lines
  const itemsSum = useMemo(() => {
    return items.reduce((sum, it) => {
      const p = parseFloat(String(it.price)) || 0;
      return sum + p;
    }, 0);
  }, [items]);

  const handleSyncTotal = () => {
    if (itemsSum > 0) {
      setAmount(itemsSum.toFixed(2));
      toast.success(`Updated total amount to ₱${itemsSum.toFixed(2)} from line items!`);
    }
  };

  // Auto-select category reactively when categories or type change
  useEffect(() => {
    if (categories && categories.length > 0) {
      const currentValid = categories.find(
        (c) => c._id === categoryId && (!c.type || c.type.toLowerCase() === type.toLowerCase())
      );
      if (!currentValid) {
        const hint = (extractedData?.categoryHint || "").toLowerCase();
        const matched = categories.find((c) => {
          const cName = c.name.toLowerCase();
          const typeMatches = !c.type || c.type.toLowerCase() === type.toLowerCase();
          return typeMatches && (cName.includes(hint) || hint.includes(cName));
        });

        if (matched) {
          setCategoryId(matched._id);
        } else {
          const fallback =
            categories.find((c) => !c.type || c.type.toLowerCase() === type.toLowerCase()) ||
            categories[0];
          if (fallback) setCategoryId(fallback._id);
        }
      }
    }
  }, [categories, categoryId, type, extractedData?.categoryHint]);

  // Keep account updated if not yet selected or invalid
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      const currentValid = accounts.find((a) => a._id === accountId);
      if (!currentValid) {
        setAccountId(accounts[0]._id);
      }
    }
  }, [accounts, accountId]);

  const selectedAccount = useMemo(() => {
    return accounts?.find((a) => a._id === accountId);
  }, [accounts, accountId]);

  const numAmount = Number(amount) || 0;
  const isInsufficient =
    type === "expense" &&
    numAmount > 0 &&
    selectedAccount !== undefined &&
    selectedAccount.balance < numAmount;

  // Confidence styling
  const confidenceMeta = useMemo(() => {
    const conf = extractedData?.confidence || "medium";
    if (conf === "high") {
      return {
        label: "High Confidence Extraction",
        badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      };
    }
    if (conf === "medium") {
      return {
        label: "Medium Confidence • Please Verify",
        badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      };
    }
    return {
      label: "Low Confidence • Review Carefully",
      badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    };
  }, [extractedData?.confidence]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure we have a valid fallback category if somehow unselected
    let finalCatId = categoryId;
    if (!finalCatId && categories && categories.length > 0) {
      const fallback =
        categories.find((c) => !c.type || c.type.toLowerCase() === type.toLowerCase()) ||
        categories[0];
      finalCatId = fallback?._id || "";
    }

    // Ensure we have a valid fallback account if somehow unselected
    let finalAccId = accountId;
    if (!finalAccId && accounts && accounts.length > 0) {
      finalAccId = accounts[0]._id;
    }

    const cleanMerchant = merchant.trim() || extractedData?.merchant || "Receipt Expense";
    const numAmount = Number(amount) || extractedData?.amount || 0;

    if (!cleanMerchant || numAmount <= 0) {
      toast.error("Please enter a valid store/merchant name and total amount.");
      return;
    }

    if (!finalAccId || !finalCatId) {
      toast.error("Please select a wallet and category before saving.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure date includes current time when recorded for today so it sorts at the top
      const txDate = new Date(date);
      const now = new Date();
      if (txDate.toDateString() === now.toDateString()) {
        txDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      }

      const cleanedItems = items
        .filter((it) => it.name.trim().length > 0 || (parseFloat(String(it.price)) || 0) > 0)
        .map((it) => ({
          name: it.name.trim() || "Item",
          price: Math.max(0, parseFloat(String(it.price)) || 0),
          quantity: it.quantity && it.quantity > 0 ? Number(it.quantity) : 1,
        }));

      await addTransaction({
        title: cleanMerchant,
        amount: numAmount,
        type,
        categoryId: finalCatId as Id<"categories">,
        accountId: finalAccId as Id<"accounts">,
        date: txDate.getTime(),
        receiptNotes: notes.trim() || undefined,
        receiptItems: cleanedItems.length > 0 ? cleanedItems : undefined,
      });

      const accName = accounts?.find((a) => a._id === finalAccId)?.accountName || "Wallet";
      toast.success(
        `Transaction of ₱${numAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} saved to ${accName}!`
      );
      closeConfirmModal();
    } catch (err: unknown) {
      console.error("Failed to add verified transaction:", err);
      const msg = err instanceof Error ? err.message : "Failed to record transaction. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* 1. SCANNING IN-PROGRESS & ERROR RECOVERY MODAL */}
      <Dialog
        open={isScanning || Boolean(scanError)}
        onOpenChange={(open) => {
          if (!open && scanError) {
            setScanError(null);
          }
        }}
      >
        <DialogContent className="w-[92vw] sm:max-w-md rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl p-6 sm:p-8 text-center [&>button]:hidden">
          {scanError ? (
            /* ERROR RECOVERY VIEW: Friendly, interactive troubleshooting card */
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="relative w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 shadow-lg shadow-rose-500/10">
                <AlertCircle className="w-8 h-8 stroke-[2.5]" />
              </div>

              <div className="space-y-1.5">
                <DialogTitle className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-50">
                  Could Not Auto-Extract Details
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  {scanError}
                </DialogDescription>
              </div>

              {receiptImage && (
                <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#ff6b35]" />
                  <span>Your receipt photo is safely saved!</span>
                </div>
              )}

              <div className="w-full pt-2 space-y-2.5">
                {/* 1. Primary Action: Fill Details Manually (keeps the photo for inspection) */}
                <Button
                  type="button"
                  onClick={() => openManualEntry(receiptImage)}
                  className="w-full h-11 rounded-xl font-extrabold text-xs bg-gradient-to-r from-[#ff6b35] to-orange-500 hover:from-orange-600 hover:to-[#ff6b35] text-white shadow-md shadow-[#ff6b35]/25 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <FileText className="w-4 h-4" />
                  <span>Inspect Photo &amp; Enter Manually</span>
                </Button>

                {/* 2. Retake or Dismiss */}
                <div className="flex items-center gap-2 pt-1">
                  {onRetake && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setScanError(null);
                        onRetake();
                      }}
                      className="flex-1 h-10 rounded-xl font-bold text-xs border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#ff6b35]"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      Retake Photo
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setScanError(null)}
                    className="flex-1 h-10 rounded-xl font-bold text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* ACTIVE SCANNING MULTI-STAGE PROGRESS VIEW */
            <div className="flex flex-col items-center justify-center space-y-4">
              {/* Optional Mini Receipt Thumbnail with Animated Laser Scan Line */}
              {receiptImage ? (
                <div className="relative w-36 h-28 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-800/80 shadow-inner flex items-center justify-center">
                  <img
                    src={receiptImage}
                    alt="Receipt preview"
                    className="w-full h-full object-contain p-1 opacity-90"
                  />
                  {/* Glowing Laser Scan Bar */}
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#ff6b35] to-transparent shadow-[0_0_12px_#ff6b35] animate-[bounce_2s_infinite]" />
                  <div className="absolute bottom-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[9px] font-black uppercase tracking-wider text-white">
                    Gemini AI
                  </div>
                </div>
              ) : (
                /* Animated Scanner Radar */
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#ff6b35] via-amber-500 to-orange-400 opacity-25 animate-ping" />
                  <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff6b35] to-amber-500 text-white flex items-center justify-center shadow-xl shadow-[#ff6b35]/30">
                    <ScanLine className="w-7 h-7 animate-pulse stroke-[2.5]" />
                  </div>
                </div>
              )}

              <DialogHeader className="space-y-1 text-center w-full">
                <DialogTitle className="text-base font-black text-slate-900 dark:text-slate-50 tracking-tight text-center">
                  Processing Receipt OCR
                </DialogTitle>
                <DialogDescription className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-center truncate px-2">
                  {scanProgressText || "Analyzing image..."}
                </DialogDescription>
              </DialogHeader>

              {/* Progress Bar with Percentage Label */}
              <div className="w-full space-y-1.5 px-1">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-500 dark:text-slate-400">Pipeline Progress</span>
                  <span className="text-[#ff6b35] font-extrabold">{Math.min(100, Math.max(5, scanProgressPercent))}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-[#ff6b35] to-orange-500 transition-all duration-300 ease-out shadow-sm shadow-[#ff6b35]/40"
                    style={{ width: `${Math.min(100, Math.max(5, scanProgressPercent))}%` }}
                  />
                </div>
              </div>

              {/* Visual 4-Stage Pipeline Stepper */}
              <div className="w-full rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-2.5 space-y-1.5 text-left">
                {[
                  { id: "preprocessing", label: "Clean Image", desc: "Grayscale, contrast & sharpen" },
                  { id: "initializing", label: "Init Engine", desc: "Local worker & core files" },
                  { id: "recognizing", label: "Reading Text", desc: "Gemini AI Extraction" },
                  { id: "parsing", label: "Extract Data", desc: "Totals, merchant & item list" },
                ].map((step, idx) => {
                  const stageIdx =
                    scanStage === "preprocessing"
                      ? 0
                      : scanStage === "initializing"
                      ? 1
                      : scanStage === "recognizing"
                      ? 2
                      : scanStage === "parsing"
                      ? 3
                      : 0;

                  const isCompleted = scanProgressPercent >= 100 || stageIdx > idx;
                  const isActive = !isCompleted && stageIdx === idx;

                  return (
                    <div
                      key={step.id}
                      className={cn(
                        "flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all",
                        isActive
                          ? "bg-white dark:bg-slate-800 border border-[#ff6b35]/30 shadow-xs"
                          : isCompleted
                          ? "opacity-90"
                          : "opacity-40"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 transition-colors",
                            isCompleted
                              ? "bg-emerald-500 text-white"
                              : isActive
                              ? "bg-[#ff6b35] text-white animate-pulse"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                          )}
                        >
                          {isCompleted ? (
                            <Check className="w-3 h-3 stroke-[3]" />
                          ) : isActive ? (
                            <Loader2 className="w-3 h-3 animate-spin stroke-[2.5]" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <div>
                          <div
                            className={cn(
                              "font-bold text-[11px]",
                              isActive
                                ? "text-[#ff6b35] dark:text-[#ff7b4b]"
                                : isCompleted
                                ? "text-slate-800 dark:text-slate-200"
                                : "text-slate-500 dark:text-slate-400"
                            )}
                          >
                            {step.label}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 -mt-0.5">
                            {step.desc}
                          </div>
                        </div>
                      </div>

                      {isActive && (
                        <span className="text-[10px] font-bold text-[#ff6b35] px-1.5 py-0.5 rounded-md bg-[#ff6b35]/10 animate-pulse">
                          Running
                        </span>
                      )}
                      {isCompleted && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          Done
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 2. MAIN CONFIRMATION MODAL (ADHERES TO RESPONSIVE SIZING RULE) */}
      <Dialog open={isConfirmOpen} onOpenChange={(open) => !open && closeConfirmModal()}>
        <DialogContent className="w-[94vw] sm:max-w-[92vw] lg:max-w-5xl xl:max-w-6xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl">
          {/* MODAL HEADER */}
          <div className="sticky top-0 z-20 px-4 sm:px-6 py-3.5 sm:py-4 pr-12 sm:pr-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#ff6b35]/10 text-[#ff6b35]">
                <Receipt className="w-5 h-5 stroke-[2.5]" />
              </div>
              <DialogHeader className="text-left space-y-0.5">
                <DialogTitle className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  Verify Extracted Receipt
                </DialogTitle>
                <DialogDescription className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Inspect the captured image and confirm or tweak details before saving.
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* Engine & Confidence Badges */}
            <div className="flex items-center gap-2">
              {extractedData?.engine && (
                <div
                  className={cn(
                    "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                    extractedData.engine === "tesseract"
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                      : extractedData.engine === "gemini"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                  )}
                >
                  <ScanLine className="w-3 h-3 shrink-0" />
                  <span>
                    {extractedData.engine === "tesseract"
                      ? "Tesseract OCR"
                      : extractedData.engine === "gemini"
                      ? "Gemini AI"
                      : "Demo Scan"}
                  </span>
                </div>
              )}

              {/* Confidence Badge */}
              <div
                className={cn(
                  "hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border",
                  confidenceMeta.badgeClass
                )}
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{confidenceMeta.label}</span>
              </div>
            </div>
          </div>

          {/* DUAL-PANE BODY */}
          <form
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
                e.preventDefault();
              }
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800">
              {/* ── LEFT PANE: RECEIPT VISUAL INSPECTOR (45%) ───────────────── */}
              <div className="lg:col-span-5 p-5 sm:p-6 space-y-4 bg-slate-50/60 dark:bg-slate-950/40">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Receipt Photo Inspector
                  </span>
                  <div className="flex items-center gap-2">
                    {onRetake && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onRetake}
                        className="h-8 px-2.5 text-xs font-bold gap-1 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:text-[#ff6b35]"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Retake
                      </Button>
                    )}
                    {receiptImage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsImageZoomed(!isImageZoomed)}
                        className="h-8 w-8 p-0 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        title={isImageZoomed ? "Shrink view" : "Enlarge view"}
                      >
                        {isImageZoomed ? (
                          <Minimize2 className="w-3.5 h-3.5" />
                        ) : (
                          <Maximize2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Receipt Image Frame */}
                {receiptImage ? (
                  <div
                    className={cn(
                      "relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-900 shadow-inner flex items-center justify-center transition-all duration-300",
                      isImageZoomed ? "max-h-[500px]" : "max-h-[300px]"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={receiptImage}
                      alt="Scanned receipt"
                      className={cn(
                        "w-full object-contain transition-transform duration-300",
                        isImageZoomed ? "max-h-[500px]" : "max-h-[300px]"
                      )}
                    />
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-mono text-white/90">
                      Captured Slip
                    </div>
                  </div>
                ) : (
                  <div className="h-44 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <Camera className="w-8 h-8 opacity-40" />
                    <span className="text-xs font-semibold">No Image Available</span>
                  </div>
                )}

                {/* Detected VAT / Tax Summary */}
                {extractedData?.tax !== undefined && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-800 text-xs">
                    <span className="font-semibold text-slate-500">VAT / Tax</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      ₱{extractedData.tax.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Scanned Notes / Raw metadata */}
                {notes && (
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 space-y-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-slate-400" />
                      Receipt Context
                    </span>
                    <p className="text-[11px] font-mono text-slate-600 dark:text-slate-300 break-words">
                      {notes}
                    </p>
                  </div>
                )}
              </div>

              {/* ── RIGHT PANE: TRANSACTION VERIFICATION FORM (55%) ────────── */}
              <div className="lg:col-span-7 p-5 sm:p-6 space-y-4">
                {/* Step 2 Verification Banner - Confirms Nothing Is Saved Yet */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-sm">
                  <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="font-black flex flex-wrap items-center gap-1.5 text-slate-900 dark:text-slate-100">
                      <span>Step 2: Review Extracted Details</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold uppercase tracking-wide">
                        Not Saved Yet
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                      Nothing has been added to your wallet or transactions yet. Inspect or adjust the merchant, amount, and category below, then click <strong>&quot;Confirm &amp; Save to Wallet&quot;</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Transaction Details
                  </span>
                  <span className="text-[11px] font-bold text-[#ff6b35]">
                    Editable before saving
                  </span>
                </div>

                {/* Expense / Income Tabs */}
                <Tabs
                  value={type}
                  onValueChange={(val) => setType(val as "expense" | "income")}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800/70 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                    <TabsTrigger
                      value="expense"
                      className="rounded-xl py-2 text-xs font-bold transition-all data-[state=active]:bg-rose-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                    >
                      Expense (Outflow)
                    </TabsTrigger>
                    <TabsTrigger
                      value="income"
                      className="rounded-xl py-2 text-xs font-bold transition-all data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                    >
                      Income (Inflow)
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Merchant / Description Input */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-slate-400 px-1">
                    Merchant / Store Name
                  </Label>
                  <Input
                    placeholder="e.g. SM Supermarket, Jollibee"
                    className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 h-11 px-4 font-bold rounded-xl focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    required
                  />
                </div>

                {/* Amount, Category and Date Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Amount Input */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-slate-400 px-1">
                      Total Amount
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-sm font-bold text-[#ff6b35]">
                        ₱
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        className="pl-8 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 h-11 rounded-xl font-mono text-base font-black focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Category Selector */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-slate-400 px-1">
                      Category
                    </Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 h-11 rounded-xl focus:ring-2 focus:ring-[#ff6b35]">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xl max-h-56">
                        {(
                          categories?.filter((c) => !c.type || c.type.toLowerCase() === type.toLowerCase()) ||
                          categories ||
                          []
                        ).map((cat) => (
                          <SelectItem key={cat._id} value={cat._id}>
                            <div className="flex items-center gap-2">
                              <Tag className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-semibold text-xs">{cat.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Picker */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-slate-400 px-1">
                      Transaction Date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-medium h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-[#ff6b35]" />
                          {date ? format(date, "PPP") : <span>Select Date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                        align="center"
                      >
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(d) => d && setDate(d)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Source Wallet */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">
                      Source Wallet
                    </Label>
                    {selectedAccount && (
                      <span
                        className={cn(
                          "text-[10px] font-mono font-bold",
                          isInsufficient
                            ? "text-rose-500"
                            : "text-emerald-600 dark:text-emerald-400"
                        )}
                      >
                        Bal: ₱
                        {selectedAccount.balance.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    )}
                  </div>
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 h-11 rounded-xl focus:ring-2 focus:ring-[#ff6b35]">
                      <SelectValue placeholder="Select Wallet" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xl max-h-56">
                      {accounts?.map((acc) => {
                        const isLow =
                          type === "expense" && numAmount > 0 && acc.balance < numAmount;
                        return (
                          <SelectItem key={acc._id} value={acc._id}>
                            <div className="flex items-center justify-between gap-3 w-full">
                              <div className="flex items-center gap-2 truncate">
                                <Wallet className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="font-semibold text-xs truncate">
                                  {acc.accountName}
                                </span>
                              </div>
                              <span
                                className={cn(
                                  "font-mono text-xs font-bold shrink-0 ml-auto",
                                  isLow
                                    ? "text-rose-500"
                                    : "text-emerald-600 dark:text-emerald-400"
                                )}
                              >
                                ₱
                                {acc.balance.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {isInsufficient && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-2 text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      Warning: Selected wallet has insufficient balance for this expense.
                    </span>
                  </div>
                )}

                {/* ── ITEMIZE ITEMS SECTION (ALWAYS VISIBLE & EDITABLE) ── */}
                <div className="space-y-2.5 rounded-2xl p-3.5 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-[#ff6b35]" />
                      <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                        Itemized Items
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700/70 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {items.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {items.length > 0 && Math.abs(itemsSum - numAmount) > 0.01 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleSyncTotal}
                          className="h-7 px-2.5 rounded-lg text-[11px] font-bold text-[#ff6b35] hover:bg-[#ff6b35]/10 flex items-center gap-1"
                          title="Set total amount to sum of items"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Sync Total (₱{itemsSum.toFixed(2)})</span>
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddItem}
                        className="h-7 px-2.5 rounded-lg text-[11px] font-bold border-slate-200 dark:border-slate-700 hover:text-[#ff6b35] hover:border-[#ff6b35]/40 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Item</span>
                      </Button>
                    </div>
                  </div>

                  {/* Items List */}
                  {items.length === 0 ? (
                    <div className="py-4 px-3 border border-dashed border-slate-200 dark:border-slate-700/80 rounded-xl text-center">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        No line items added yet.
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleAddItem}
                        className="mt-1.5 h-7 px-3 text-xs font-bold text-[#ff6b35] hover:bg-[#ff6b35]/10"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Itemize this Receipt
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {items.map((it, idx) => (
                        <div
                          key={it.id}
                          className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm"
                        >
                          {/* Quantity */}
                          <div className="w-14 shrink-0">
                            <Input
                              type="number"
                              min="1"
                              value={it.quantity}
                              onChange={(e) =>
                                handleUpdateItem(it.id, "quantity", Math.max(1, parseInt(e.target.value, 10) || 1))
                              }
                              placeholder="1x"
                              className="h-8 px-1.5 text-center font-mono text-xs font-bold bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                              title="Quantity"
                            />
                          </div>

                          {/* Item Name */}
                          <div className="flex-1 min-w-0">
                            <Input
                              type="text"
                              value={it.name}
                              onChange={(e) => handleUpdateItem(it.id, "name", e.target.value)}
                              placeholder={`Item #${idx + 1} description`}
                              className="h-8 px-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                            />
                          </div>

                          {/* Price */}
                          <div className="w-24 shrink-0 relative">
                            <span className="absolute left-2 top-2 text-xs font-bold text-slate-400">₱</span>
                            <Input
                              type="number"
                              step="0.01"
                              value={it.price}
                              onChange={(e) => handleUpdateItem(it.id, "price", e.target.value)}
                              placeholder="0.00"
                              className="h-8 pl-5 pr-1.5 text-right font-mono text-xs font-bold bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                              title="Total item price"
                            />
                          </div>

                          {/* Delete Item */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(it.id)}
                            className="w-7 h-7 shrink-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}

                      {/* Items Total Summary Bar */}
                      <div className="flex items-center justify-between px-2 pt-1 text-xs">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          Items Subtotal:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-900 dark:text-slate-100">
                            ₱{itemsSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          {numAmount > 0 && Math.abs(itemsSum - numAmount) <= 0.01 ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                              ✓ Matches Total
                            </span>
                          ) : numAmount > 0 ? (
                            <span className="text-[10px] font-semibold text-amber-500">
                              (Diff: ₱{Math.abs(numAmount - itemsSum).toFixed(2)})
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Notes */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-slate-400 px-1">
                    Notes / Description (Optional)
                  </Label>
                  <Input
                    placeholder="e.g. Dinner with team, receipt #1234"
                    className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 h-10 px-3.5 text-xs rounded-xl focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* MODAL FOOTER ACTIONS */}
            <DialogFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closeConfirmModal}
                  disabled={isSubmitting}
                  className="rounded-xl h-11 px-4 font-bold text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 w-full sm:w-auto"
                >
                  Discard &amp; Cancel
                </Button>
                {onRetake && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onRetake}
                    disabled={isSubmitting}
                    className="rounded-xl h-11 px-4 font-bold text-xs gap-1.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:text-[#ff6b35] w-full sm:w-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retake Receipt
                  </Button>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !merchant.trim() || !amount}
                className="w-full sm:w-auto min-w-[220px] h-11 px-6 rounded-xl font-extrabold text-sm bg-gradient-to-r from-emerald-600 via-[#ff6b35] to-orange-500 hover:from-emerald-700 hover:to-orange-600 text-white shadow-lg shadow-[#ff6b35]/25 transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Confirm &amp; Save to Wallet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
