/**
 * Image Capture View Component
 * Captures or selects an image for receipt scanning
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Camera, Image as ImageIcon, Loader2, X, RotateCcw } from "lucide-react";
import {
  captureFromCamera,
  selectFromGallery,
  getImageDataUrl,
} from "../services/imageCapture.service";
import { captureError } from "@/lib/sentry";
import { useFakeProgress } from "../hooks/useFakeProgress";

type Props = {
  onImageCaptured: (imageBase64: string) => void;
  onCancel: () => void;
  isProcessing: boolean;
};

type CaptureState = "selecting" | "preview" | "error";

export default function ImageCaptureView({
  onImageCaptured,
  onCancel,
  isProcessing,
}: Props) {
  const { t } = useTranslation("batch");
  const [state, setState] = useState<CaptureState>("selecting");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fake progress for processing state
  const progress = useFakeProgress({ isProcessing });

  const handleCameraCapture = async () => {
    try {
      setError(null);
      const base64 = await captureFromCamera();
      setImageBase64(base64);
      setState("preview");
    } catch (err) {
      if (err instanceof Error && err.message.includes("cancelled")) {
        // User cancelled, stay on selection
        return;
      }
      captureError(err, { context: 'imageCapture.camera' });
      setError(err instanceof Error ? err.message : t("errors.captureError"));
      setState("error");
    }
  };

  const handleGallerySelect = async () => {
    try {
      setError(null);
      const base64 = await selectFromGallery();
      setImageBase64(base64);
      setState("preview");
    } catch (err) {
      if (err instanceof Error && err.message.includes("cancelled")) {
        // User cancelled, stay on selection
        return;
      }
      captureError(err, { context: 'imageCapture.gallery' });
      setError(err instanceof Error ? err.message : t("errors.selectError"));
      setState("error");
    }
  };

  const handleRetry = () => {
    setImageBase64(null);
    setError(null);
    setState("selecting");
  };

  const handleConfirm = () => {
    if (imageBase64) {
      onImageCaptured(imageBase64);
    }
  };

  // Show processing state
  if (isProcessing) {
    return (
      <div className="flex flex-col items-center py-8">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
        </div>
        <p className="text-base font-medium text-gray-900 dark:text-gray-50">
          {t("imageInput.processing")}
        </p>
        <p className="mt-1 mb-4 text-sm text-gray-500 dark:text-gray-400">
          {t("imageInput.extracting")} {progress}%
        </p>
        {/* Progress bar */}
        <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  // Error state
  if (state === "error") {
    return (
      <div className="flex flex-col items-center py-8">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
          <X className="h-10 w-10 text-red-500" />
        </div>
        <p className="text-base font-medium text-gray-900 dark:text-gray-50">{t("common.error")}</p>
        <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
          {error}
        </p>
        <button
          type="button"
          onClick={handleRetry}
          className="mt-4 rounded-xl bg-gray-100 dark:bg-gray-800 px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {t("common.retry")}
        </button>
      </div>
    );
  }

  // Preview state
  if (state === "preview" && imageBase64) {
    return (
      <div className="flex flex-col">
        {/* Image preview */}
        <div className="relative mb-4 overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800">
          <img
            src={getImageDataUrl(imageBase64)}
            alt={t("imageInput.capturedReceipt")}
            className="h-48 w-full object-contain"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleRetry}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all active:scale-[0.98]"
          >
            <RotateCcw className="h-4 w-4" />
            {t("imageInput.anotherImage")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-500 py-3 text-sm font-medium text-white transition-all active:scale-[0.98]"
          >
            {t("imageInput.analyze")}
          </button>
        </div>
      </div>
    );
  }

  // Selection state
  return (
    <div className="flex flex-col">
      <div className="mb-4 space-y-2">
        {/* Camera option */}
        <button
          type="button"
          onClick={handleCameraCapture}
          className="flex w-full items-center gap-4 rounded-2xl bg-blue-50 dark:bg-blue-900/30 px-4 py-4 transition-all active:scale-[0.98]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
            <Camera className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900 dark:text-gray-50">{t("imageInput.takePhoto")}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("imageInput.takePhotoDesc")}
            </p>
          </div>
        </button>

        {/* Gallery option */}
        <button
          type="button"
          onClick={handleGallerySelect}
          className="flex w-full items-center gap-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 px-4 py-4 transition-all active:scale-[0.98]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50">
            <ImageIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900 dark:text-gray-50">
              {t("imageInput.selectGallery")}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("imageInput.selectGalleryDesc")}
            </p>
          </div>
        </button>
      </div>

      {/* Cancel button */}
      <button
        type="button"
        onClick={onCancel}
        className="rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all active:scale-[0.98]"
      >
        {t("common.cancel")}
      </button>
    </div>
  );
}
