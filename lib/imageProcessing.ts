/**
 * Image preprocessing module for high-accuracy Tesseract OCR.
 *
 * Pipeline:
 * Image (File / Blob / DataURL)
 *   ↓
 * Resize (Max Dimension with Aspect Ratio)
 *   ↓
 * Grayscale (Rec. 601 Luma)
 *   ↓
 * Increase Contrast (S-Curve stretching)
 *   ↓
 * Threshold / Sharpen (Unsharp mask & background cleaner)
 *   ↓
 * Processed Blob / DataURL
 */

export interface PreprocessOptions {
  maxDimension?: number;
  contrastFactor?: number;
  quality?: number;
}

export interface ProcessedImageResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Loads an image from a File, Blob, or DataURL string into an HTMLImageElement safely.
 */
function loadImage(source: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Image preprocessing can only run in the browser."));
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    let objectUrl: string | null = null;
    if (typeof source === "string") {
      img.src = source;
    } else {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    }

    const timeout = setTimeout(() => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error("Image loading timed out."));
    }, 10000);

    img.onload = () => {
      clearTimeout(timeout);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image for preprocessing."));
    };
  });
}

/**
 * Executes the full image processing pipeline on a receipt image.
 */
export async function preprocessReceiptImage(
  source: File | Blob | string,
  options: PreprocessOptions = {}
): Promise<ProcessedImageResult> {
  const {
    maxDimension = 1600,
    contrastFactor = 1.45,
    quality = 0.9,
  } = options;

  const img = await loadImage(source);

  // 1. Calculate Resize Dimensions while preserving aspect ratio
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  // Ensure reasonable minimum dimensions
  width = Math.max(10, width);
  height = Math.max(10, height);

  // 2. Draw to Canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Could not initialize 2D Canvas context for image preprocessing.");
  }

  // Draw scaled original image
  ctx.drawImage(img, 0, 0, width, height);

  // 3. Grayscale, Contrast & Sharpening
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const pixelCount = width * height;

  // Step A: Convert to Grayscale and apply S-Curve Contrast Enhancement
  const grayBuffer = new Float32Array(pixelCount);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    // Rec. 601 luma conversion
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

    // Contrast stretching centered at mid-gray (128)
    const contrasted = (gray - 128) * contrastFactor + 128;
    grayBuffer[p] = Math.min(255, Math.max(0, contrasted));
  }

  // Step B: Unsharp Mask / Text Edge Sharpening
  // Enhances small thermal dot-matrix character borders
  for (let y = 1; y < height - 1; y++) {
    const rowOffset = y * width;
    for (let x = 1; x < width - 1; x++) {
      const p = rowOffset + x;
      const current = grayBuffer[p];

      // 4-neighbor average
      const neighbors =
        (grayBuffer[p - 1] +
          grayBuffer[p + 1] +
          grayBuffer[p - width] +
          grayBuffer[p + width]) *
        0.25;

      // High-pass boost
      const diff = current - neighbors;
      const sharpened = current + diff * 0.45;
      const clamped = Math.min(255, Math.max(0, sharpened));

      const idx = p * 4;
      data[idx] = clamped;
      data[idx + 1] = clamped;
      data[idx + 2] = clamped;
      // data[idx + 3] remains alpha 255
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // 4. Export as both Blob and DataURL
  const dataUrl = canvas.toDataURL("image/png");

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Canvas toBlob export failed."));
      },
      "image/png",
      quality
    );
  });

  return {
    blob,
    dataUrl,
    width,
    height,
  };
}
