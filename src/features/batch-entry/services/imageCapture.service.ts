/**
 * Image Capture Service
 * Handles camera/gallery capture and image compression
 */

import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import imageCompression from "browser-image-compression";

/** Compression options for receipt images */
const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1280,
  useWebWorker: true,
  initialQuality: 0.8,
};

/** Check camera permission */
export async function checkCameraPermission(): Promise<boolean> {
  try {
    const result = await Camera.checkPermissions();
    return result.camera === "granted" || result.camera === "limited";
  } catch (error) {
    console.error("[imageCapture] Error checking permission:", error);
    return false;
  }
}

/** Request camera permission */
export async function requestCameraPermission(): Promise<boolean> {
  try {
    const result = await Camera.requestPermissions({ permissions: ["camera", "photos"] });
    return result.camera === "granted" || result.camera === "limited";
  } catch (error) {
    console.error("[imageCapture] Error requesting permission:", error);
    return false;
  }
}

/** Capture photo from camera */
export async function captureFromCamera(): Promise<string> {
  console.log("[imageCapture] Capturing from camera...");

  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.Base64,
    source: CameraSource.Camera,
    correctOrientation: true,
  });

  if (!photo.base64String) {
    throw new Error("No se pudo capturar la imagen");
  }

  // Compress the image
  const compressed = await compressBase64Image(photo.base64String, photo.format || "jpeg");
  console.log("[imageCapture] Image captured and compressed");

  return compressed;
}

/** Select image from gallery */
export async function selectFromGallery(): Promise<string> {
  console.log("[imageCapture] Selecting from gallery...");

  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.Base64,
    source: CameraSource.Photos,
    correctOrientation: true,
  });

  if (!photo.base64String) {
    throw new Error("No se pudo seleccionar la imagen");
  }

  // Compress the image
  const compressed = await compressBase64Image(photo.base64String, photo.format || "jpeg");
  console.log("[imageCapture] Image selected and compressed");

  return compressed;
}

/** Let user choose between camera and gallery */
export async function captureImage(): Promise<string> {
  console.log("[imageCapture] Capturing image (prompt)...");

  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.Base64,
    source: CameraSource.Prompt, // Shows native picker
    correctOrientation: true,
    promptLabelHeader: "Seleccionar imagen",
    promptLabelPhoto: "Galería",
    promptLabelPicture: "Cámara",
  });

  if (!photo.base64String) {
    throw new Error("No se pudo obtener la imagen");
  }

  // Compress the image
  const compressed = await compressBase64Image(photo.base64String, photo.format || "jpeg");
  console.log("[imageCapture] Image obtained and compressed");

  return compressed;
}

/** Compress a base64 image string */
async function compressBase64Image(base64: string, format: string): Promise<string> {
  console.log("[imageCapture] Compressing image...");

  // Convert base64 to File
  const mimeType = `image/${format === "jpg" ? "jpeg" : format}`;
  const byteString = atob(base64);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }

  const blob = new Blob([arrayBuffer], { type: mimeType });
  const file = new File([blob], `image.${format}`, { type: mimeType });

  // Log original size
  const originalSizeKB = Math.round(file.size / 1024);
  console.log(`[imageCapture] Original size: ${originalSizeKB} KB`);

  // Compress
  const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS);

  // Log compressed size
  const compressedSizeKB = Math.round(compressedFile.size / 1024);
  const reduction = Math.round((1 - compressedFile.size / file.size) * 100);
  console.log(
    `[imageCapture] Compressed size: ${compressedSizeKB} KB (${reduction}% reduction)`
  );

  // Convert back to base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = result.split(",")[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(compressedFile);
  });
}

/** Get a data URL from base64 for preview */
export function getImageDataUrl(base64: string, format = "jpeg"): string {
  return `data:image/${format};base64,${base64}`;
}
