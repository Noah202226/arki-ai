"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useReceiptStore } from "@/app/store/use-receipt-store";
import {
  Camera,
  RefreshCw,
  X,
  Upload,
  AlertCircle,
  ScanLine,
  Check,
  Sparkles,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";

interface LiveCameraModalProps {
  onCapture: (base64DataUrl: string) => void;
  onSelectFileFallback: () => void;
}

export function LiveCameraModal({
  onCapture,
  onSelectFileFallback,
}: LiveCameraModalProps) {
  const { isCameraOpen, closeCamera, openKeyPrompt } = useReceiptStore();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

  // Stop media stream tracks cleanly
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Initialize and start camera feed
  const startCamera = useCallback(async () => {
    stopStream();
    setHasPermission(null);

    if (!navigator?.mediaDevices?.getUserMedia) {
      setHasPermission(false);
      toast.error("Camera access is not supported on this browser.");
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : {
              facingMode: { ideal: facingMode },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          console.warn("Video play error:", err);
        });
      }

      setHasPermission(true);

      // Enumerate devices to allow switching between cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      setAvailableCameras(videoDevices);
    } catch (err: unknown) {
      console.error("Camera access error:", err);
      setHasPermission(false);
    }
  }, [facingMode, selectedDeviceId, stopStream]);

  // Start / stop camera based on modal open state
  useEffect(() => {
    if (isCameraOpen) {
      startCamera();
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isCameraOpen, startCamera, stopStream]);

  // Switch camera between front and back
  const handleToggleFacingMode = () => {
    if (availableCameras.length > 1) {
      const currentIndex = availableCameras.findIndex(
        (c) => c.deviceId === selectedDeviceId
      );
      const nextIndex = (currentIndex + 1) % availableCameras.length;
      setSelectedDeviceId(availableCameras[nextIndex].deviceId);
    } else {
      setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
    }
  };

  // Capture photo from video stream and freeze on captured preview
  const handleSnap = () => {
    if (!videoRef.current || isCapturing) return;

    setIsCapturing(true);
    setIsFlashActive(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create canvas context");

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to JPEG data URL
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

      setTimeout(() => {
        setIsFlashActive(false);
        setIsCapturing(false);
        setCapturedPreview(dataUrl);
        // Pause live video playback while reviewing preview
        if (videoRef.current) {
          videoRef.current.pause();
        }
      }, 150);
    } catch (err: unknown) {
      console.error("Failed to capture image:", err);
      setIsFlashActive(false);
      setIsCapturing(false);
      toast.error("Failed to capture receipt photo. Please try again.");
    }
  };

  // Discard preview and resume live camera feed
  const handleRetake = () => {
    setCapturedPreview(null);
    if (videoRef.current && streamRef.current) {
      videoRef.current.play().catch((err) => {
        console.warn("Video resume error:", err);
      });
    } else {
      startCamera();
    }
  };

  // User confirmed the captured photo clarity - proceed to AI extraction
  const handleAcceptCapture = () => {
    if (!capturedPreview) return;
    const finalImage = capturedPreview;
    setCapturedPreview(null);
    stopStream();
    closeCamera();
    onCapture(finalImage);
  };

  const handleClose = () => {
    setCapturedPreview(null);
    stopStream();
    closeCamera();
  };

  const handleUploadClick = () => {
    handleClose();
    onSelectFileFallback();
  };

  return (
    <Dialog open={isCameraOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-[94vw] sm:max-w-[92vw] lg:max-w-3xl max-h-[90vh] p-0 overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-950 text-white shadow-2xl [&>button]:hidden">
        {/* Radix Accessible Header */}
        <div className="px-5 py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between">
          <DialogHeader className="text-left space-y-0.5">
            <DialogTitle className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#ff6b35]" />
              {capturedPreview ? "Step 1: Check Photo Clarity" : "Live Receipt Camera"}
            </DialogTitle>
            <DialogDescription className="text-[11px] text-white/60">
              {capturedPreview
                ? "Ensure totals and store name are legible before extracting details."
                : "Align receipt inside the frame and tap the capture button."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                handleClose();
                openKeyPrompt();
              }}
              title="Configure Gemini API Key"
              className="rounded-full text-white/70 hover:text-[#ff6b35] hover:bg-white/10"
            >
              <KeyRound className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleClose}
              className="rounded-full text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Viewfinder Area */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-black flex items-center justify-center overflow-hidden">
          {/* Live Video Stream */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Captured Freeze Frame Preview Overlay */}
          {capturedPreview && (
            <div className="absolute inset-0 bg-black z-20 flex flex-col items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedPreview}
                alt="Captured Receipt Preview"
                className="w-full h-full object-contain"
              />
              {/* Top Banner Tag */}
              <div className="absolute top-4 inset-x-4 flex items-center justify-center pointer-events-none">
                <div className="px-4 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/40 text-emerald-400 text-xs font-bold shadow-xl backdrop-blur-md flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  <span>Photo Captured — Inspect Before Extracting</span>
                </div>
              </div>
              {/* Bottom Instructions Tip */}
              <div className="absolute bottom-4 inset-x-6 flex items-center justify-center pointer-events-none">
                <div className="px-3.5 py-1 rounded-xl bg-black/75 border border-white/10 text-white/80 text-[11px] font-medium backdrop-blur-md text-center">
                  Check if text and numbers are sharp. If blurry or cut off, tap Retake.
                </div>
              </div>
            </div>
          )}

          {/* Shutter Flash Animation */}
          {isFlashActive && (
            <div className="absolute inset-0 bg-white z-30 animate-out fade-out duration-200" />
          )}

          {/* Receipt Framing Guide Overlay (Only when streaming live) */}
          {!capturedPreview && hasPermission === true && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 z-10">
              {/* Receipt Target Box */}
              <div className="relative w-[85%] sm:w-[75%] h-[80%] rounded-2xl border-2 border-white/40 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] flex items-center justify-center">
                {/* Corner Brackets */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#ff6b35] rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#ff6b35] rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#ff6b35] rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#ff6b35] rounded-br-lg" />

                {/* Center Scan Guide */}
                <div className="flex flex-col items-center gap-1 text-white/70">
                  <ScanLine className="w-6 h-6 text-[#ff6b35] animate-pulse" />
                  <span className="text-[11px] font-bold tracking-wide uppercase bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm">
                    Center Receipt Here
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Loading / Requesting Permission */}
          {!capturedPreview && hasPermission === null && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center space-y-3 z-20">
              <div className="p-3 rounded-2xl bg-[#ff6b35]/20 text-[#ff6b35] animate-pulse">
                <Camera className="w-8 h-8" />
              </div>
              <p className="text-xs font-semibold text-white/80">
                Requesting camera access...
              </p>
            </div>
          )}

          {/* Permission Denied / Camera Error */}
          {!capturedPreview && hasPermission === false && (
            <div className="absolute inset-0 bg-slate-950 p-6 flex flex-col items-center justify-center text-center space-y-3 z-20">
              <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Camera Not Accessible</h4>
                <p className="text-xs text-white/60 max-w-sm">
                  Please enable camera permission in your browser address bar, or upload an image file directly.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={startCamera}
                  className="rounded-xl h-10 px-4 text-xs font-bold bg-white/5 border-white/20 text-white hover:bg-white/10"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Try Again
                </Button>
                <Button
                  type="button"
                  onClick={handleUploadClick}
                  className="rounded-xl h-10 px-4 text-xs font-extrabold bg-[#ff6b35] hover:bg-[#e05a2b] text-white"
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Upload Photo
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Viewfinder Controls Footer */}
        {capturedPreview ? (
          /* Preview Mode Controls: Retake or Analyze */
          <div className="px-6 py-4 bg-slate-900 border-t border-white/10 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleRetake}
              className="h-11 px-4 rounded-xl font-bold text-xs bg-white/5 hover:bg-white/10 border-white/20 text-white flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-amber-400" />
              <span>Retake Photo</span>
            </Button>

            <Button
              type="button"
              onClick={handleAcceptCapture}
              className="h-11 px-5 rounded-xl font-extrabold text-xs bg-gradient-to-r from-[#ff6b35] to-orange-500 hover:from-orange-600 hover:to-[#ff6b35] text-white shadow-lg shadow-[#ff6b35]/25 flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Analyze &amp; Extract Details</span>
            </Button>
          </div>
        ) : (
          /* Live Viewfinder Controls: Upload, Shutter, Flip */
          <div className="px-6 py-4 bg-slate-900 border-t border-white/10 flex items-center justify-between gap-4">
            {/* Left: Upload file alternative */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUploadClick}
              className="h-10 px-3.5 rounded-xl font-bold text-xs bg-white/5 hover:bg-white/10 border-white/15 text-white flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload Image</span>
            </Button>

            {/* Center: Large Shutter Capture Button */}
            <div className="flex items-center justify-center">
              <button
                type="button"
                disabled={hasPermission !== true || isCapturing}
                onClick={handleSnap}
                title="Snap Receipt Photo"
                className="relative w-16 h-16 rounded-full bg-white flex items-center justify-center transition-all duration-150 active:scale-90 hover:scale-105 shadow-xl shadow-white/20 disabled:opacity-50 disabled:pointer-events-none group cursor-pointer"
              >
                {/* Outer Glow Ring */}
                <span className="absolute -inset-1 rounded-full border-2 border-white/50 group-hover:border-[#ff6b35] transition-colors" />
                {/* Inner Shutter Core */}
                <span className="w-12 h-12 rounded-full bg-[#ff6b35] group-hover:bg-[#e05a2b] transition-colors flex items-center justify-center text-white">
                  <Camera className="w-6 h-6 stroke-[2.5]" />
                </span>
              </button>
            </div>

            {/* Right: Flip Camera (if multi-camera device exists) */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggleFacingMode}
              disabled={hasPermission !== true}
              className="h-10 px-3.5 rounded-xl font-bold text-xs bg-white/5 hover:bg-white/10 border-white/15 text-white flex items-center gap-1.5"
              title="Switch front/back camera"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Flip</span>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
