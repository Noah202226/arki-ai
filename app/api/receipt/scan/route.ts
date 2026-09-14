import { NextRequest, NextResponse } from "next/server";
import { createWorker } from "tesseract.js";
import { parseReceiptText, ExtractedReceiptData } from "@/lib/receipt-parser";
import os from "os";

export const runtime = "nodejs";
export const maxDuration = 30; // 30 seconds max for OCR

// Reusable Tesseract worker promise on server
let tesseractWorkerPromise: Promise<any> | null = null;

async function getTesseractWorker() {
  if (!tesseractWorkerPromise) {
    tesseractWorkerPromise = (async () => {
      const cacheDir = os.tmpdir() || "/tmp";
      const worker = await createWorker("eng", 1, {
        cachePath: cacheDir,
        cacheMethod: "write",
        gzip: true,
      });
      return worker;
    })().catch((err) => {
      console.error("Failed to initialize server Tesseract worker:", err);
      tesseractWorkerPromise = null;
      throw err;
    });
  }
  return tesseractWorkerPromise;
}

/**
 * Runs local Tesseract OCR on image buffer with timeout safety.
 */
async function runTesseractOcr(imageBuffer: Buffer): Promise<ExtractedReceiptData> {
  const ocrWithTimeout = async (worker: any) => {
    return Promise.race([
      worker.recognize(imageBuffer),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("OCR recognition timed out")), 15000)
      ),
    ]);
  };

  try {
    const worker = await getTesseractWorker();
    const ret = await ocrWithTimeout(worker);
    const rawText = ret?.data?.text || "";
    return parseReceiptText(rawText);
  } catch (err) {
    console.warn("Tesseract worker error, recreating worker:", err);
    tesseractWorkerPromise = null;
    const worker = await getTesseractWorker();
    const ret = await ocrWithTimeout(worker);
    const rawText = ret?.data?.text || "";
    return parseReceiptText(rawText);
  }
}

export async function POST(req: NextRequest) {
  try {
    let imageBase64 = "";
    let isMock = req.headers.get("x-mock-demo") === "true";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      imageBase64 = body.imageBase64 || "";
      if (body.isMock) isMock = true;
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const mockFromForm = formData.get("isMock") as string | null;

      if (mockFromForm === "true") isMock = true;

      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        imageBase64 = Buffer.from(arrayBuffer).toString("base64");
      }
    }

    // Clean imageBase64 data URL prefix if present
    if (imageBase64.includes(",")) {
      const parts = imageBase64.split(",");
      imageBase64 = parts[1];
    }

    // 1. Demo / Mock Mode Handler
    if (isMock) {
      const mockResult: ExtractedReceiptData = {
        merchant: "Jollibee - Grand Central",
        amount: 385.0,
        date: new Date().toISOString().split("T")[0],
        categoryHint: "Food & Dining",
        type: "expense",
        tax: 41.25,
        items: [
          { name: "2-pc Chickenjoy w/ Rice & Drink", price: 220.0, quantity: 1 },
          { name: "Peach Mango Pie (3-pc Pack)", price: 110.0, quantity: 1 },
          { name: "Extra Gravy", price: 55.0, quantity: 1 },
        ],
        notes: "OR# 948271 • Cash Tendered ₱500 • Change ₱115",
        confidence: "high",
        engine: "demo",
      };

      return NextResponse.json({
        ok: true,
        data: mockResult,
        isDemo: true,
      });
    }

    if (!imageBase64) {
      return NextResponse.json(
        { ok: false, code: "NO_IMAGE", message: "No receipt image provided." },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(imageBase64, "base64");

    console.log("Processing receipt via pure Tesseract OCR...");
    const ocrResult = await runTesseractOcr(imageBuffer);

    return NextResponse.json({
      ok: true,
      data: {
        ...ocrResult,
        engine: "tesseract",
      },
    });
  } catch (error: unknown) {
    console.error("Receipt Scan OCR Error:", error);
    const msg =
      error instanceof Error && error.message.includes("timed out")
        ? "OCR processing timed out. Please enter details manually or try a clearer photo."
        : error instanceof Error
        ? error.message
        : "Failed to scan and analyze receipt with OCR";

    return NextResponse.json(
      {
        ok: false,
        code: "OCR_ERROR",
        message: msg,
      },
      { status: 422 }
    );
  }
}
