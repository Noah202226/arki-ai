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
  "7-11": { name: "7-Eleven", category: "Groceries" },
  "7/11": { name: "7-Eleven", category: "Groceries" },
  "7eleven": { name: "7-Eleven", category: "Groceries" },
  seven: { name: "7-Eleven", category: "Groceries" },
  "philippine seven": { name: "7-Eleven", category: "Groceries" },
  "aling pinay": { name: "7-Eleven", category: "Groceries" },
  "convenience store": { name: "7-Eleven", category: "Groceries" },
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

  // Check top 15 lines first against known merchants
  const topLines = lines.slice(0, 15);
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

  // Handle OCR distortion (e.g. "ns sev" or partial logo artifacts)
  if (!detectedMerchant) {
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (
        lower.includes("7-eleven") ||
        lower.includes("7 eleven") ||
        lower.includes("seven") ||
        lower.includes("aling pinay") ||
        lower.includes("philippine seven") ||
        /\b(?:ns\s+)?sev(?:en)?\b/i.test(lower)
      ) {
        detectedMerchant = "7-Eleven";
        categoryHint = "Groceries";
        break;
      }
    }
  }

  // Fallback merchant detection: first non-noise line with alphabetic text
  if (!detectedMerchant) {
    for (const line of topLines) {
      const lower = line.toLowerCase();
      const isNoise = HEADER_NOISE.some((noise) => lower.includes(noise));
      const letterCount = (line.match(/[a-zA-Z]/g) || []).length;
      if (!isNoise && letterCount >= 3 && line.length <= 40) {
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

  const totalKeywords = [
    // Matches "Total Amount Due (7) 103.00", "Total Amount: 103.00", "Total Due: 103.00", etc.
    /(?:grand\s*total|total\s*amount(?:\s*due)?|total\s*due|amount\s*due|net\s*total|net\s*amount|amount\s*paid|total\s*bill)(?:[^\d\n\r]{0,35})[₱P\$]?\s*(\d{1,6}(?:[.,]\d{2}))/i,
    // Matches "Total ... (7) 103.00" specifically with item count in parentheses
    /(?:total|amount|due)[^\d\n\r]{0,25}\(\s*\d+\s*\)[^\d\n\r]{0,20}[₱P\$]?\s*(\d{1,6}(?:[.,]\d{2}))/i,
    // Payment tender lines e.g. "Card 103.00", "AUTHCODE: 410195 103.00", "Cash 103.00"
    /(?:^|\s)(?:card|debit|credit|authcode[^\d\n\r]{0,15}|gcash|maya|grabpay)\s*[:=]?[^\d\n\r]{0,15}[₱P\$]?\s*(\d{1,6}(?:[.,]\d{2}))/i,
    // Currency prefix e.g. "PHP 103.00" or "₱ 103.00"
    /(?:php|₱)\s*(\d{1,6}(?:[.,]\d{2}))/i,
  ];

  // Pass 1: Search specifically for total line in bottom 75% of receipt in reverse
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
    /\b(202\d[-/.](?:0?[1-9]|1[0-2])[-/.](?:0?[1-9]|[12]\d|3[01]))\b/, // YYYY-MM-DD
    /\b((?:0?[1-9]|1[0-2])[-/.](?:0?[1-9]|[12]\d|3[01])[-/.](?:202\d|2\d))\b/, // MM/DD/YYYY
    /\b((?:0?[1-9]|[12]\d|3[01])[-/.](?:0?[1-9]|1[0-2])[-/.](?:202\d|2\d))\b/, // DD/MM/YYYY
    /\b((?:0?[1-9]|[12]\d|3[01])\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*202\d)\b/i,
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(?:0?[1-9]|[12]\d|3[01]),?\s*202\d)\b/i,
  ];

  for (const line of lines) {
    // Strip bracketed day tags e.g. "(Sun)", "(5un)", "[Sun]"
    const cleanedLine = line.replace(/[\(\[][^\)\]]*[\)\]]/g, " ");
    for (const pattern of datePatterns) {
      const match = cleanedLine.match(pattern);
      if (match && match[1]) {
        const rawDate = match[1].replace(/\//g, "-").replace(/\./g, "-");
        const parts = rawDate.split("-");
        if (parts.length === 3) {
          // Normalize MM/DD/YYYY or DD/MM/YYYY or YYYY-MM-DD
          let yyyy = parts[0].length === 4 ? parts[0] : parts[2];
          if (yyyy.length === 2) yyyy = `20${yyyy}`;
          const mm = parts[0].length === 4 ? parts[1].padStart(2, "0") : parts[0].padStart(2, "0");
          const dd = parts[0].length === 4 ? parts[2].padStart(2, "0") : parts[1].padStart(2, "0");
          detectedDate = `${yyyy}-${mm}-${dd}`;
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
        if (!isNaN(val) && val > 0 && val < (detectedAmount || 500000)) {
          detectedTax = val;
          break;
        }
      }
    }
  }

  // 5. Line Items Extraction (Multi-tier: Linear scan + Multi-line pairing + Zonal fallback)
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
    "invoice",
    "receipt",
    "store#",
    "staff:",
    "authcode",
    "vatable",
    "zero_rated",
    "exempt",
    "reset_cnt",
    "min #",
    "sn#",
    "loyalty",
    "permit",
    "thank you",
    "welcome",
    "philippine seven",
  ];

  // Helper A: Extract trailing line price e.g. "JbMTortangChorizo 79.00V" or "Chickenjoy 220.00"
  const extractTrailingPrice = (
    line: string
  ): { name: string; price: number; quantity: number } | null => {
    const lower = line.toLowerCase();
    if (ignoredKeywords.some((k) => lower.includes(k))) return null;

    // Matches [optional qty]? [Item Name] [Price][VAT tag]?
    const priceRegex =
      /^(?:(\d{1,2})\s*[xX*@]\s+)?(.*?)(?:\s{1,}|[:=])([₱P\$]?\s*\d{1,6}[.,]\d{2})(?:\s*[vVtTnNyY*#%/\\]|\s+vat|\s+tax)?\s*$/i;
    const match = line.match(priceRegex);
    if (!match) return null;

    const qty = match[1] ? parseInt(match[1], 10) : 1;
    const rawName = match[2].trim();
    const rawPrice = match[3].replace(/[₱P\$\s]/g, "").replace(",", ".");
    const priceVal = parseFloat(rawPrice);

    if (isNaN(priceVal) || priceVal <= 0) return null;

    const name = rawName
      .replace(/^[^a-zA-Z0-9]+/, "")
      .replace(/[^a-zA-Z0-9\s\-&'().,/+]+$/g, "")
      .trim();

    const letterCount = (name.match(/[a-zA-Z]/g) || []).length;
    if (name.length < 2 || letterCount === 0) return null;

    if (detectedAmount > 0 && priceVal > detectedAmount * 1.05) return null;

    return {
      name,
      price: Math.round(priceVal * 100) / 100,
      quantity: qty > 0 ? qty : 1,
    };
  };

  // Helper B: Extract multi-line unit price, quantity, and total
  const extractMultiLinePrice = (
    line: string
  ): { qty: number; unitPrice?: number; total: number } | null => {
    const lower = line.toLowerCase();
    if (ignoredKeywords.some((k) => lower.includes(k))) return null;

    // Pattern 1: UnitPrice X Qty LineTotal (e.g. "4.00 X 6 24.00V")
    const pattern1 = /(\d+(?:[.,]\d{1,2})?)\s*[xX*@]\s*(\d+)\s+([₱P\$]?\s*\d{1,6}[.,]\d{2})/i;
    const m1 = line.match(pattern1);
    if (m1) {
      const unitPrice = parseFloat(m1[1].replace(",", "."));
      const qty = parseInt(m1[2], 10) || 1;
      const total = parseFloat(m1[3].replace(/[₱P\$\s]/g, "").replace(",", "."));
      if (!isNaN(total) && total > 0) {
        return { qty, unitPrice, total: Math.round(total * 100) / 100 };
      }
    }

    // Pattern 2: Qty X UnitPrice LineTotal (e.g. "6 X 4.00 24.00V" or "6 @ 4.00 24.00")
    const pattern2 = /(\d+)\s*[xX*@]\s*(\d+(?:[.,]\d{1,2})?)\s+([₱P\$]?\s*\d{1,6}[.,]\d{2})/i;
    const m2 = line.match(pattern2);
    if (m2) {
      const qty = parseInt(m2[1], 10) || 1;
      const unitPrice = parseFloat(m2[2].replace(",", "."));
      const total = parseFloat(m2[3].replace(/[₱P\$\s]/g, "").replace(",", "."));
      if (!isNaN(total) && total > 0) {
        return { qty, unitPrice, total: Math.round(total * 100) / 100 };
      }
    }

    // Pattern 3: Standalone price on separate line (e.g. "79.00V" or "₱79.00" or "24.00")
    const pattern3 = /^[₱P\$]?\s*(\d{1,6}[.,]\d{2})(?:\s*[vVtTnNyY*#%/\\]|\s+vat|\s+tax)?\s*$/i;
    const m3 = line.match(pattern3);
    if (m3) {
      const total = parseFloat(m3[1].replace(",", "."));
      if (!isNaN(total) && total > 0) {
        return { qty: 1, total: Math.round(total * 100) / 100 };
      }
    }

    return null;
  };

  // Pass 1: Linear Scan (Same-line and adjacent-line pairings)
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const cleanedLine = rawLine.replace(/^[^a-zA-Z0-9₱P\$]+/, "").trim();
    const lower = cleanedLine.toLowerCase();

    if (ignoredKeywords.some((k) => lower.includes(k))) continue;

    // Check 3-line pattern: Line i is description, Line i+1 is multiplier (e.g. "4.00 X 6"), Line i+2 is line total (e.g. "24.00V")
    if (i + 2 < lines.length) {
      const line1 = lines[i + 1].replace(/^[^a-zA-Z0-9₱P\$]+/, "").trim();
      const line2 = lines[i + 2].replace(/^[^a-zA-Z0-9₱P\$]+/, "").trim();

      const multMatch = line1.match(
        /^(?:(\d+(?:[.,]\d{1,2})?)\s*[xX*@]\s*(\d+)|(\d+)\s*[xX*@]\s*(\d+(?:[.,]\d{1,2})?))\s*$/i
      );
      const totalMatch = line2.match(
        /^[₱P\$]?\s*(\d{1,6}[.,]\d{2})(?:\s*[vVtTnNyY*#%/\\]|\s+vat|\s+tax)?\s*$/i
      );

      const hasLetters = /[a-zA-Z]/.test(cleanedLine);
      const isNotPriceLine = !/^[₱P\$]?\s*\d{1,6}[.,]\d{2}/.test(cleanedLine);

      if (multMatch && totalMatch && hasLetters && isNotPriceLine && cleanedLine.length >= 2) {
        const totalVal = parseFloat(totalMatch[1].replace(",", "."));
        const qty = multMatch[2]
          ? parseInt(multMatch[2], 10)
          : multMatch[3]
          ? parseInt(multMatch[3], 10)
          : 1;

        const name = cleanedLine
          .replace(/^[^a-zA-Z0-9]+/, "")
          .replace(/[^a-zA-Z0-9\s\-&'().,/+]+$/g, "")
          .trim();

        if (name.length >= 2 && !isNaN(totalVal) && totalVal > 0) {
          detectedItems.push({
            name,
            price: Math.round(totalVal * 100) / 100,
            quantity: qty > 0 ? qty : 1,
          });
          i += 2; // Skip consumed lines
          continue;
        }
      }
    }

    // Check adjacent line pairing: Line i is description, Line i+1 is quantity/price info
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1].replace(/^[^a-zA-Z0-9₱P\$]+/, "").trim();
      const multiInfo = extractMultiLinePrice(nextLine);

      const hasLetters = /[a-zA-Z]/.test(cleanedLine);
      const isNotPriceLine = !/^[₱P\$]?\s*\d{1,6}[.,]\d{2}/.test(cleanedLine);

      if (multiInfo && hasLetters && isNotPriceLine && cleanedLine.length >= 2) {
        const name = cleanedLine
          .replace(/^[^a-zA-Z0-9]+/, "")
          .replace(/[^a-zA-Z0-9\s\-&'().,/+]+$/g, "")
          .trim();

        if (name.length >= 2) {
          detectedItems.push({
            name,
            price: multiInfo.total,
            quantity: multiInfo.qty,
          });
          i++; // Skip the consumed next line
          continue;
        }
      }
    }

    // Single-line item check
    const singleItem = extractTrailingPrice(cleanedLine);
    if (singleItem) {
      detectedItems.push(singleItem);
    }
  }

  // Pass 2: Receipt Body Zone Extraction Fallback
  // If linear regexes missed items on a complex/noisy receipt, isolate the body between header & totals
  if (detectedItems.length === 0 && detectedAmount > 0) {
    let bodyStart = -1;
    let bodyEnd = -1;

    const headerMarkers = [
      "staff:", "staff", "cashier:", "cashier", "operator:", "store#",
      "invoice", "min #", "sn#", "terminal", "station"
    ];
    for (let i = 0; i < lines.length; i++) {
      const lower = lines[i].toLowerCase();
      if (headerMarkers.some((m) => lower.includes(m))) {
        bodyStart = i + 1;
      }
    }

    const footerMarkers = [
      "total amount", "grand total", "total due", "amount due", "net total",
      "subtotal", "total bill", "total", "cash", "card", "vatable"
    ];
    for (let i = Math.max(0, bodyStart); i < lines.length; i++) {
      const lower = lines[i].toLowerCase();
      if (footerMarkers.some((m) => lower.includes(m))) {
        bodyEnd = i;
        break;
      }
    }

    if (bodyStart !== -1 && bodyEnd !== -1 && bodyEnd > bodyStart) {
      const bodyLines = lines.slice(bodyStart, bodyEnd);
      let pendingName: string | null = null;

      for (let j = 0; j < bodyLines.length; j++) {
        const line = bodyLines[j].replace(/^[^a-zA-Z0-9₱P\$]+/, "").trim();
        const lower = line.toLowerCase();
        if (!line || ignoredKeywords.some((k) => lower.includes(k))) continue;

        const single = extractTrailingPrice(line);
        if (single) {
          detectedItems.push(single);
          pendingName = null;
          continue;
        }

        const multi = extractMultiLinePrice(line);
        if (multi && pendingName) {
          detectedItems.push({
            name: pendingName,
            price: multi.total,
            quantity: multi.qty,
          });
          pendingName = null;
          continue;
        }

        const letterCount = (line.match(/[a-zA-Z]/g) || []).length;
        if (letterCount >= 3) {
          pendingName = line
            .replace(/^[^a-zA-Z0-9]+/, "")
            .replace(/[^a-zA-Z0-9\s\-&'().,/+]+$/g, "")
            .trim();
        }
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

  // Extract brief invoice / OR number for notes (e.g. INVOICE #200204542 -> OR# 200204542)
  let invoiceNote = "";
  const orMatch = cleanText.match(
    /\b(?:invoice|order|inv|or|si)\s*(?:#|no\.?|num\.?)?\s*[:.]?\s*([0-9A-Za-z\-]{4,20})/i
  );
  if (orMatch && orMatch[1] && !/^(?:oice|er|der|ice)$/i.test(orMatch[1])) {
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
