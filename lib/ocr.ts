/**
 * Dedicated client-side OCR execution module using Tesseract.js.
 *
 * Designed for Next.js:
 * - Dynamic import inside client functions prevents SSR errors.
 * - Guarantees worker cleanup with `finally { await worker.terminate(); }`.
 * - Granular progress events for multi-step UI indicators.
 */

export interface OCRProgressEvent {
  stage: "initializing" | "loading_model" | "recognizing" | "completed";
  progress: number; // 0.0 to 1.0
  percent: number; // 0 to 100
  message: string;
}

/**
 * Runs client-side Tesseract.js in a Web Worker with live progress callbacks.
 *
 * @param image Blob or DataURL of the preprocessed receipt
 * @param onProgress Callback receiving structured progress events
 * @returns Raw extracted OCR text
 */
export async function performOCR(
  image: Blob | string,
  onProgress?: (event: OCRProgressEvent) => void
): Promise<string> {
  onProgress?.({
    stage: "initializing",
    progress: 0.05,
    percent: 5,
    message: "Initializing OCR engine...",
  });

  // Dynamically import tesseract.js inside client function (safe for Next.js)
  const { createWorker } = await import("tesseract.js");

  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      if (m.status === "recognizing text") {
        const p = typeof m.progress === "number" ? m.progress : 0;
        const pct = Math.round(p * 100);
        onProgress?.({
          stage: "recognizing",
          progress: p,
          percent: pct,
          message: `Reading receipt text: ${pct}%`,
        });
      } else if (m.status === "loading language traineddata") {
        const p = typeof m.progress === "number" ? m.progress : 0;
        const pct = Math.round(p * 100);
        onProgress?.({
          stage: "loading_model",
          progress: p,
          percent: pct,
          message: `Loading language model: ${pct}%`,
        });
      } else if (m.status === "loading tesseract core") {
        onProgress?.({
          stage: "initializing",
          progress: 0.1,
          percent: 10,
          message: "Loading OCR core...",
        });
      }
    },
  });

  try {
    const ret = await worker.recognize(image);
    const rawText = ret?.data?.text || "";

    onProgress?.({
      stage: "completed",
      progress: 1.0,
      percent: 100,
      message: "Text recognition complete",
    });

    return rawText;
  } finally {
    try {
      await worker.terminate();
    } catch {}
  }
}
