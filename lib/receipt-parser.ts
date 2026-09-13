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

// Popular recognized merchants to boost accuracy
const KNOWN_MERCHANTS: Record<string, { name: string; category: string }> = {
  jollibee: { name: "Jollibee", category: "Food & Dining" },
  mcdonald: { name: "McDonald's", category: "Food & Dining" },
  mcdo: { name: "McDonald's", category: "Food & Dining" },
  kfc: { name: "KFC", category: "Food & Dining" },
  chowking: { name: "Chowking", category: "Food & Dining" },
  inasal: { name: "Mang Inasal", category: "Food & Dining" },
  greenwich: { name: "Greenwich", category: "Food & Dining" },
  starbucks: { name: "Starbucks", category: "Food & Dining" },
  tokyo: { name: "Tokyo Tokyo", category: "Food & Dining" },
  burger: { name: "Burger King", category: "Food & Dining" },
  subway: { name: "Subway", category: "Food & Dining" },
  bonchon: { name: "BonChon", category: "Food & Dining" },
  shakey: { name: "Shakey's", category: "Food & Dining" },
  pizza: { name: "Pizza Hut", category: "Food & Dining" },
  dunkin: { name: "Dunkin'", category: "Food & Dining" },
  krispy: { name: "Krispy Kreme", category: "Food & Dining" },
  tim: { name: "Tim Hortons", category: "Food & Dining" },

  // Supermarkets & Retail
  "sm super": { name: "SM Supermarket", category: "Groceries" },
  "sm hyper": { name: "SM Hypermarket", category: "Groceries" },
  savemore: { name: "Savemore Market", category: "Groceries" },
  puregold: { name: "Puregold", category: "Groceries" },
  robinsons: { name: "Robinsons Supermarket", category: "Groceries" },
  waltermart: { name: "Waltermart", category: "Groceries" },
  landers: { name: "Landers Superstore", category: "Groceries" },
  "s&r": { name: "S&R Membership Shopping", category: "Groceries" },
  allday: { name: "AllDay Supermarket", category: "Groceries" },
  "7-eleven": { name: "7-Eleven", category: "Groceries" },
  "7 eleven": { name: "7-Eleven", category: "Groceries" },
  ministop: { name: "Uncle John's", category: "Groceries" },
  "uncle john": { name: "Uncle John's", category: "Groceries" },
  lawson: { name: "Lawson", category: "Groceries" },
  familymart: { name: "FamilyMart", category: "Groceries" },

  // Pharmacy & Health
  mercury: { name: "Mercury Drug", category: "Healthcare" },
  watson: { name: "Watsons", category: "Healthcare" },
  southstar: { name: "Southstar Drug", category: "Healthcare" },
  rose: { name: "Rose Pharmacy", category: "Healthcare" },
  generika: { name: "Generika Drugstore", category: "Healthcare" },

  // Gas & Transport
  shell: { name: "Shell", category: "Transportation" },
  petron: { name: "Petron", category: "Transportation" },
  caltex: { name: "Caltex", category: "Transportation" },
  cleanfuel: { name: "Cleanfuel", category: "Transportation" },
  seaoil: { name: "Seaoil", category: "Transportation" },
  unioil: { name: "Unioil", category: "Transportation" },
  phoenix: { name: "Phoenix Petroleum", category: "Transportation" },
  grab: { name: "Grab", category: "Transportation" },

  // Retail & Shopping
  uniqlo: { name: "Uniqlo", category: "Shopping" },
  zara: { name: "Zara", category: "Shopping" },
  "h&m": { name: "H&M", category: "Shopping" },
  hardware: { name: "Ace Hardware", category: "Shopping" },
  handyman: { name: "Handyman", category: "Shopping" },
};

// Lines that indicate non-merchant receipt header noise
const HEADER_NOISE = [
  "official receipt",
  "sales invoice",
  "tax invoice",
  "provisional receipt",
  "customer copy",
  "merchant copy",
  "store copy",
  "cashier copy",
  "duplicate",
  "original",
  "welcome",
  "thank you",
  "have a nice day",
  "pos provider",
  "tin:",
  "vat reg",
  "permit no",
  "machine no",
  "min no",
  "serial no",
  "terminal",
  "cashier:",
  "operator:",
  "reg no",
  "tel:",
  "phone:",
  "fax:",
  "address:",
  "table:",
  "guest:",
];

/**
 * Parses raw OCR text into structured ExtractedReceiptData.
 */
export function parseReceiptText(rawText: string): ExtractedReceiptData {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const cleanText = lines.join("\n");

  // 1. Merchant Detection
  let detectedMerchant = "";
  let categoryHint = "General";

  // Check against known merchants in first 12 lines
  const topLines = lines.slice(0, 12);
  for (const line of topLines) {
    const lower = line.toLowerCase();
    for (const [key, val] of Object.entries(KNOWN_MERCHANTS)) {
      if (lower.includes(key)) {
        detectedMerchant = val.name;
        categoryHint = val.category;
        break;
      }
    }
    if (detectedMerchant) break;
  }

  // Fallback merchant detection: first non-noise line with alphabetic text
  if (!detectedMerchant) {
    for (const line of topLines) {
      const lower = line.toLowerCase();
      const isNoise = HEADER_NOISE.some((noise) => lower.includes(noise));
      // Must contain at least 3 letters and not be primarily numbers
      const letterCount = (line.match(/[a-zA-Z]/g) || []).length;
      if (!isNoise && letterCount >= 3 && line.length <= 40) {
        // Strip non-alphanumeric trailing garbage
        detectedMerchant = line.replace(/^[^\w]+|[^\w]+$/g, "");
        break;
      }
    }
  }

  if (!detectedMerchant) {
    detectedMerchant = "Receipt Expense";
  }

  // 2. Total Amount Detection
  let detectedAmount = 0;

  // Patterns for explicit total keywords
  const totalKeywords = [
    /(?:grand\s*total|total\s*amount|total\s*due|amount\s*due|net\s*total|net\s*amount|amount\s*paid|total)\s*[:=]?\s*[₱P\$]?\s*(\d{1,6}(?:[.,]\d{2}))/i,
    /(?:grand\s*total|total\s*amount|total\s*due|amount\s*due|net\s*total|net\s*amount|amount\s*paid|total)\s*[:=]?\s*PHP\s*(\d{1,6}(?:[.,]\d{2}))/i,
    /(?:php|₱)\s*(\d{1,6}(?:[.,]\d{2}))/i,
  ];

  // Pass 1: Search specifically for total line in bottom 70% of receipt
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    for (const pattern of totalKeywords) {
      const match = line.match(pattern);
      if (match && match[1]) {
        const val = parseFloat(match[1].replace(",", "."));
        if (!isNaN(val) && val > 0 && val < 500000) {
          detectedAmount = val;
          break;
        }
      }
    }
    if (detectedAmount > 0) break;
  }

  // Pass 2: Search for standalone lines with "TOTAL" and check subsequent lines
  if (detectedAmount === 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes("total") && !line.includes("subtotal") && !line.includes("item")) {
        // Look in this line and next 2 lines for money pattern
        for (let j = i; j <= Math.min(i + 2, lines.length - 1); j++) {
          const moneyMatch = lines[j].match(/(\d{1,6}[.,]\d{2})/);
          if (moneyMatch) {
            const val = parseFloat(moneyMatch[1].replace(",", "."));
            if (!isNaN(val) && val > 0 && val < 500000) {
              detectedAmount = val;
              break;
            }
          }
        }
      }
      if (detectedAmount > 0) break;
    }
  }

  // Pass 3: Fallback to largest reasonable 2-decimal amount found in lines
  if (detectedAmount === 0) {
    const allAmounts: number[] = [];
    for (const line of lines) {
      const matches = line.matchAll(/\b(\d{1,6}[.,]\d{2})\b/g);
      for (const m of matches) {
        const val = parseFloat(m[1].replace(",", "."));
        // Filter out plausible years (2024, 2025, 2026) if without cents
        if (!isNaN(val) && val > 0 && val < 500000) {
          allAmounts.push(val);
        }
      }
    }
    if (allAmounts.length > 0) {
      allAmounts.sort((a, b) => b - a);
      detectedAmount = allAmounts[0];
    }
  }

  // 3. Date Detection
  let detectedDate = "";
  const datePatterns = [
    /\b(202\d[-/.](?:0[1-9]|1[0-2])[-/.](?:0[1-9]|[12]\d|3[01]))\b/, // YYYY-MM-DD
    /\b((?:0[1-9]|[12]\d|3[01])[-/.](?:0[1-9]|1[0-2])[-/.](?:202\d|2\d))\b/, // DD/MM/YYYY or DD/MM/YY
    /\b((?:0[1-9]|1[0-2])[-/.](?:0[1-9]|[12]\d|3[01])[-/.](?:202\d|2\d))\b/, // MM/DD/YYYY
    /\b((?:0[1-9]|[12]\d|3[01])\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*202\d)\b/i, // DD MMM YYYY
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(?:0[1-9]|[12]\d|3[01]),?\s*202\d)\b/i, // MMM DD, YYYY
  ];

  for (const line of lines) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        const rawDate = match[1].replace(/\//g, "-").replace(/\./g, "-");
        const parsed = Date.parse(rawDate);
        if (!isNaN(parsed)) {
          detectedDate = new Date(parsed).toISOString().split("T")[0];
          break;
        }
      }
    }
    if (detectedDate) break;
  }

  if (!detectedDate) {
    detectedDate = new Date().toISOString().split("T")[0];
  }

  // 4. Tax / VAT Extraction
  let detectedTax: number | undefined = undefined;
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes("vat") || lower.includes("tax")) {
      const taxMatch = line.match(/(\d{1,5}[.,]\d{2})/);
      if (taxMatch) {
        const val = parseFloat(taxMatch[1].replace(",", "."));
        if (!isNaN(val) && val > 0 && val < detectedAmount) {
          detectedTax = val;
          break;
        }
      }
    }
  }

  // 5. Line Items Extraction
  const detectedItems: Array<{ name: string; price: number; quantity?: number }> = [];
  const ignoredKeywords = [
    "total",
    "subtotal",
    "cash",
    "change",
    "amount",
    "tendered",
    "balance",
    "discount",
    "vat",
    "tax",
    "due",
    "card",
    "visa",
    "mastercard",
    "payment",
    "tin:",
  ];

  for (const line of lines) {
    const lower = line.toLowerCase();
    const isIgnored = ignoredKeywords.some((k) => lower.includes(k));
    if (isIgnored) continue;

    // Pattern: [quantity] [item name] [price]
    const itemMatch = line.match(/^(?:(\d{1,2})\s*[xX]?\s+)?([a-zA-Z0-9\s\-&'.]{2,30})\s+([₱P\$]?\s*\d{1,5}[.,]\d{2})$/);
    if (itemMatch) {
      const qty = itemMatch[1] ? parseInt(itemMatch[1], 10) : 1;
      const name = itemMatch[2].trim();
      const priceVal = parseFloat(itemMatch[3].replace(/[₱P\$\s]/g, "").replace(",", "."));

      if (name.length >= 2 && !isNaN(priceVal) && priceVal > 0 && priceVal < detectedAmount) {
        detectedItems.push({
          name,
          price: Math.round(priceVal * 100) / 100,
          quantity: qty > 0 ? qty : 1,
        });
      }
    }
  }

  // 6. Category Inferences from items or merchant
  if (categoryHint === "General") {
    const lowerText = cleanText.toLowerCase();
    if (lowerText.match(/\b(food|chicken|burger|coffee|cafe|restaurant|tea|pizza|bake|bread|rice|meal|drink|dessert)\b/)) {
      categoryHint = "Food & Dining";
    } else if (lowerText.match(/\b(supermarket|grocery|market|fresh|vegetable|fruit|meat|egg|milk|shampoo|soap|detergent)\b/)) {
      categoryHint = "Groceries";
    } else if (lowerText.match(/\b(gas|fuel|diesel|petrol|parking|toll|fare|transport|auto|oil)\b/)) {
      categoryHint = "Transportation";
    } else if (lowerText.match(/\b(pharmacy|drug|medicine|pill|tablet|capsule|health|doctor|clinic|hospital)\b/)) {
      categoryHint = "Healthcare";
    } else if (lowerText.match(/\b(electric|power|water|internet|meralco|pldt|globe|smart|bill|utility)\b/)) {
      categoryHint = "Utilities";
    } else if (lowerText.match(/\b(clothing|shirt|pants|shoes|dress|mall|store|shop|book)\b/)) {
      categoryHint = "Shopping";
    }
  }

  // 7. Confidence Score
  let confidence: "high" | "medium" | "low" = "low";
  if (detectedMerchant !== "Receipt Expense" && detectedAmount > 0) {
    confidence = detectedItems.length > 0 ? "high" : "medium";
  } else if (detectedAmount > 0) {
    confidence = "medium";
  }

  // Extract brief invoice / OR number for notes
  let invoiceNote = "";
  const orMatch = cleanText.match(/\b(?:or|or#|inv|inv#|si|si#|order#|invoice#)\s*[:.]?\s*([a-zA-Z0-9\-]+)/i);
  if (orMatch && orMatch[1]) {
    invoiceNote = `OR# ${orMatch[1]}`;
  }

  return {
    merchant: detectedMerchant,
    amount: Math.round(detectedAmount * 100) / 100,
    date: detectedDate,
    categoryHint,
    type: "expense",
    tax: detectedTax ? Math.round(detectedTax * 100) / 100 : undefined,
    items: detectedItems,
    notes: invoiceNote || "Tesseract OCR scan",
    confidence,
    engine: "tesseract",
  };
}
