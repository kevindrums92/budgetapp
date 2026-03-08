/**
 * Input Type Selector
 * Allows user to choose between text, image, or voice input
 * Image option expands inline to show camera/gallery sub-options
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Mic, Camera, Type, Image as ImageIcon } from "lucide-react";
import type { BatchInputType } from "../types/batch-entry.types";
import {
  captureFromCamera,
  selectFromGallery,
} from "../services/imageCapture.service";
import { captureError } from "@/lib/sentry";

type Props = {
  onSelect: (type: BatchInputType) => void;
  onImageCaptured?: (imageBase64: string) => void;
};

type InputOption = {
  type: BatchInputType;
  icon: typeof Mic;
  translationKey: "voice" | "image" | "text";
  bgColor: string;
  iconBg: string;
  iconColor: string;
};

const INPUT_OPTIONS: InputOption[] = [
  {
    type: "text",
    icon: Type,
    translationKey: "text",
    bgColor: "bg-amber-50 dark:bg-amber-900/30",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    type: "image",
    icon: Camera,
    translationKey: "image",
    bgColor: "bg-blue-50 dark:bg-blue-900/30",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    type: "audio",
    icon: Mic,
    translationKey: "voice",
    bgColor: "bg-violet-50 dark:bg-violet-900/30",
    iconBg: "bg-violet-100 dark:bg-violet-900/50",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
];

export default function InputTypeSelector({ onSelect, onImageCaptured }: Props) {
  const { t } = useTranslation("batch");
  const [showImageOptions, setShowImageOptions] = useState(false);

  const handleImageSubOption = async (source: "camera" | "gallery") => {
    try {
      const base64 =
        source === "camera"
          ? await captureFromCamera()
          : await selectFromGallery();
      onImageCaptured?.(base64);
    } catch (err) {
      if (err instanceof Error && err.message.includes("cancelled")) return;
      captureError(err, { context: `imageCapture.${source}` });
    }
  };

  return (
    <div className="space-y-2">
      {INPUT_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isImage = option.type === "image";

        return (
          <div key={option.type}>
            <button
              type="button"
              onClick={() => {
                if (isImage) {
                  setShowImageOptions((prev) => !prev);
                } else {
                  onSelect(option.type);
                }
              }}
              className={`flex w-full items-center gap-4 rounded-2xl ${option.bgColor} px-4 py-4 transition-all active:scale-[0.98]`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${option.iconBg}`}
              >
                <Icon className={`h-6 w-6 ${option.iconColor}`} />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-gray-50">
                  {t(`inputTypes.${option.translationKey}.label`)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t(`inputTypes.${option.translationKey}.hint`)}
                </p>
              </div>
            </button>

            {/* Inline camera/gallery sub-options */}
            {isImage && showImageOptions && (
              <div className="mt-1.5 ml-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleImageSubOption("camera")}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 px-4 py-2.5 transition-all active:scale-[0.97]"
                >
                  <Camera className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    {t("imageInput.takePhoto")}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleImageSubOption("gallery")}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 px-4 py-2.5 transition-all active:scale-[0.97]"
                >
                  <ImageIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    {t("imageInput.selectGallery")}
                  </span>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
