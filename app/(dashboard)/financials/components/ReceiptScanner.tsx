"use client";

import { useReceiptScan } from "@/app/(dashboard)/financials/hooks/use-receipt-scan";
import { ReceiptConfirmDialog } from "@/app/(dashboard)/financials/components/ReceiptConfirmDialog";
import { LiveCameraModal } from "@/app/(dashboard)/financials/components/LiveCameraModal";
import { Button } from "@/components/ui/button";
import { Camera, ScanLine, Receipt, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ReceiptScanner: Hosts the live WebRTC camera modal,
 * fallback file picker input, and confirmation dialog.
 */
export function ReceiptScanner() {
  const {
    fileInputRef,
    handleFileInputChange,
    triggerCamera,
    triggerFileSelect,
    scanReceiptBase64,
  } = useReceiptScan();

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
      <LiveCameraModal
        onCapture={scanReceiptBase64}
        onSelectFileFallback={triggerFileSelect}
      />
      <ReceiptConfirmDialog onRetake={triggerCamera} />
    </>
  );
}

/**
 * ScanReceiptButton: Sleek header or dashboard action button
 */
export function ScanReceiptButton({
  className,
  variant = "gradient",
}: {
  className?: string;
  variant?: "gradient" | "outline" | "compact";
}) {
  const { triggerCamera, isScanning } = useReceiptScan();

  if (variant === "compact") {
    return (
      <Button
        type="button"
        size="icon"
        onClick={triggerCamera}
        disabled={isScanning}
        title="Snap receipt with device camera"
        className={cn(
          "h-10 w-10 rounded-xl bg-white/[0.08] hover:bg-[#ff6b35]/20 border border-white/10 hover:border-[#ff6b35]/50 text-white transition-all active:scale-95",
          className
        )}
      >
        <Camera className="w-4 h-4 text-[#ff6b35]" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      onClick={triggerCamera}
      disabled={isScanning}
      className={cn(
        "relative flex items-center gap-2 px-3.5 py-2 h-10 rounded-xl font-extrabold text-xs tracking-wide transition-all duration-200 active:scale-95 group",
        variant === "gradient"
          ? "bg-gradient-to-r from-orange-500/15 via-[#ff6b35]/25 to-amber-500/20 hover:from-orange-500/25 hover:to-[#ff6b35]/35 text-white border border-[#ff6b35]/40 shadow-sm shadow-[#ff6b35]/20"
          : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:border-[#ff6b35]/50 hover:text-[#ff6b35]",
        className
      )}
    >
      <div className="flex items-center justify-center w-5 h-5 rounded-lg bg-[#ff6b35]/20 text-[#ff6b35] group-hover:scale-110 transition-transform">
        <Camera className="w-3.5 h-3.5" />
      </div>
      <span className="truncate">Scan Receipt</span>
      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#ff6b35]/20 text-[#ff6b35] text-[9px] font-black uppercase tracking-wider">
        <ScanLine className="w-2.5 h-2.5" />
        OCR
      </span>
    </Button>
  );
}

/**
 * ScanReceiptQuickBanner: Banner for embedding inside AddTransactionDialog
 */
export function ScanReceiptQuickBanner({
  onScanClick,
}: {
  onScanClick?: () => void;
}) {
  const { triggerCamera, scanDemoReceipt, isScanning } = useReceiptScan();

  const handleScan = () => {
    if (onScanClick) onScanClick();
    triggerCamera();
  };

  const handleDemo = () => {
    if (onScanClick) onScanClick();
    scanDemoReceipt();
  };

  return (
    <div className="relative overflow-hidden p-3.5 rounded-2xl bg-gradient-to-br from-[#ff6b35]/10 via-amber-500/5 to-transparent border border-[#ff6b35]/20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#ff6b35] text-white shadow-md shadow-[#ff6b35]/30">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                Snap Physical Receipt
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#ff6b35]/20 text-[#ff6b35] uppercase">
                Live Camera
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Open device camera to auto-extract merchant, total, date &amp; items
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDemo}
            disabled={isScanning}
            className="h-8 px-2.5 text-[11px] font-bold rounded-xl border-slate-200 dark:border-slate-700 hover:text-[#ff6b35] bg-white dark:bg-slate-900"
          >
            Try Sample
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleScan}
            disabled={isScanning}
            className="h-8 px-3 text-[11px] font-extrabold rounded-xl bg-[#ff6b35] hover:bg-[#e05a2b] text-white shadow-sm shadow-[#ff6b35]/20 gap-1"
          >
            <Camera className="w-3.5 h-3.5" />
            Open Camera
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
