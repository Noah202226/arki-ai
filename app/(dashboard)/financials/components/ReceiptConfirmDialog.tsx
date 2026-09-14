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
  KeyRound,
  ExternalLink,
  Sparkles,
  ShoppingBag,
  FileText,
  Maximize2,
  Minimize2,
  ShieldAlert,
  AlertCircle,
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
    isKeyPromptOpen,
    isScanning,
    scanProgressText,
    scanError,
    receiptImage,
    extractedData,
    userApiKey,
    setScanError,
    openManualEntry,
    openKeyPrompt,
    closeConfirmModal,
    closeKeyPrompt,
    setUserApiKey,
  } = useReceiptStore();

  const addTransaction = useMutation(api.financials.addTransaction);
  const accounts = useQuery(api.accounts.getAccounts);
  const categories = useQuery(api.categories.getCategories, { type: undefined });

  // Form states
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  // Key prompt input state
  const [inputKey, setInputKey] = useState(userApiKey || "");

  // Pre-fill form when extractedData changes
  useEffect(() => {
    if (extractedData && isConfirmOpen) {
      setMerchant(extractedData.merchant || "Receipt Expense");
      setAmount(extractedData.amount ? String(extractedData.amount) : "");
      setType(extractedData.type || "expense");
      setNotes(extractedData.notes || "");

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

      await addTransaction({
        title: cleanMerchant,
        amount: numAmount,
        type,
        categoryId: finalCatId as Id<"categories">,
        accountId: finalAccId as Id<"accounts">,
        date: txDate.getTime(),
        receiptNotes: notes.trim() || undefined,
        receiptItems:
          extractedData?.items && extractedData.items.length > 0 ? extractedData.items : undefined,
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

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) {
      toast.error("Please enter a valid Gemini API key.");
      return;
    }
    setUserApiKey(inputKey.trim());
    closeKeyPrompt();
    toast.success("Gemini API key saved! You can now scan receipts.");
    if (onRetake) onRetake();
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

                {/* 2. Secondary: Configure Gemini Key for instant cloud AI */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setScanError(null);
                    openKeyPrompt();
                  }}
                  className="w-full h-10 rounded-xl font-bold text-xs border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#ff6b35] flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                  <span>Use Free Gemini AI Key (2s Scan)</span>
                </Button>

                {/* 3. Retake or Dismiss */}
                <div className="flex items-center gap-2 pt-1">
                  {onRetake && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setScanError(null);
                        onRetake();
                      }}
                      className="flex-1 h-9 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-400 hover:text-[#ff6b35]"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      Retake Photo
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setScanError(null)}
                    className="flex-1 h-9 rounded-xl font-bold text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* ACTIVE SCANNING RADAR VIEW */
            <div className="flex flex-col items-center justify-center space-y-5">
              {/* Animated Scanner Radar */}
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#ff6b35] via-amber-500 to-orange-400 opacity-25 animate-ping" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff6b35] to-amber-500 text-white flex items-center justify-center shadow-xl shadow-[#ff6b35]/30">
                  <ScanLine className="w-8 h-8 animate-pulse stroke-[2.5]" />
                </div>
              </div>

              <DialogHeader className="space-y-1.5 text-center">
                <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-slate-50 tracking-tight text-center">
                  AI Receipt Scanner
                </DialogTitle>
                <DialogDescription className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-center">
                  {scanProgressText}
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-[#ff6b35] animate-spin" />
                Extracting totals, merchant, &amp; line items
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 2. API KEY SETUP PROMPT DIALOG (IF GEMINI_API_KEY IS MISSING) */}
      <Dialog open={isKeyPromptOpen} onOpenChange={(open) => !open && closeKeyPrompt()}>
        <DialogContent className="w-[92vw] sm:max-w-md rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl p-6">
          <DialogHeader className="space-y-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="flex items-center gap-2.5 text-lg font-black text-slate-900 dark:text-slate-50">
              <div className="p-2 rounded-xl bg-[#ff6b35]/10 text-[#ff6b35]">
                <KeyRound className="w-5 h-5" />
              </div>
              Gemini Vision API Key
            </DialogTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              To scan physical receipts directly with Google Gemini AI, please provide your free API key. It will be stored safely in your browser.
            </p>
          </DialogHeader>

          <form onSubmit={handleSaveKey} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-slate-400">
                Google Gemini API Key
              </Label>
              <Input
                type="password"
                placeholder="AIzaSy..."
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 h-11 px-3.5 font-mono text-xs rounded-xl focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
                required
              />
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Don&apos;t have a key?</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[#ff6b35] hover:underline font-bold inline-flex items-center gap-1"
              >
                Get Free Gemini Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeKeyPrompt}
                className="flex-1 rounded-xl h-11 font-bold text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-xl h-11 font-extrabold text-xs bg-[#ff6b35] hover:bg-[#e05a2b] text-white shadow-md shadow-[#ff6b35]/25"
              >
                Save &amp; Scan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. MAIN CONFIRMATION MODAL (ADHERES TO RESPONSIVE SIZING RULE) */}
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
                      ? "bg-[#ff6b35]/10 text-[#ff6b35] border-[#ff6b35]/30"
                      : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                  )}
                >
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span>
                    {extractedData.engine === "tesseract"
                      ? "Tesseract OCR"
                      : extractedData.engine === "gemini"
                      ? "Gemini AI Vision"
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

                {/* Itemized Line Items Breakdown */}
                {extractedData?.items && extractedData.items.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between px-0.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-[#ff6b35]" />
                        Detected Items ({extractedData.items.length})
                      </span>
                      {extractedData.tax !== undefined && (
                        <span className="text-[10px] font-mono text-slate-400">
                          VAT/Tax: ₱{extractedData.tax.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 text-xs">
                      {extractedData.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            {item.quantity && item.quantity > 1 && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                                {item.quantity}x
                              </span>
                            )}
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {item.name}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 shrink-0">
                            ₱{Number(item.price).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
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

                {/* Amount and Category Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                </div>

                {/* Source Wallet and Date Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Wallet Selector */}
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

                {isInsufficient && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-2 text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      Warning: Selected wallet has insufficient balance for this expense.
                    </span>
                  </div>
                )}

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
