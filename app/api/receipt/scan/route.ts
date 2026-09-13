import { NextRequest, NextResponse } from "next/server";
import { createWorker } from "tesseract.js";
import { parseReceiptText, ExtractedReceiptData } from "@/lib/receipt-parser";

export const runtime = "nodejs";
export const maxDuration = 45; // 45 seconds max for OCR

// Reusable Tesseract worker promise
let tesseractWorkerPromise: Promise<any> | null = null;

async function getTesseractWorker() {
  if (!tesseractWorkerPromise) {
    tesseractWorkerPromise = (async () => {
      const worker = await createWorker("eng");
      return worker;
    })().catch((err) => {
      console.error("Failed to initialize Tesseract worker:", err);
      tesseractWorkerPromise = null;
      throw err;
    });
  }
  return tesseractWorkerPromise;
}

/**
 * Runs local Tesseract OCR on image buffer and parses structured receipt fields.
 */
async function runTesseractOcr(imageBuffer: Buffer): Promise<ExtractedReceiptData> {
  try {
    const worker = await getTesseractWorker();
    const ret = await worker.recognize(imageBuffer);
    const rawText = ret?.data?.text || "";
    return parseReceiptText(rawText);
  } catch (err) {
    console.warn("Tesseract worker error, retrying with fresh worker:", err);
    tesseractWorkerPromise = null;
    const worker = await getTesseractWorker();
    const ret = await worker.recognize(imageBuffer);
    const rawText = ret?.data?.text || "";
    return parseReceiptText(rawText);
  }
}

// In-memory cache for discovered Gemini models to save quota
let cachedModels: { key: string; models: Array<{ version: string; model: string }>; timestamp: number } | null = null;

async function getCandidateModels(apiKey: string): Promise<Array<{ version: string; model: string }>> {
  const now = Date.now();
  if (cachedModels && cachedModels.key === apiKey && now - cachedModels.timestamp < 30 * 60 * 1000) {
    return cachedModels.models;
  }

  const discovered: Array<{ version: string; model: string }> = [];

  for (const apiVersion of ["v1beta", "v1"]) {
    try {
      const listUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models?key=${apiKey}`;
      const res = await fetch(listUrl, { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.models)) {
          for (const m of data.models) {
            const methods = m.supportedGenerationMethods || [];
            if (methods.includes("generateContent")) {
              const cleanModel = String(m.name || "").replace(/^models\//, "");
              if (cleanModel) {
                discovered.push({ version: apiVersion, model: cleanModel });
              }
            }
          }
        }
      }
      if (discovered.length > 0) break;
    } catch (e) {
      console.warn(`ListModels check failed on ${apiVersion}:`, e);
    }
  }

  if (discovered.length > 0) {
    const priority = [
      "gemini-2.0-flash",
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash",
      "gemini-1.5-flash-002",
      "gemini-1.5-flash-001",
      "gemini-2.0-flash-lite",
      "gemini-1.5-flash-8b",
      "gemini-1.5-pro",
    ];

    discovered.sort((a, b) => {
      const aIdx = priority.findIndex((p) => a.model.toLowerCase().includes(p.toLowerCase()));
      const bIdx = priority.findIndex((p) => b.model.toLowerCase().includes(p.toLowerCase()));
      const aScore = aIdx === -1 ? 999 : aIdx;
      const bScore = bIdx === -1 ? 999 : bIdx;
      return aScore - bScore;
    });

    cachedModels = { key: apiKey, models: discovered, timestamp: now };
    return discovered;
  }

  const fallback = [
    { version: "v1beta", model: "gemini-2.0-flash" },
    { version: "v1beta", model: "gemini-1.5-flash-latest" },
    { version: "v1beta", model: "gemini-1.5-flash" },
    { version: "v1", model: "gemini-1.5-flash" },
    { version: "v1beta", model: "gemini-2.0-flash-lite" },
  ];

  cachedModels = { key: apiKey, models: fallback, timestamp: now };
  return fallback;
}

/**
 * Robustly parses a JSON object from model output text.
 */
function extractJsonFromModelOutput(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Empty response from AI model.");
  }

  try {
    const direct = JSON.parse(trimmed);
    if (typeof direct === "object" && direct !== null && !Array.isArray(direct)) {
      return direct as Record<string, unknown>;
    }
  } catch {}

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    try {
      const parsed = JSON.parse(fenceMatch[1].trim());
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {}
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidateJson = trimmed.substring(firstBrace, lastBrace + 1);
    try {
      const parsed = JSON.parse(candidateJson);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {}
  }

  throw new Error(`Could not parse valid JSON from AI response: "${trimmed.slice(0, 100)}..."`);
}

export async function POST(req: NextRequest) {
  try {
    let imageBase64 = "";
    let mimeType = "image/jpeg";
    let customApiKey = req.headers.get("x-gemini-key") || "";
    let isMock = req.headers.get("x-mock-demo") === "true";
    let engine = req.headers.get("x-engine") || "auto"; // "auto" | "tesseract" | "gemini"

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      imageBase64 = body.imageBase64 || "";
      mimeType = body.mimeType || "image/jpeg";
      if (body.apiKey) customApiKey = body.apiKey;
      if (body.isMock) isMock = true;
      if (body.engine) engine = body.engine;
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const keyFromForm = formData.get("apiKey") as string | null;
      const mockFromForm = formData.get("isMock") as string | null;
      const engineFromForm = formData.get("engine") as string | null;

      if (keyFromForm) customApiKey = keyFromForm;
      if (mockFromForm === "true") isMock = true;
      if (engineFromForm) engine = engineFromForm;

      if (file) {
        mimeType = file.type || "image/jpeg";
        const arrayBuffer = await file.arrayBuffer();
        imageBase64 = Buffer.from(arrayBuffer).toString("base64");
      }
    }

    // Clean imageBase64 if it has data URL prefix
    if (imageBase64.includes(",")) {
      const parts = imageBase64.split(",");
      const match = parts[0].match(/:(.*?);/);
      if (match) mimeType = match[1];
      imageBase64 = parts[1];
    }

    // Demo / Mock Mode Handler
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

    const apiKey =
      customApiKey.trim() ||
      process.env.GEMINI_API_KEY?.trim() ||
      process.env.GOOGLE_API_KEY?.trim();

    // 1. Tesseract Direct Mode (or when no API key is provided)
    if (engine === "tesseract" || !apiKey) {
      console.log("Processing receipt with local Tesseract OCR engine...");
      const ocrResult = await runTesseractOcr(imageBuffer);
      return NextResponse.json({
        ok: true,
        data: {
          ...ocrResult,
          engine: "tesseract",
        },
      });
    }

    // 2. Gemini AI Vision Mode with automatic Tesseract Fallback
    const candidateModels = await getCandidateModels(apiKey);

    const systemPrompt = `You are an expert AI receipt scanner and financial data parser.
Analyze the provided receipt image carefully.
Extract:
1. Store / Merchant Name: Clean brand/business name (e.g. "SM Supermarket", "7-Eleven", "Mercury Drug", "Shell", "Starbucks", "Jollibee").
2. Total Amount: The final grand total paid by the customer (numeric value only, e.g. 249.50). Do NOT use cash tendered, change, or subtotal.
3. Date: Transaction date formatted as YYYY-MM-DD. If year is missing, assume current year. If date is completely illegible, use today's date (${new Date().toISOString().split("T")[0]}).
4. Category Hint: Recommend one of the following: "Food & Dining", "Groceries", "Utilities", "Transportation", "Shopping", "Healthcare", "Entertainment", "Services", "General".
5. Items: List purchased line items with their item name, unit/total price, and quantity (if discernible).
6. Tax / VAT: Total tax or VAT if itemized.
7. Notes: Brief string with receipt/invoice number, payment method (Cash, GCash, Maya, Visa), or cashier info.
8. Confidence: "high" if text is crisp and clear, "medium" if some lines are faint, "low" if heavily crumpled/blurred.

IMPORTANT: Respond ONLY with a valid JSON object adhering to this structure. Do NOT include any explanations, conversational text, or thoughts:
{
  "merchant": "Store Name",
  "amount": 123.45,
  "date": "YYYY-MM-DD",
  "categoryHint": "Category Name",
  "type": "expense",
  "tax": 12.34,
  "items": [
    { "name": "Item 1", "price": 50.0, "quantity": 1 }
  ],
  "notes": "Payment info or invoice #",
  "confidence": "high"
}`;

    let parsed: Record<string, unknown> | null = null;
    let lastError: Error | null = null;
    let isRateLimited = false;

    for (const { version, model } of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: imageBase64,
                    },
                  },
                  {
                    text: systemPrompt,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
            },
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          console.warn(`Gemini model ${version}/${model} returned ${response.status}:`, errBody);

          if (response.status === 429) {
            isRateLimited = true;
          }

          lastError = new Error(`Gemini API Error (${response.status}): ${errBody}`);
          continue;
        }

        const data = await response.json();
        const candidate = data?.candidates?.[0];
        const parts: Array<{ text?: string; thought?: boolean }> =
          candidate?.content?.parts || [];

        const nonThoughtParts = parts.filter(
          (p) => !p.thought && typeof p.text === "string" && p.text.trim().length > 0
        );

        let modelText = "";
        if (nonThoughtParts.length > 0) {
          modelText = nonThoughtParts.map((p) => p.text).join("\n");
        } else if (parts.length > 0) {
          const partWithJson = parts.find(
            (p) => typeof p.text === "string" && p.text.includes("{")
          );
          modelText = partWithJson?.text || parts[parts.length - 1]?.text || "";
        } else {
          modelText = candidate?.text || "";
        }

        if (!modelText) continue;

        parsed = extractJsonFromModelOutput(modelText);
        console.log(`Successfully extracted receipt with Gemini ${version}/${model}`);
        break;
      } catch (err: unknown) {
        console.warn(`Attempt failed with Gemini ${version}/${model}:`, err);
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    // If Gemini succeeded, return parsed data
    if (parsed) {
      let numericAmount = 0;
      if (typeof parsed.amount === "number") {
        numericAmount = parsed.amount;
      } else if (typeof parsed.amount === "string") {
        const sanitized = parsed.amount.replace(/[^0-9.]/g, "");
        numericAmount = parseFloat(sanitized) || 0;
      }

      let cleanDate = typeof parsed.date === "string" ? parsed.date : "";
      if (!cleanDate || isNaN(Date.parse(cleanDate))) {
        cleanDate = new Date().toISOString().split("T")[0];
      } else {
        cleanDate = new Date(cleanDate).toISOString().split("T")[0];
      }

      const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
      const items = rawItems.map((item) => {
        const it = (typeof item === "object" && item !== null ? item : {}) as Record<string, unknown>;
        return {
          name: String(it.name || "Item"),
          price: Number(it.price) || 0,
          quantity: Number(it.quantity) || 1,
        };
      });

      const result: ExtractedReceiptData = {
        merchant: String(parsed.merchant || "Receipt Merchant").trim(),
        amount: Math.round(numericAmount * 100) / 100,
        date: cleanDate,
        categoryHint: String(parsed.categoryHint || "General").trim(),
        type: "expense",
        tax: typeof parsed.tax === "number" ? parsed.tax : undefined,
        items,
        notes: String(parsed.notes || "").trim(),
        confidence: (parsed.confidence as "high" | "medium" | "low") || "medium",
        engine: "gemini",
      };

      return NextResponse.json({
        ok: true,
        data: result,
      });
    }

    // 3. Fallback: If Gemini failed (e.g. 429 rate limit or invalid key), run Tesseract OCR
    console.warn(
      `Gemini vision failed (${isRateLimited ? "429 Rate Limit" : lastError?.message}), falling back to Tesseract OCR...`
    );

    const fallbackResult = await runTesseractOcr(imageBuffer);
    return NextResponse.json({
      ok: true,
      data: {
        ...fallbackResult,
        engine: "tesseract",
      },
      fallbackFrom: "gemini",
      fallbackReason: isRateLimited ? "Gemini Rate Limit (429)" : "Gemini API unavailable",
    });
  } catch (error: unknown) {
    console.error("Receipt Scan Critical Error:", error);
    const msg = error instanceof Error ? error.message : "Failed to scan and analyze receipt";
    return NextResponse.json(
      {
        ok: false,
        code: "PROCESSING_ERROR",
        message: msg,
      },
      { status: 500 }
    );
  }
}
