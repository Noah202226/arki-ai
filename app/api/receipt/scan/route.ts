import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ExtractedReceiptData } from "@/lib/receipt-parser";

export const runtime = "nodejs";
export const maxDuration = 30; // 30 seconds max for OCR

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const receiptSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    merchant: {
      type: Type.STRING,
      description: "The name of the merchant/store.",
    },
    amount: {
      type: Type.NUMBER,
      description: "The total amount of the receipt.",
    },
    date: {
      type: Type.STRING,
      description: "The date of the receipt in YYYY-MM-DD format.",
    },
    categoryHint: {
      type: Type.STRING,
      description: "A category hint for the receipt, like 'Food & Dining' or 'Groceries'.",
    },
    type: {
      type: Type.STRING,
      enum: ["expense", "income"],
      description: "Whether this is an expense or income. Usually 'expense'.",
    },
    tax: {
      type: Type.NUMBER,
      description: "The tax amount, if any. Leave undefined/null if none.",
      nullable: true,
    },
    items: {
      type: Type.ARRAY,
      description: "The list of items purchased.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "The name of the item.",
          },
          price: {
            type: Type.NUMBER,
            description: "The total price of this line item.",
          },
          quantity: {
            type: Type.NUMBER,
            description: "The quantity purchased.",
          },
        },
        required: ["name", "price"],
      },
    },
    notes: {
      type: Type.STRING,
      description: "Any extra notes, like invoice number or cash tendered.",
    },
    confidence: {
      type: Type.STRING,
      enum: ["high", "medium", "low"],
      description: "How confident you are in the extraction.",
    },
  },
  required: [
    "merchant",
    "amount",
    "date",
    "categoryHint",
    "type",
    "items",
    "notes",
    "confidence",
  ],
};

export async function POST(req: NextRequest) {
  try {
    let imageBase64 = "";
    let isMock = req.headers.get("x-mock-demo") === "true";
    let mimeType = "image/jpeg";

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
        mimeType = file.type || "image/jpeg";
        const arrayBuffer = await file.arrayBuffer();
        imageBase64 = Buffer.from(arrayBuffer).toString("base64");
      }
    }

    // Clean imageBase64 data URL prefix if present
    if (imageBase64.includes(",")) {
      const parts = imageBase64.split(",");
      const match = parts[0].match(/:(.*?);/);
      if (match) mimeType = match[1];
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

    console.log("Processing receipt via Gemini AI...");
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
            {
              text: "Extract the receipt details accurately. Pay special attention to the line items, their prices, and the grand total.",
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: receiptSchema,
        temperature: 0.1,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini.");
    }

    const ocrResult = JSON.parse(text) as ExtractedReceiptData;

    return NextResponse.json({
      ok: true,
      data: {
        ...ocrResult,
        engine: "gemini",
      },
    });
  } catch (error: unknown) {
    console.error("Receipt Scan AI Error:", error);
    const msg =
      error instanceof Error
        ? error.message
        : "Failed to scan and analyze receipt with AI";

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
